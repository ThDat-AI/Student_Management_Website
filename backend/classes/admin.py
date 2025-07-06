# classes/admin.py

from django.contrib import admin
from .models import Khoi, LopHoc, LopHoc_MonHoc, LopHoc_HocSinh

# ===== INLINE ADMINS: Cách quản lý M2M tốt nhất trên trang chi tiết =====

# Inline để quản lý Môn học ngay trên trang của Lớp học
class LopHocMonHocInline(admin.TabularInline):
    model = LopHoc_MonHoc
    verbose_name = "Môn học"
    verbose_name_plural = "Các môn học được giảng dạy"
    extra = 1 # Hiển thị 1 dòng trống để thêm mới
    autocomplete_fields = ['IDMonHoc'] 

# Inline để quản lý Học sinh ngay trên trang của Lớp học
class LopHocHocSinhInline(admin.TabularInline):
    model = LopHoc_HocSinh
    verbose_name = "Học sinh"
    verbose_name_plural = "Danh sách học sinh trong lớp"
    extra = 1 # Hiển thị 1 dòng trống để thêm mới
    autocomplete_fields = ['IDHocSinh']

# ===== MAIN ADMINS: Đăng ký các model chính =====

@admin.register(Khoi)
class KhoiAdmin(admin.ModelAdmin):
    search_fields = ['TenKhoi']

@admin.register(LopHoc)
class LopHocAdmin(admin.ModelAdmin):
    search_fields = ['TenLop']
    # Thêm SiSo vào list_display để dễ dàng theo dõi
    list_display = ['TenLop', 'IDKhoi', 'IDNienKhoa', 'SiSo', 'IDToHop']
    list_filter = ('IDNienKhoa', 'IDKhoi', 'IDToHop')
    
    # Sử dụng Inlines để quản lý các quan hệ M2M
    inlines = [LopHocMonHocInline, LopHocHocSinhInline]
    

    readonly_fields = ('SiSo',)

