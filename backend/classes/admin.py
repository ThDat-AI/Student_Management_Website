from django.contrib import admin
from .models import Khoi, LopHoc, LopHoc_HocSinh

@admin.register(Khoi)
class KhoiAdmin(admin.ModelAdmin):
    search_fields = ['TenKhoi']

@admin.register(LopHoc)
class LopHocAdmin(admin.ModelAdmin):
    search_fields = ['TenLop']
    list_display = ['TenLop', 'IDKhoi', 'IDNienKhoa']

@admin.register(LopHoc_HocSinh)
class LopHoc_HocSinhAdmin(admin.ModelAdmin):
    pass
