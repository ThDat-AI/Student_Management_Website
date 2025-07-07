# subjects/views.py
from rest_framework import generics, filters # Thêm filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from accounts.permissions import IsBGH, IsGiaoVu # Import thêm IsGiaoVu
from .models import ToHop, MonHoc
from .serializers import ToHopSerializer, MonHocSerializer

from classes.models import LopHoc, LopHoc_MonHoc
from rest_framework.views import APIView
from rest_framework.response import Response
from configurations.models import NienKhoa
from .serializers import NienKhoaSerializer


class ToHopListView(generics.ListAPIView):
    queryset = ToHop.objects.all()
    serializer_class = ToHopSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu]

class MonHocListCreateView(generics.ListCreateAPIView):
    serializer_class = MonHocSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu]
    filter_backends = [filters.SearchFilter]
    search_fields = ['TenMonHoc']

    def get_queryset(self):
        queryset = MonHoc.objects.select_related('IDNienKhoa', 'IDToHop').all()
        
        # Bắt buộc phải có nienkhoa_id
        nienkhoa_id = self.request.query_params.get('nienkhoa_id')
        if not nienkhoa_id:
            return MonHoc.objects.none() # Không trả về gì nếu không có niên khóa
            
        queryset = queryset.filter(IDNienKhoa_id=nienkhoa_id)
        
        # Lọc theo tổ hợp (tùy chọn)
        tohop_id = self.request.query_params.get('tohop_id')
        if tohop_id:
            queryset = queryset.filter(IDToHop_id=tohop_id)
            
        return queryset.order_by('TenMonHoc')

class MonHocDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MonHoc.objects.all()
    serializer_class = MonHocSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu]

    def check_related_data(self, instance):
        """Kiểm tra xem môn học có dữ liệu liên quan không."""
        if LopHoc_MonHoc.objects.filter(IDMonHoc=instance).exists():
            raise PermissionDenied(
                "Không thể sửa đổi hoặc xóa môn học đã được phân công cho lớp học."
            )

    def perform_update(self, serializer):
        self.check_related_data(self.get_object())
        serializer.save()

    def perform_destroy(self, instance):
        self.check_related_data(instance)
        instance.delete()

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

