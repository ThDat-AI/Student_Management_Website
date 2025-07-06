# reporting/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.db.models import Count, Q
import io
import openpyxl
from reportlab.pdfgen import canvas

from grading.models import DiemSo
from classes.models import LopHoc, LopHoc_MonHoc
from configurations.models import ThamSo
from subjects.models import MonHoc
from grading.models import HocKy


class BaoCaoMonHocView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        IDMonHoc = request.query_params.get("IDMonHoc")
        IDHocKy = request.query_params.get("IDHocKy")

        if not IDMonHoc or not IDHocKy:
            return Response({"detail": "Thiếu IDMonHoc hoặc IDHocKy"}, status=400)

        lop_ids = LopHoc_MonHoc.objects.filter(IDMonHoc=IDMonHoc).values_list("IDLopHoc", flat=True).distinct()
        lop_list = LopHoc.objects.filter(id__in=lop_ids)

        data = []

        for lop in lop_list:
            diem_list = DiemSo.objects.filter(
                IDLopHoc=lop.id, IDMonHoc=IDMonHoc, IDHocKy=IDHocKy
            )
            si_so = diem_list.count()
            so_luong_dat = 0

            for diem in diem_list:
                dtb = (diem.Diem15 + 2 * diem.Diem1Tiet) / 3 if diem.Diem15 is not None and diem.Diem1Tiet is not None else None
                try:
                    diem_dat_mon = ThamSo.objects.get(IDNienKhoa=diem.IDHocSinh.IDNienKhoaTiepNhan).DiemDatMon
                except ThamSo.DoesNotExist:
                    diem_dat_mon = 5.0
                if dtb is not None and dtb >= diem_dat_mon:
                    so_luong_dat += 1

            ti_le = (so_luong_dat / si_so) * 100 if si_so > 0 else 0

            if si_so > 0:
                data.append({
                    "TenLop": lop.TenLop,
                    "SiSo": si_so,
                    "SoLuongDat": so_luong_dat,
                    "TiLe": round(ti_le, 2),
                })

        return Response(data)


class ExportBaoCaoMonHocExcel(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        request._request.path = "/api/reporting/baocao/monhoc/"
        response = BaoCaoMonHocView().get(request)
        data = response.data

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["Lớp", "Sĩ số", "Số lượng đạt", "Tỉ lệ (%)"])
        for row in data:
            ws.append([row["TenLop"], row["SiSo"], row["SoLuongDat"], row["TiLe"]])

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        return HttpResponse(
            output,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=bao_cao_mon_hoc.xlsx"},
        )


class ExportBaoCaoMonHocPDF(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        request._request.path = "/api/reporting/baocao/monhoc/"
        response = BaoCaoMonHocView().get(request)
        data = response.data

        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)
        p.setFont("Helvetica", 12)
        p.drawString(100, 800, "BÁO CÁO TỔNG KẾT MÔN HỌC")

        y = 770
        for row in data:
            p.drawString(50, y, f"Lớp: {row['TenLop']} | Sĩ số: {row['SiSo']} | Đạt: {row['SoLuongDat']} | Tỉ lệ: {row['TiLe']}%")
            y -= 20

        p.showPage()
        p.save()
        buffer.seek(0)
        return HttpResponse(buffer, content_type='application/pdf')


class BaoCaoHocKyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        IDNienKhoa = request.query_params.get("IDNienKhoa")
        IDHocKy = request.query_params.get("IDHocKy")

        if not IDNienKhoa or not IDHocKy:
            return Response({"detail": "Thiếu IDNienKhoa hoặc IDHocKy"}, status=400)

        lop_list = LopHoc.objects.filter(IDNienKhoa=IDNienKhoa)
        data = []

        for lop in lop_list:
            diem_list = DiemSo.objects.filter(IDLopHoc=lop.id, IDHocKy=IDHocKy)
            hoc_sinh_ids = diem_list.values_list("IDHocSinh", flat=True).distinct()
            si_so = len(hoc_sinh_ids)
            so_luong_dat = 0

            for hs_id in hoc_sinh_ids:
                diem_hs = diem_list.filter(IDHocSinh_id=hs_id)
                diem_tbs = [
                    (d.Diem15 + 2 * d.Diem1Tiet) / 3
                    for d in diem_hs if d.Diem15 is not None and d.Diem1Tiet is not None
                ]
                if not diem_tbs:
                    continue

                diem_tb_hocky = sum(diem_tbs) / len(diem_tbs)

                try:
                    diem_dat_mon = ThamSo.objects.get(IDNienKhoa=IDNienKhoa).DiemDatMon
                except ThamSo.DoesNotExist:
                    diem_dat_mon = 5.0

                if diem_tb_hocky >= diem_dat_mon:
                    so_luong_dat += 1

            ti_le = (so_luong_dat / si_so) * 100 if si_so > 0 else 0

            if si_so > 0:
                data.append({
                    "TenLop": lop.TenLop,
                    "SiSo": si_so,
                    "SoLuongDat": so_luong_dat,
                    "TiLe": round(ti_le, 2),
                })

        return Response(data)


class ExportBaoCaoHocKyExcel(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        request._request.path = "/api/reporting/baocao/hocky/"
        response = BaoCaoHocKyView().get(request)
        data = response.data

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["Lớp", "Sĩ số", "Số lượng đạt", "Tỉ lệ (%)"])
        for row in data:
            ws.append([row["TenLop"], row["SiSo"], row["SoLuongDat"], row["TiLe"]])

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        return HttpResponse(
            output,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=bao_cao_hoc_ky.xlsx"},
        )