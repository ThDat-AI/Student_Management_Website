# grading/serializers.py
from rest_framework import serializers
from grading.models import DiemSo, HocKy
from students.models import HocSinh
from configurations.models import ThamSo

class HocKySerializer(serializers.ModelSerializer):
    class Meta:
        model = HocKy
        fields = ['id', 'TenHocKy']


class DiemSoSerializer(serializers.ModelSerializer):
    HoTen = serializers.SerializerMethodField()
    DiemTB = serializers.SerializerMethodField()
    DatHayKhong = serializers.SerializerMethodField()

    class Meta:
        model = DiemSo
        fields = ['id', 'IDHocSinh', 'HoTen', 'IDLopHoc', 'IDMonHoc', 'IDHocKy',
                  'Diem15', 'Diem1Tiet', 'DiemTB', 'DatHayKhong']

    def get_HoTen(self, obj):
        return f"{obj.IDHocSinh.Ho} {obj.IDHocSinh.Ten}"

    def get_DiemTB(self, obj):
        if obj.Diem15 is not None and obj.Diem1Tiet is not None:
            return round((obj.Diem15 + 2 * obj.Diem1Tiet) / 3, 2)
        return None

    def get_DatHayKhong(self, obj):
        dtb = self.get_DiemTB(obj)
        if dtb is None:
            return None
        try:
            thamso = ThamSo.objects.get(IDNienKhoa=obj.IDHocSinh.IDNienKhoaTiepNhan)
            return "Đạt" if dtb >= thamso.DiemDatMon else "Không đạt"
        except ThamSo.DoesNotExist:
            return None


# ✅ Serializer mới để trả về danh sách học sinh + điểm (nếu có)
class HocSinhDiemSerializer(serializers.ModelSerializer):
    Diem15 = serializers.SerializerMethodField()
    Diem1Tiet = serializers.SerializerMethodField()
    DiemTB = serializers.SerializerMethodField()
    DatHayKhong = serializers.SerializerMethodField()
    HoTen = serializers.SerializerMethodField()

    class Meta:
        model = HocSinh
        fields = ['id', 'HoTen', 'Diem15', 'Diem1Tiet', 'DiemTB', 'DatHayKhong']

    def get_HoTen(self, obj):
        return f"{obj.Ho} {obj.Ten}"

    def get_diemso(self, obj):
        context = self.context
        return DiemSo.objects.filter(
            IDHocSinh=obj,
            IDLopHoc_id=context.get("IDLopHoc"),
            IDMonHoc_id=context.get("IDMonHoc"),
            IDHocKy_id=context.get("IDHocKy"),
        ).first()

    def get_Diem15(self, obj):
        ds = self.get_diemso(obj)
        return ds.Diem15 if ds else None

    def get_Diem1Tiet(self, obj):
        ds = self.get_diemso(obj)
        return ds.Diem1Tiet if ds else None

    def get_DiemTB(self, obj):
        ds = self.get_diemso(obj)
        if ds and ds.Diem15 is not None and ds.Diem1Tiet is not None:
            return round((ds.Diem15 + 2 * ds.Diem1Tiet) / 3, 2)
        return None

    def get_DatHayKhong(self, obj):
        dtb = self.get_DiemTB(obj)
        if dtb is None:
            return None
        try:
            thamso = ThamSo.objects.get(IDNienKhoa=obj.IDNienKhoaTiepNhan)
            return "Đạt" if dtb >= thamso.DiemDatMon else "Không đạt"
        except ThamSo.DoesNotExist:
            return None
