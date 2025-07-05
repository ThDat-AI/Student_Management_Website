# students/views.py

from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsBGH, IsGiaoVu # BGH cũng có quyền
# THAY ĐỔI: Nếu bạn có permission IsGiaoVu, hãy import nó
# from accounts.permissions import IsGiaoVu
from .models import HocSinh
from .serializers import HocSinhSerializer

# Import các serializer và model từ các app khác cho mục đích lọc dropdown
from configurations.models import NienKhoa
from configurations.serializers import NienKhoaSerializer
from classes.models import Khoi
from classes.serializers import KhoiSerializer


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
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu] # Hoặc IsGiaoVu

class KhoiFilterListView(generics.ListAPIView):
    queryset = Khoi.objects.all().order_by('TenKhoi') # Sắp xếp khối theo tên
    serializer_class = KhoiSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu] # Hoặc IsGiaoVu