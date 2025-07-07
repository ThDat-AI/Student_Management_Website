# students/serializers.py

from rest_framework import serializers
from .models import HocSinh
from configurations.models import NienKhoa # Import NienKhoa
from classes.models import Khoi # Import Khoi
from datetime import date # Import date cho validation

class HocSinhSerializer(serializers.ModelSerializer):
    # Sử dụng source để lấy tên Niên khóa và Khối để hiển thị
    TenNienKhoaTiepNhan = serializers.CharField(source='IDNienKhoaTiepNhan.TenNienKhoa', read_only=True)
    TenKhoiDuKien = serializers.CharField(source='KhoiDuKien.TenKhoi', read_only=True)

    class Meta:
        model = HocSinh
        fields = '__all__' # Bao gồm tất cả các trường
        extra_kwargs = {
            'Email': {
                'error_messages': {
                    'unique': 'Địa chỉ email này đã được sử dụng.'
                }
            }
        }

    # Custom validation trong serializer (ngoài clean() của model)
    def validate_NgaySinh(self, value):
        if value and value > date.today():
            raise serializers.ValidationError("Ngày sinh không được lớn hơn ngày hiện tại.")
        return value
    
class TraCuuHocSinhSerializer(serializers.ModelSerializer):
    """
    Serializer để hiển thị thông tin tra cứu của học sinh,
    bao gồm điểm trung bình các học kỳ được tính toán từ view.
    """
    HoTen = serializers.SerializerMethodField(read_only=True)
    TenLop = serializers.SerializerMethodField(read_only=True)
    
    # Các trường này sẽ được cung cấp bởi `annotate` trong view
    DiemTB_HK1 = serializers.FloatField(read_only=True)
    DiemTB_HK2 = serializers.FloatField(read_only=True)

    class Meta:
        model = HocSinh
        fields = [
            'id',
            'HoTen',
            'TenLop',
            'DiemTB_HK1',
            'DiemTB_HK2',
        ]

    def get_HoTen(self, obj):
        return f"{obj.Ho} {obj.Ten}"

    def get_TenLop(self, obj):
        # Lấy tên lớp từ context được truyền vào từ view
        return self.context.get('lop_hoc_name', '')