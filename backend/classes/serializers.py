# classes/serializers.py
from rest_framework import serializers
from .models import Khoi, LopHoc
from subjects.serializers import MonHocSerializer # Import MonHocSerializer

class KhoiSerializer(serializers.ModelSerializer):
    class Meta:
        model = Khoi
        fields = '__all__'


class LopHocMonHocUpdateSerializer(serializers.Serializer):
    monhoc_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="Danh sách các ID của môn học để gán cho lớp."
    )

class LopHocSerializer(serializers.ModelSerializer):
    # Các trường chỉ đọc để hiển thị tên
    TenKhoi = serializers.CharField(source='IDKhoi.TenKhoi', read_only=True)
    TenNienKhoa = serializers.CharField(source='IDNienKhoa.TenNienKhoa', read_only=True)
    TenToHop = serializers.CharField(source='IDToHop.TenToHop', read_only=True, allow_null=True)
    
    # Đọc danh sách môn học chi tiết
    MonHoc = MonHocSerializer(many=True, read_only=True)
    
    class Meta:
        model = LopHoc
        # Liệt kê rõ tất cả các trường, bao gồm cả các ForeignKey ID
        fields = [
            'id', 'TenLop', 'SiSo',
            'IDKhoi', 'TenKhoi', 
            'IDNienKhoa', 'TenNienKhoa', 
            'IDToHop', 'TenToHop',
            'MonHoc'
        ]
        # Sĩ số là chỉ đọc vì nó sẽ được cập nhật tự động bằng signal
        read_only_fields = ['SiSo']

    def validate(self, data):
        # Giữ nguyên logic validate của bạn
        nien_khoa = data.get('IDNienKhoa')
        ten_lop = data.get('TenLop')
        instance = self.instance

        query = LopHoc.objects.filter(IDNienKhoa=nien_khoa, TenLop__iexact=ten_lop)
        
        if instance:
            query = query.exclude(pk=instance.pk)

        if query.exists():
            raise serializers.ValidationError(f"Tên lớp '{ten_lop}' đã tồn tại trong niên khóa này.")
        
        return data