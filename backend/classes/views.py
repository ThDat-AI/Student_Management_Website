from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsBGH, IsGiaoVu, IsGiaoVien
from .models import Khoi, LopHoc
from .serializers import KhoiSerializer, LopHocSerializer

# Danh sách khối học (chỉ BGH được xem)
class KhoiListView(generics.ListAPIView):
    queryset = Khoi.objects.all()
    serializer_class = KhoiSerializer
    permission_classes = [IsAuthenticated, IsBGH]

# Tạo và liệt kê lớp học (BGH hoặc Giáo Vụ)
class LopHocListCreateView(generics.ListCreateAPIView):
    queryset = LopHoc.objects.all()
    serializer_class = LopHocSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu]

# Xem, cập nhật, xóa chi tiết lớp học (BGH hoặc Giáo Vụ)
class LopHocDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LopHoc.objects.all()
    serializer_class = LopHocSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu]

# Danh sách lớp học theo niên khóa (dành cho tất cả: BGH, Giáo Vụ, Giáo Viên)
class LopHocListView(generics.ListAPIView):
    serializer_class = LopHocSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = LopHoc.objects.all()
        nienkhoa_id = self.request.query_params.get("nienkhoa_id")
        if nienkhoa_id:
            queryset = queryset.filter(IDNienKhoa__id=nienkhoa_id)
        return queryset
