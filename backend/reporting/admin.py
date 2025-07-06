from django.contrib import admin
from .models import BaoCaoMonHoc, BaoCaoHocKy

@admin.register(BaoCaoMonHoc)
class BaoCaoMonHocAdmin(admin.ModelAdmin):
    list_display = ("IDMonHoc", "IDLopHoc", "IDHocKy", "IDNienKhoa", "SiSo", "SoLuongDat", "TiLe")
    raw_id_fields = ("IDMonHoc", "IDLopHoc", "IDHocKy", "IDNienKhoa")

@admin.register(BaoCaoHocKy)
class BaoCaoHocKyAdmin(admin.ModelAdmin):
    list_display = ("IDLopHoc", "IDHocKy", "IDNienKhoa", "SiSo", "SoLuongDat", "TiLe")
    raw_id_fields = ("IDLopHoc", "IDHocKy", "IDNienKhoa")
