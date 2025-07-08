# configurations/serializers.py

from rest_framework import serializers
from django.db import transaction
from .models import NienKhoa, ThamSo
import re

class NienKhoaSerializer(serializers.ModelSerializer):
    class Meta:
        model = NienKhoa
        fields = ['id', 'TenNienKhoa']

class ThamSoSerializer(serializers.ModelSerializer):
    TenNienKhoa = serializers.CharField(source='IDNienKhoa.TenNienKhoa', read_only=True)
    class Meta:
        model = ThamSo
        fields = '__all__'

class CreateQuyDinhVaNienKhoaSerializer(serializers.ModelSerializer):
    TenNienKhoa = serializers.CharField(max_length=9, write_only=True, help_text="Định dạng YYYY-YYYY")

    class Meta:
        model = ThamSo
        fields = [
            'TenNienKhoa', 'TuoiToiThieu', 'TuoiToiDa', 'SoMonHocToiDa', 
            'SiSoToiDa', 'DiemDatMon', 'SoLopK10', 'SoLopK11', 'SoLopK12'
        ]

    def validate_TenNienKhoa(self, value):
        if not re.match(r'^\d{4}-\d{4}$', value):
            raise serializers.ValidationError("Định dạng niên khóa phải là YYYY-YYYY (ví dụ: 2023-2024).")
        
        start_year, end_year = map(int, value.split('-'))

        if end_year != start_year + 1:
            raise serializers.ValidationError("Năm kết thúc phải lớn hơn năm bắt đầu đúng 1 năm.")

        if NienKhoa.objects.filter(TenNienKhoa=value).exists():
            raise serializers.ValidationError("Niên khóa này đã tồn tại.")

        latest_nien_khoa = NienKhoa.objects.order_by('-TenNienKhoa').first()
        if latest_nien_khoa:
            latest_start_year, _ = map(int, latest_nien_khoa.TenNienKhoa.split('-'))
            if start_year != latest_start_year + 1:
                raise serializers.ValidationError(
                    f"Niên khóa mới phải liền kề với niên khóa gần nhất ({latest_nien_khoa.TenNienKhoa}). "
                    f"Niên khóa tiếp theo phải là {latest_start_year + 1}-{latest_start_year + 2}."
                )
        return value

    def validate(self, data):
        if data['TuoiToiThieu'] > data['TuoiToiDa']:
            raise serializers.ValidationError({'TuoiToiDa': 'Tuổi tối đa phải lớn hơn hoặc bằng tuổi tối thiểu.'})
        return data

    @transaction.atomic
    def create(self, validated_data):
        ten_nien_khoa = validated_data.pop('TenNienKhoa')
        nien_khoa = NienKhoa.objects.create(TenNienKhoa=ten_nien_khoa)
        thamso = ThamSo.objects.create(IDNienKhoa=nien_khoa, **validated_data)
        return thamso
    
class GiaoVuUpdateThamSoSerializer(serializers.ModelSerializer):
    """
    Serializer này giới hạn quyền của Giáo vụ,
    chỉ cho phép cập nhật 2 trường về quyền sửa điểm.
    """
    TenNienKhoa = serializers.CharField(source='IDNienKhoa.TenNienKhoa', read_only=True)
    
    class Meta:
        model = ThamSo
        # Chỉ liệt kê các trường được phép sửa
        fields = [
            'IDNienKhoa', 'TenNienKhoa', 'ChoPhepSuaDiemHK1', 'ChoPhepSuaDiemHK2'
        ]
        # Các trường khác sẽ không được gửi đi trong request update
        read_only_fields = ['IDNienKhoa', 'TenNienKhoa']