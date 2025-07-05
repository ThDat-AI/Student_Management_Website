# subjects/serializers.py
from rest_framework import serializers
from .models import ToHop, MonHoc

class ToHopSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToHop
        fields = '__all__'

class MonHocSerializer(serializers.ModelSerializer):
    TenNienKhoa = serializers.CharField(source='IDNienKhoa.TenNienKhoa', read_only=True)
    TenToHop = serializers.CharField(source='IDToHop.TenToHop', read_only=True)

    class Meta:
        model = MonHoc
        fields = '__all__'