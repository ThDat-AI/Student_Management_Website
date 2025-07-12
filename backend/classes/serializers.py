# classes/serializers.py
from rest_framework import serializers
from .models import Khoi, LopHoc
from subjects.serializers import MonHocSerializer 
from configurations.models import ThamSo, NienKhoa
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
    
    TenKhoi = serializers.CharField(source='IDKhoi.TenKhoi', read_only=True)
    TenNienKhoa = serializers.CharField(source='IDNienKhoa.TenNienKhoa', read_only=True)
    TenToHop = serializers.CharField(source='IDToHop.TenToHop', read_only=True, allow_null=True)
    
   
    MonHoc = MonHocSerializer(many=True, read_only=True)
    is_editable = serializers.SerializerMethodField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        latest_nien_khoa = NienKhoa.objects.order_by('-TenNienKhoa').first()
        self.latest_nien_khoa_id = latest_nien_khoa.id if latest_nien_khoa else None

    class Meta:
        model = LopHoc
        fields = [
            'id', 'TenLop', 'SiSo',
            'IDKhoi', 'TenKhoi', 
            'IDNienKhoa', 'TenNienKhoa', 
            'IDToHop', 'TenToHop',
            'MonHoc', 'is_editable'
        ]
        read_only_fields = ['SiSo']

    def get_is_editable(self, obj):
        
        return obj.IDNienKhoa_id == self.latest_nien_khoa_id
    
    def validate(self, data):
        nien_khoa = data.get('IDNienKhoa')
        ten_lop = data.get('TenLop')
        khoi = data.get('IDKhoi')
        instance = self.instance

       
        query = LopHoc.objects.filter(IDNienKhoa=nien_khoa, TenLop__iexact=ten_lop)
        
        if instance:
            query = query.exclude(pk=instance.pk)

        if query.exists():
            raise serializers.ValidationError(
                {'TenLop': f"Tên lớp '{ten_lop}' đã tồn tại trong niên khóa này."}
            )
        
        
        if not instance and khoi and nien_khoa:
           
            try:
                tham_so = ThamSo.objects.get(IDNienKhoa=nien_khoa)
            except ThamSo.DoesNotExist:
                raise serializers.ValidationError(
                    f"Chưa có quy định về số lượng lớp cho niên khóa {nien_khoa.TenNienKhoa}."
                )
           
            max_limit_map = {
                'Khối 10': tham_so.SoLopK10,
                'Khối 11': tham_so.SoLopK11,
                'Khối 12': tham_so.SoLopK12,
            }
            max_limit = max_limit_map.get(khoi.TenKhoi)
            
            
            if max_limit is not None:
                
                current_count = LopHoc.objects.filter(IDNienKhoa=nien_khoa, IDKhoi=khoi).count()
                
                
                if current_count >= max_limit:
                    raise serializers.ValidationError({
                        'IDKhoi': f"Đã đạt số lớp tối đa ({max_limit} lớp) cho {khoi.TenKhoi} trong niên khóa này."
                    })
        
        return data