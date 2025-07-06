# subjects/views.py
from rest_framework import generics, filters # Thêm filters
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsBGH, IsGiaoVu # Import thêm IsGiaoVu
from .models import ToHop, MonHoc
from .serializers import ToHopSerializer, MonHocSerializer

from classes.models import LopHoc
from rest_framework.views import APIView
from rest_framework.response import Response
from configurations.models import NienKhoa
from .serializers import NienKhoaSerializer


class ToHopListView(generics.ListAPIView):
    queryset = ToHop.objects.all()
    serializer_class = ToHopSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu] # Cho cả Giáo Vụ xem

class MonHocListCreateView(generics.ListCreateAPIView):
    queryset = MonHoc.objects.all().select_related('IDNienKhoa', 'IDToHop')
    serializer_class = MonHocSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu] # Cho phép Giáo Vụ quản lý
    
    # Thêm bộ lọc để lấy môn học theo niên khóa
    filter_backends = [filters.SearchFilter]
    search_fields = ['TenMonHoc']

    def get_queryset(self):
        queryset = super().get_queryset()
        nienkhoa_id = self.request.query_params.get('nienkhoa_id')
        if nienkhoa_id:
            queryset = queryset.filter(IDNienKhoa_id=nienkhoa_id)
        return queryset.order_by('TenMonHoc')

class MonHocDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MonHoc.objects.all()
    serializer_class = MonHocSerializer
    permission_classes = [IsAuthenticated] # Placeholder, cần chỉnh sửa

class MonHocTheoLopView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, lop_id):
        try:
            lop = LopHoc.objects.get(pk=lop_id)
            monhoc_list = lop.MonHoc.all()  # many-to-many
            serializer = MonHocSerializer(monhoc_list, many=True)
            return Response(serializer.data)
        except LopHoc.DoesNotExist:
            return Response({"detail": "Lớp học không tồn tại."}, status=404)
        
class NienKhoaListView(generics.ListAPIView):
    queryset = NienKhoa.objects.all()
    serializer_class = NienKhoaSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu]

