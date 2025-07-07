# students/serializers.py

from rest_framework import serializers
from .models import HocSinh
# THÊM CÁC IMPORT NÀY
from configurations.models import NienKhoa, ThamSo
from classes.models import Khoi
from datetime import date

class HocSinhSerializer(serializers.ModelSerializer):
    TenNienKhoaTiepNhan = serializers.CharField(source='IDNienKhoaTiepNhan.TenNienKhoa', read_only=True)
    TenKhoiDuKien = serializers.CharField(source='KhoiDuKien.TenKhoi', read_only=True)

    class Meta:
        model = HocSinh
        fields = '__all__'
        extra_kwargs = {
            'Email': {
                'error_messages': {
                    'unique': 'Địa chỉ email này đã được sử dụng.'
                }
            }
        }

    def validate_NgaySinh(self, value):
        if value and value > date.today():
            raise serializers.ValidationError("Ngày sinh không được lớn hơn ngày hiện tại.")
        return value

    # === THÊM PHƯƠNG THỨC VALIDATE NÀY VÀO ===
    def validate(self, attrs):
        # Khi cập nhật (PATCH), attrs chỉ chứa các trường được gửi lên.
        # Chúng ta cần lấy các trường không đổi từ instance hiện tại.
        instance = self.instance
        
        # Lấy niên khóa và ngày sinh để kiểm tra
        nien_khoa = attrs.get('IDNienKhoaTiepNhan', instance.IDNienKhoaTiepNhan if instance else None)
        ngay_sinh = attrs.get('NgaySinh', instance.NgaySinh if instance else None)

        if not nien_khoa:
            # Lỗi này sẽ được bắt bởi `required=True` của model field, nhưng check lại cho chắc
            raise serializers.ValidationError({'IDNienKhoaTiepNhan': 'Niên khóa tiếp nhận không được để trống.'})

        if not ngay_sinh:
            raise serializers.ValidationError({'NgaySinh': 'Ngày sinh không được để trống.'})

        # --- Logic kiểm tra tuổi được chuyển từ model vào đây ---
        try:
            thamso = ThamSo.objects.get(IDNienKhoa=nien_khoa)
        except ThamSo.DoesNotExist:
            raise serializers.ValidationError(
                f"Chưa có quy định về tuổi cho niên khóa {nien_khoa.TenNienKhoa}. "
                f"Vui lòng vào mục 'Quy định' để thiết lập."
            )

        # Tính toán tuổi (sử dụng logic giống trong model)
        nien_khoa_start_year = int(nien_khoa.TenNienKhoa.split('-')[0])
        september_first = date(nien_khoa_start_year, 9, 1)
        calculated_age = september_first.year - ngay_sinh.year - ((september_first.month, september_first.day) < (ngay_sinh.month, ngay_sinh.day))

        # Kiểm tra tuổi và ném lỗi serializers.ValidationError
        if not (thamso.TuoiToiThieu <= calculated_age <= thamso.TuoiToiDa):
            raise serializers.ValidationError(
                f"Tuổi của học sinh ({calculated_age} tuổi) không nằm trong khoảng quy định "
                f"({thamso.TuoiToiThieu}-{thamso.TuoiToiDa} tuổi) của niên khóa {nien_khoa.TenNienKhoa}."
            )
        
        return attrs


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