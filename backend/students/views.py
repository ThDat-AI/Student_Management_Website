# students/views.py

from rest_framework import generics, status, filters
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsBGH, IsGiaoVu, IsGiaoVien

from .models import HocSinh
from .serializers import HocSinhSerializer


from configurations.models import NienKhoa
from configurations.serializers import NienKhoaSerializer
from classes.models import Khoi
from classes.serializers import KhoiSerializer

from django.db.models import Avg, Subquery, OuterRef, FloatField, CharField
from django.db.models.functions import Round
from .serializers import HocSinhSerializer, TraCuuHocSinhSerializer
from grading.models import DiemSo, HocKy
from classes.models import LopHoc, LopHoc_HocSinh

class HocSinhListCreateView(generics.ListCreateAPIView):
    queryset = HocSinh.objects.select_related('IDNienKhoaTiepNhan', 'KhoiDuKien').all()
    serializer_class = HocSinhSerializer
    # THAY ĐỔI: Quyền cho Giáo Vụ (và BGH nếu muốn)
    # Ví dụ: Nếu chỉ Giáo Vụ: permission_classes = [IsAuthenticated, IsGiaoVu]
    # Nếu cả BGH và Giáo Vụ:
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu] # Hoặc [IsAuthenticated, IsBGH | IsGiaoVu] nếu có IsGiaoVu

    filter_backends = [filters.SearchFilter]
    search_fields = ['Ho', 'Ten', 'Email']

    def get_queryset(self):
        queryset = super().get_queryset()
        nien_khoa_id = self.request.query_params.get('nien_khoa_id')
        if nien_khoa_id:
            queryset = queryset.filter(IDNienKhoaTiepNhan__id=nien_khoa_id)
        
        khoi_id = self.request.query_params.get('khoi_id')
        if khoi_id:
            queryset = queryset.filter(KhoiDuKien__id=khoi_id)
            
        return queryset


class HocSinhDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = HocSinh.objects.select_related('IDNienKhoaTiepNhan', 'KhoiDuKien').all()
    serializer_class = HocSinhSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu]

    def _check_student_assigned(self, instance):
        """Kiểm tra xem học sinh đã được phân lớp hay chưa."""
        if LopHoc_HocSinh.objects.filter(IDHocSinh=instance).exists():
            raise PermissionDenied("Không thể sửa/xóa học sinh đã được phân lớp.")

    def perform_update(self, serializer):
        instance = self.get_object()
        
        if 'IDNienKhoaTiepNhan' in serializer.validated_data and \
           serializer.validated_data['IDNienKhoaTiepNhan'] != instance.IDNienKhoaTiepNhan and \
           LopHoc_HocSinh.objects.filter(IDHocSinh=instance).exists():
           raise PermissionDenied("Không thể thay đổi niên khóa của học sinh đã được phân lớp.")
        
        super().perform_update(serializer)


    def perform_destroy(self, instance):
        # Gọi hàm kiểm tra trước khi xóa
        self._check_student_assigned(instance)
        super().perform_destroy(instance)


# Các View để cung cấp danh sách cho dropdown lọc
class NienKhoaFilterListView(generics.ListAPIView):
    queryset = NienKhoa.objects.all().order_by('-TenNienKhoa') # Sắp xếp niên khóa mới nhất lên đầu
    serializer_class = NienKhoaSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu | IsGiaoVien] # Hoặc IsGiaoVu

class KhoiFilterListView(generics.ListAPIView):
    queryset = Khoi.objects.all().order_by('TenKhoi') # Sắp xếp khối theo tên
    serializer_class = KhoiSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu] # Hoặc IsGiaoVu


class TraCuuHocSinhView(generics.ListAPIView):
    """
    API tra cứu học sinh toàn diện:
    - Bắt buộc: `nien_khoa_id`
    - Tùy chọn: `khoi_id`, `lophoc_id`, `search`
    """
    serializer_class = TraCuuHocSinhSerializer
    permission_classes = [IsAuthenticated] # Mọi người dùng đã đăng nhập đều có thể tra cứu
    filter_backends = [filters.SearchFilter]
    search_fields = ['Ho', 'Ten'] # Tìm kiếm theo Họ và Tên

    def get_queryset(self):
        # Lấy các tham số từ query string
        nien_khoa_id = self.request.query_params.get('nien_khoa_id')
        khoi_id = self.request.query_params.get('khoi_id')
        lophoc_id = self.request.query_params.get('lophoc_id')

        # Nếu không có niên khóa, không trả về gì cả. Đây là bộ lọc cơ sở.
        if not nien_khoa_id:
            return HocSinh.objects.none()

        # --- Lấy danh sách học sinh thuộc niên khóa ---
        # Một học sinh thuộc niên khóa nếu em đó được phân vào một lớp trong niên khóa đó.
        # Dùng .distinct() để tránh trường hợp học sinh bị trùng lặp
        queryset = HocSinh.objects.filter(
            lophoc_list__IDNienKhoa_id=nien_khoa_id
        ).distinct()

        # Lọc theo Khối nếu có
        if khoi_id:
            queryset = queryset.filter(lophoc_list__IDKhoi_id=khoi_id)

        # Lọc theo Lớp nếu có
        if lophoc_id:
            queryset = queryset.filter(lophoc_list__id=lophoc_id)

        # --- Subquery để lấy thông tin bổ sung ---
        try:
            hk1 = HocKy.objects.get(TenHocKy__icontains="1")
            hk2 = HocKy.objects.get(TenHocKy__icontains="2")
        except HocKy.DoesNotExist:
            hk1, hk2 = None, None

        # Subquery để lấy tên lớp của học sinh TRONG NIÊN KHÓA đang xét
        ten_lop_subquery = LopHoc.objects.filter(
            HocSinh=OuterRef('pk'),             # Liên kết với học sinh đang xét
            IDNienKhoa_id=nien_khoa_id          # Chỉ trong niên khóa này
        ).values('TenLop')[:1] # Lấy tên lớp đầu tiên tìm thấy

        # Chú thích (annotate) queryset với tên lớp
        queryset = queryset.annotate(TenLop=Subquery(ten_lop_subquery, output_field=CharField()))
        
        # Annotate điểm nếu có học kỳ
        if hk1:
            diem_hk1_subquery = DiemSo.objects.filter(
                IDHocSinh=OuterRef('pk'),
                IDLopHoc__IDNienKhoa_id=nien_khoa_id, # Điểm trong niên khóa này
                IDHocKy=hk1
            ).values('IDHocSinh').annotate(avg=Round(Avg('DiemTB'), 2)).values('avg')
            queryset = queryset.annotate(DiemTB_HK1=Subquery(diem_hk1_subquery, output_field=FloatField()))

        if hk2:
            diem_hk2_subquery = DiemSo.objects.filter(
                IDHocSinh=OuterRef('pk'),
                IDLopHoc__IDNienKhoa_id=nien_khoa_id, # Điểm trong niên khóa này
                IDHocKy=hk2
            ).values('IDHocSinh').annotate(avg=Round(Avg('DiemTB'), 2)).values('avg')
            queryset = queryset.annotate(DiemTB_HK2=Subquery(diem_hk2_subquery, output_field=FloatField()))
            
        return queryset.order_by('Ten', 'Ho')

    def get_serializer_context(self):
        # Không cần truyền context tên lớp nữa vì đã annotate trực tiếp
        return super().get_serializer_context()