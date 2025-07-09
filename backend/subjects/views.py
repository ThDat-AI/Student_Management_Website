# subjects/views.py
from rest_framework import generics, filters # Thêm filters
from rest_framework.permissions import IsAuthenticated, AllowAny
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
        # ... (logic get_queryset giữ nguyên) ...
        queryset = MonHoc.objects.select_related('IDNienKhoa', 'IDToHop').all()
        
        nienkhoa_id = self.request.query_params.get('nienkhoa_id')
        if not nienkhoa_id:
            return MonHoc.objects.none()
            
        queryset = queryset.filter(IDNienKhoa_id=nienkhoa_id)
        
        tohop_id = self.request.query_params.get('tohop_id')
        if tohop_id:
            queryset = queryset.filter(IDToHop_id=tohop_id)
            
        return queryset.order_by('TenMonHoc')

    def perform_create(self, serializer):
        """
        Chỉ cho phép tạo môn học trong niên khóa mới nhất.
        """
        latest_nien_khoa = NienKhoa.objects.order_by('-TenNienKhoa').first()
        requested_nien_khoa_id = int(self.request.data.get('IDNienKhoa'))

        if not latest_nien_khoa or requested_nien_khoa_id != latest_nien_khoa.id:
            raise PermissionDenied("Chỉ được phép thêm môn học cho niên khóa hiện hành.")
        
        serializer.save()

class MonHocDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MonHoc.objects.all()
    serializer_class = MonHocSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu]

    def _check_permissions(self, instance):
        """
        Kiểm tra 2 điều kiện:
        1. Môn học phải thuộc niên khóa mới nhất.
        2. Môn học chưa được phân công cho lớp.
        """
        # 1. Kiểm tra niên khóa
        latest_nien_khoa = NienKhoa.objects.order_by('-TenNienKhoa').first()
        if not latest_nien_khoa or instance.IDNienKhoa_id != latest_nien_khoa.id:
             raise PermissionDenied(
                "Không thể sửa/xóa môn học của các niên khóa cũ."
            )

        # 2. Kiểm tra dữ liệu liên quan
        if LopHoc_MonHoc.objects.filter(IDMonHoc=instance).exists():
            raise PermissionDenied(
                "Không thể sửa/xóa môn học đã được phân công cho lớp học."
            )

    def perform_update(self, serializer):
        self._check_permissions(self.get_object())
        serializer.save()

    def perform_destroy(self, instance):
        self._check_permissions(instance)
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
    queryset = NienKhoa.objects.all().order_by('-TenNienKhoa')
    serializer_class = NienKhoaSerializer
    permission_classes = [IsAuthenticated]

