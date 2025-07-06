from django.contrib import admin
from .models import HocSinh

@admin.register(HocSinh)
class HocSinhAdmin(admin.ModelAdmin):
    search_fields = ['Ho', 'Ten']
