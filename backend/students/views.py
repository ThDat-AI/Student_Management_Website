# students/views.py

from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsBGH, IsGiaoVu, IsGiaoVien # BGH cũng có quyền
# THAY ĐỔI: Nếu bạn có permission IsGiaoVu, hãy import nó
# from accounts.permissions import IsGiaoVu
from .models import HocSinh
from .serializers import HocSinhSerializer

# Import các serializer và model từ các app khác cho mục đích lọc dropdown
from configurations.models import NienKhoa
from configurations.serializers import NienKhoaSerializer
from classes.models import Khoi
from classes.serializers import KhoiSerializer

from django.db.models import Avg, Subquery, OuterRef, FloatField
from django.db.models.functions import Round
from .serializers import HocSinhSerializer, TraCuuHocSinhSerializer
from grading.models import DiemSo, HocKy
from classes.models import LopHoc

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
    # THAY ĐỔI: Quyền cho Giáo Vụ (và BGH nếu muốn)
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu] # Hoặc [IsAuthenticated, IsBGH | IsGiaoVu]

    def perform_destroy(self, instance):
        # Kiểm tra ràng buộc khi xóa học sinh (nếu học sinh có liên quan đến các bảng khác)
        # Ví dụ: HocSinh.lop_hoc_list.exists(), HocSinh.diemso_set.exists()
        # Nếu có các ràng buộc PROTECT ở các model khác, Django sẽ tự raise lỗi
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
    API cho phép giáo viên tra cứu danh sách học sinh theo Lớp và Niên khóa.
    Trả về thông tin học sinh kèm điểm trung bình của 2 học kỳ.
    """
    serializer_class = TraCuuHocSinhSerializer
    permission_classes = [IsAuthenticated] # Cho phép mọi vai trò đã đăng nhập
    filter_backends = [filters.SearchFilter]
    search_fields = ['Ho', 'Ten']

    def get_queryset(self):
        lophoc_id = self.request.query_params.get('lophoc_id')
        
        # Nếu không có lophoc_id, không trả về gì cả
        if not lophoc_id:
            return HocSinh.objects.none()

        # Lấy ID của học kỳ 1 và 2 (giả định tên là cố định)
        try:
            hk1 = HocKy.objects.get(TenHocKy__icontains="1")
            hk2 = HocKy.objects.get(TenHocKy__icontains="2")
        except HocKy.DoesNotExist:
            # Nếu không có học kỳ, không thể tính điểm
            return HocSinh.objects.filter(lophoc_list__id=lophoc_id).order_by('Ten', 'Ho')

        # === XÂY DỰNG CÁC TRUY VẤN CON (SUBQUERY) ĐỂ TÍNH ĐIỂM TRUNG BÌNH ===

        # Subquery để tính điểm TB của tất cả các môn trong Học Kỳ 1
        diem_hk1_subquery = DiemSo.objects.filter(
            IDHocSinh=OuterRef('pk'),         # Liên kết với học sinh đang xét
            IDLopHoc_id=lophoc_id,            # Chỉ trong lớp học này
            IDHocKy=hk1                      # Chỉ trong học kỳ 1
        ).values('IDHocSinh').annotate(
            # Tính trung bình của cột DiemTB, làm tròn 2 chữ số
            avg=Round(Avg('DiemTB'), 2)
        ).values('avg')

        # Subquery cho Học Kỳ 2
        diem_hk2_subquery = DiemSo.objects.filter(
            IDHocSinh=OuterRef('pk'),
            IDLopHoc_id=lophoc_id,
            IDHocKy=hk2
        ).values('IDHocSinh').annotate(
            avg=Round(Avg('DiemTB'), 2)
        ).values('avg')
        
        # Lấy danh sách học sinh thuộc lớp được chọn
        queryset = HocSinh.objects.filter(lophoc_list__id=lophoc_id)

        # Gắn kết quả của các subquery vào từng học sinh dưới dạng các trường mới
        queryset = queryset.annotate(
            DiemTB_HK1=Subquery(diem_hk1_subquery, output_field=FloatField()),
            DiemTB_HK2=Subquery(diem_hk2_subquery, output_field=FloatField())
        ).order_by('Ten', 'Ho') # Sắp xếp theo tên

        return queryset

    def get_serializer_context(self):
        """
        Truyền thêm thông tin (context) vào serializer.
        Ở đây ta truyền tên lớp học để serializer có thể sử dụng.
        """
        context = super().get_serializer_context()
        lophoc_id = self.request.query_params.get('lophoc_id')
        if lophoc_id:
            try:
                lop_hoc = LopHoc.objects.get(pk=lophoc_id)
                context['lop_hoc_name'] = lop_hoc.TenLop
            except LopHoc.DoesNotExist:
                context['lop_hoc_name'] = ''
        return context