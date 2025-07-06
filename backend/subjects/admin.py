from django.contrib import admin
from .models import MonHoc, ToHop

@admin.register(MonHoc)
class MonHocAdmin(admin.ModelAdmin):
    search_fields = ['TenMonHoc']
    list_display = ['TenMonHoc', 'IDNienKhoa']

@admin.register(ToHop)
class ToHopAdmin(admin.ModelAdmin):
    search_fields = ['TenToHop']
