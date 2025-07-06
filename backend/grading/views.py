# grading/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes

from django.http import HttpResponse
import openpyxl

from grading.models import DiemSo, HocKy
from grading.serializers import DiemSoSerializer, HocKySerializer, HocSinhDiemSerializer
from students.models import HocSinh
from classes.models import LopHoc_HocSinh, LopHoc_MonHoc
from configurations.models import ThamSo


# API lấy danh sách học sinh trong lớp kèm điểm (nếu có)
class DiemSoListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        IDNienKhoa = request.query_params.get('IDNienKhoa')
        IDLopHoc = request.query_params.get('IDLopHoc')
        IDMonHoc = request.query_params.get('IDMonHoc')
        IDHocKy = request.query_params.get('IDHocKy')

        if not all([IDNienKhoa, IDLopHoc, IDMonHoc, IDHocKy]):
            return Response({"detail": "Thiếu tham số"}, status=400)

        if not LopHoc_MonHoc.objects.filter(IDLopHoc_id=IDLopHoc, IDMonHoc_id=IDMonHoc).exists():
            return Response({"detail": "Môn học không thuộc lớp học này"}, status=400)

        hoc_sinh_ids = LopHoc_HocSinh.objects.filter(IDLopHoc_id=IDLopHoc).values_list("IDHocSinh_id", flat=True)
        hoc_sinh_list = HocSinh.objects.filter(id__in=hoc_sinh_ids, IDNienKhoaTiepNhan=IDNienKhoa)

        serializer = HocSinhDiemSerializer(
            hoc_sinh_list,
            many=True,
            context={
                'IDLopHoc': IDLopHoc,
                'IDMonHoc': IDMonHoc,
                'IDHocKy': IDHocKy,
            }
        )
        return Response(serializer.data)


# API cập nhật hoặc tạo mới điểm số cho học sinh
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cap_nhat_diem(request):
    data = request.data
    required_fields = ['IDHocSinh', 'IDLopHoc', 'IDMonHoc', 'IDHocKy']
    for f in required_fields:
        if f not in data:
            return Response({f: 'Trường này bắt buộc'}, status=400)

    diem15 = data.get('Diem15')
    diem1tiet = data.get('Diem1Tiet')

    if not LopHoc_MonHoc.objects.filter(IDLopHoc_id=data['IDLopHoc'], IDMonHoc_id=data['IDMonHoc']).exists():
        return Response({"detail": "Môn học không thuộc lớp học này"}, status=400)

    obj, _ = DiemSo.objects.get_or_create(
        IDHocSinh_id=data['IDHocSinh'],
        IDLopHoc_id=data['IDLopHoc'],
        IDMonHoc_id=data['IDMonHoc'],
        IDHocKy_id=data['IDHocKy']
    )

    obj.Diem15 = diem15
    obj.Diem1Tiet = diem1tiet

    if diem15 is not None and diem1tiet is not None:
        try:
            obj.DiemTB = round((float(diem15) + 2 * float(diem1tiet)) / 3, 2)
        except (ValueError, TypeError):
            obj.DiemTB = None
    else:
        obj.DiemTB = None

    obj.save()
    return Response(DiemSoSerializer(obj).data, status=status.HTTP_200_OK)


# API lấy danh sách học kỳ
class ListHocKyView(generics.ListAPIView):
    queryset = HocKy.objects.all()
    serializer_class = HocKySerializer
    permission_classes = [IsAuthenticated]


# API xuất Excel bảng điểm
class XuatExcelDiemSoAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        IDNienKhoa = request.query_params.get("IDNienKhoa")
        IDLopHoc = request.query_params.get("IDLopHoc")
        IDMonHoc = request.query_params.get("IDMonHoc")
        IDHocKy = request.query_params.get("IDHocKy")

        qs = DiemSo.objects.filter(
            IDLopHoc=IDLopHoc,
            IDMonHoc=IDMonHoc,
            IDHocKy=IDHocKy,
            IDHocSinh__IDNienKhoaTiepNhan=IDNienKhoa
        ).select_related("IDHocSinh")

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Bảng điểm"
        ws.append(["Họ tên", "Điểm 15 phút", "Điểm 1 tiết", "Điểm TB", "Kết quả"])

        diem_dat_mon = ThamSo.objects.last().DiemDatMon if ThamSo.objects.exists() else 5.0

        for d in qs:
            tb = (
                (d.Diem15 + 2 * d.Diem1Tiet) / 3
                if d.Diem15 is not None and d.Diem1Tiet is not None
                else None
            )
            ket_qua = "Đạt" if tb is not None and tb >= diem_dat_mon else "Không đạt"
            ho_ten = f"{d.IDHocSinh.Ho} {d.IDHocSinh.Ten}"

            ws.append([
                ho_ten,
                d.Diem15 or "",
                d.Diem1Tiet or "",
                f"{tb:.2f}" if tb is not None else "",
                ket_qua
            ])

        response = HttpResponse(content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response["Content-Disposition"] = "attachment; filename=bang_diem.xlsx"
        wb.save(response)
        return response
