# grading/admin.py

from django.contrib import admin
from grading.models import HocKy, DiemSo

@admin.register(HocKy)
class HocKyAdmin(admin.ModelAdmin):
    search_fields = ['TenHocKy']

@admin.register(DiemSo)
class DiemSoAdmin(admin.ModelAdmin):
    list_display = ['IDHocSinh', 'IDLopHoc', 'IDMonHoc', 'IDHocKy', 'Diem15', 'Diem1Tiet']
    search_fields = ['IDHocSinh__Ho', 'IDHocSinh__Ten']
    list_filter = ['IDHocKy', 'IDLopHoc', 'IDMonHoc']
