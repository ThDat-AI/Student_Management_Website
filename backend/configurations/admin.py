# configurations/admin.py

from django.contrib import admin
from .models import NienKhoa, ThamSo

class ThamSoInline(admin.StackedInline):
    model = ThamSo
    extra = 0

@admin.register(NienKhoa)
class NienKhoaAdmin(admin.ModelAdmin):
    search_fields = ['TenNienKhoa']
    inlines = [ThamSoInline]
