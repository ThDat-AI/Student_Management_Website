# classes/serializers.py
from rest_framework import serializers
from .models import Khoi, LopHoc # Import các model cần thiết

class KhoiSerializer(serializers.ModelSerializer):
    class Meta:
        model = Khoi
        fields = '__all__'

class LopHocSerializer(serializers.ModelSerializer):
    TenKhoi = serializers.CharField(source='IDKhoi.TenKhoi', read_only=True)
    TenNienKhoa = serializers.CharField(source='IDNienKhoa.TenNienKhoa', read_only=True)
    TenToHop = serializers.CharField(source='IDToHop.TenToHop', read_only=True)

    class Meta:
        model = LopHoc
        fields = '__all__'