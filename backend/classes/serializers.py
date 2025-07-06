# classes/serializers.py
from rest_framework import serializers
from .models import Khoi, LopHoc
from subjects.serializers import MonHocSerializer # Import MonHocSerializer
from configurations.models import ThamSo
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
        fields = [
            'id', 'TenLop', 'SiSo',
            'IDKhoi', 'TenKhoi', 
            'IDNienKhoa', 'TenNienKhoa', 
            'IDToHop', 'TenToHop',
            'MonHoc'
        ]
        read_only_fields = ['SiSo']

    def validate(self, data):
        nien_khoa = data.get('IDNienKhoa')
        ten_lop = data.get('TenLop')
        khoi = data.get('IDKhoi')
        instance = self.instance

        # --- VALIDATION 1: KIỂM TRA TÊN LỚP TRÙNG LẶP (LOGIC CŨ) ---
        query = LopHoc.objects.filter(IDNienKhoa=nien_khoa, TenLop__iexact=ten_lop)
        
        if instance: # Nếu là update, loại trừ chính nó ra khỏi query
            query = query.exclude(pk=instance.pk)

        if query.exists():
            raise serializers.ValidationError(
                {'TenLop': f"Tên lớp '{ten_lop}' đã tồn tại trong niên khóa này."}
            )
        
        # --- VALIDATION 2: KIỂM TRA SỐ LƯỢNG LỚP TỐI ĐA (LOGIC MỚI) ---
        # Logic này chỉ chạy khi tạo mới (instance is None)
        if not instance and khoi and nien_khoa:
            # 1. Lấy quy định cho niên khóa
            try:
                tham_so = ThamSo.objects.get(IDNienKhoa=nien_khoa)
            except ThamSo.DoesNotExist:
                raise serializers.ValidationError(
                    f"Chưa có quy định về số lượng lớp cho niên khóa {nien_khoa.TenNienKhoa}."
                )
            
            # 2. Xác định số lớp tối đa cho khối được chọn
            max_limit_map = {
                'Khối 10': tham_so.SoLopK10,
                'Khối 11': tham_so.SoLopK11,
                'Khối 12': tham_so.SoLopK12,
            }
            max_limit = max_limit_map.get(khoi.TenKhoi)
            
            # 3. Nếu có quy định cho khối này
            if max_limit is not None:
                # 4. Đếm số lớp hiện có của khối này trong niên khóa
                current_count = LopHoc.objects.filter(IDNienKhoa=nien_khoa, IDKhoi=khoi).count()
                
                # 5. So sánh và báo lỗi nếu vượt quá
                if current_count >= max_limit:
                    raise serializers.ValidationError({
                        'IDKhoi': f"Đã đạt số lớp tối đa ({max_limit} lớp) cho {khoi.TenKhoi} trong niên khóa này."
                    })
        
        return data