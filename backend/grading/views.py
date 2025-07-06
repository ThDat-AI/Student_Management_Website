from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes

from grading.models import DiemSo, HocKy
from grading.serializers import DiemSoSerializer, HocKySerializer, HocSinhDiemSerializer
from students.models import HocSinh
from classes.models import LopHoc_HocSinh


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

        # Lấy danh sách học sinh thuộc lớp học
        hoc_sinh_ids = LopHoc_HocSinh.objects.filter(IDLopHoc_id=IDLopHoc).values_list("IDHocSinh_id", flat=True)
        hoc_sinh_list = HocSinh.objects.filter(id__in=hoc_sinh_ids, IDNienKhoaTiepNhan=IDNienKhoa)

        # Truyền context để serializer có thể lấy điểm tương ứng từng học sinh
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

    # Tạo hoặc lấy bản ghi điểm số
    obj, _ = DiemSo.objects.get_or_create(
        IDHocSinh_id=data['IDHocSinh'],
        IDLopHoc_id=data['IDLopHoc'],
        IDMonHoc_id=data['IDMonHoc'],
        IDHocKy_id=data['IDHocKy']
    )

    obj.Diem15 = diem15
    obj.Diem1Tiet = diem1tiet

    # Tính điểm TB
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
