from django.contrib import admin
from .models import Khoi, LopHoc, LopHoc_HocSinh, LopHoc_MonHoc

@admin.register(Khoi)
class KhoiAdmin(admin.ModelAdmin):
    search_fields = ['TenKhoi']


class LopHocMonHocInline(admin.TabularInline):
    model = LopHoc_MonHoc
    autocomplete_fields = ['IDMonHoc']
    extra = 1


class LopHocHocSinhInline(admin.TabularInline):
    model = LopHoc_HocSinh
    autocomplete_fields = ['IDHocSinh']
    extra = 1


@admin.register(LopHoc)
class LopHocAdmin(admin.ModelAdmin):
    search_fields = ['TenLop']
    list_display = ['TenLop', 'IDKhoi', 'IDNienKhoa']
    inlines = [LopHocMonHocInline, LopHocHocSinhInline]


@admin.register(LopHoc_HocSinh)
class LopHoc_HocSinhAdmin(admin.ModelAdmin):
    autocomplete_fields = ['IDLopHoc', 'IDHocSinh']
    search_fields = ['IDLopHoc__TenLop', 'IDHocSinh__HoTen']


@admin.register(LopHoc_MonHoc)
class LopHoc_MonHocAdmin(admin.ModelAdmin):
    autocomplete_fields = ['IDLopHoc', 'IDMonHoc']
    search_fields = ['IDLopHoc__TenLop', 'IDMonHoc__TenMonHoc']
