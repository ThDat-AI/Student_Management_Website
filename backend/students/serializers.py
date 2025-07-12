# students/serializers.py

from rest_framework import serializers
from .models import HocSinh

from configurations.models import NienKhoa, ThamSo
from classes.models import LopHoc_HocSinh
from datetime import date

class HocSinhSerializer(serializers.ModelSerializer):
    TenNienKhoaTiepNhan = serializers.CharField(source='IDNienKhoaTiepNhan.TenNienKhoa', read_only=True)
    TenKhoiDuKien = serializers.CharField(source='KhoiDuKien.TenKhoi', read_only=True)
    is_deletable = serializers.SerializerMethodField()
    
    class Meta:
        model = HocSinh
        fields = ['id', 'Ho', 'Ten', 'GioiTinh', 'NgaySinh', 'DiaChi', 'Email', 
                  'IDNienKhoaTiepNhan', 'TenNienKhoaTiepNhan', 
                  'KhoiDuKien', 'TenKhoiDuKien', 'is_deletable']
        extra_kwargs = {
            'Email': {
                'error_messages': {
                    'unique': 'Địa chỉ email này đã được sử dụng.'
                }
            }
        }

    def get_is_deletable(self, obj):
        return not LopHoc_HocSinh.objects.filter(IDHocSinh=obj).exists()
    
    def validate_NgaySinh(self, value):
        if value and value > date.today():
            raise serializers.ValidationError("Ngày sinh không được lớn hơn ngày hiện tại.")
        return value

    
    def validate(self, attrs):
        
        instance = self.instance
        
        # Lấy niên khóa và ngày sinh để kiểm tra
        nien_khoa = attrs.get('IDNienKhoaTiepNhan', instance.IDNienKhoaTiepNhan if instance else None)
        ngay_sinh = attrs.get('NgaySinh', instance.NgaySinh if instance else None)

        if not nien_khoa:
            
            raise serializers.ValidationError({'IDNienKhoaTiepNhan': 'Niên khóa tiếp nhận không được để trống.'})

        if not ngay_sinh:
            raise serializers.ValidationError({'NgaySinh': 'Ngày sinh không được để trống.'})

       
        try:
            thamso = ThamSo.objects.get(IDNienKhoa=nien_khoa)
        except ThamSo.DoesNotExist:
            raise serializers.ValidationError(
                f"Chưa có quy định về tuổi cho niên khóa {nien_khoa.TenNienKhoa}. "
                f"Vui lòng vào mục 'Quy định' để thiết lập."
            )

        # Tính toán tuổi 
        nien_khoa_start_year = int(nien_khoa.TenNienKhoa.split('-')[0])
        september_first = date(nien_khoa_start_year, 9, 1)
        calculated_age = september_first.year - ngay_sinh.year - ((september_first.month, september_first.day) < (ngay_sinh.month, ngay_sinh.day))

        # Kiểm tra tuổi 
        if not (thamso.TuoiToiThieu <= calculated_age <= thamso.TuoiToiDa):
            raise serializers.ValidationError(
                f"Tuổi của học sinh ({calculated_age} tuổi) không nằm trong khoảng quy định "
                f"({thamso.TuoiToiThieu}-{thamso.TuoiToiDa} tuổi) của niên khóa {nien_khoa.TenNienKhoa}."
            )
        
        return attrs


class TraCuuHocSinhSerializer(serializers.ModelSerializer):
    """
    Serializer để hiển thị thông tin tra cứu của học sinh,
    bao gồm các trường được tính toán từ view.
    """
    HoTen = serializers.SerializerMethodField(read_only=True)
    
    TenLop = serializers.CharField(read_only=True, default=None)
    DiemTB_HK1 = serializers.FloatField(read_only=True, default=None)
    DiemTB_HK2 = serializers.FloatField(read_only=True, default=None)
    
    
    NgaySinh = serializers.DateField(format="%d/%m/%Y")

    class Meta:
        model = HocSinh
       
        fields = [
            'id',
            'HoTen',
            'GioiTinh',
            'NgaySinh',
            'Email',
            'TenLop',
            'DiemTB_HK1',
            'DiemTB_HK2',
        ]

    def get_HoTen(self, obj):
        return f"{obj.Ho} {obj.Ten}"