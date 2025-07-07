# subjects/serializers.py

from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from .models import ToHop, MonHoc
from configurations.models import NienKhoa
from classes.models import LopHoc_MonHoc 

class ToHopSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToHop
        fields = '__all__'

class MonHocSerializer(serializers.ModelSerializer):
    TenNienKhoa = serializers.CharField(source='IDNienKhoa.TenNienKhoa', read_only=True)
    TenToHop = serializers.CharField(source='IDToHop.TenToHop', read_only=True, allow_null=True)
    is_deletable = serializers.SerializerMethodField() 

    class Meta:
        model = MonHoc
        fields = ['id', 'TenMonHoc', 'IDNienKhoa', 'TenNienKhoa', 'IDToHop', 'TenToHop', 'is_deletable']
        # Xóa validator mặc định để chúng ta có thể tự viết validator tùy chỉnh
        validators = []

    def get_is_deletable(self, obj):
        return not LopHoc_MonHoc.objects.filter(IDMonHoc=obj).exists()
    
    # THÊM PHƯƠNG THỨC VALIDATE NÀY
    def validate(self, data):
        # Lấy TenMonHoc và IDNienKhoa từ dữ liệu đang được validate
        ten_mon_hoc = data.get('TenMonHoc')
        nien_khoa = data.get('IDNienKhoa')
        
        # Xây dựng queryset để kiểm tra
        queryset = MonHoc.objects.filter(TenMonHoc__iexact=ten_mon_hoc, IDNienKhoa=nien_khoa)
        
        # Nếu là đang cập nhật (instance tồn tại), loại bỏ chính nó ra khỏi kiểm tra
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
            
        # Nếu queryset tồn tại (tìm thấy bản ghi trùng lặp)
        if queryset.exists():
            raise serializers.ValidationError({
                "TenMonHoc": f"Môn học '{ten_mon_hoc}' đã tồn tại trong niên khóa này."
            })
            
        return data

class NienKhoaSerializer(serializers.ModelSerializer):
    class Meta:
        model = NienKhoa
        fields = ['id', 'TenNienKhoa']