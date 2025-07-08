# configurations/views.py

from rest_framework import generics, views, status, filters
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsBGH, IsGiaoVu
from .models import NienKhoa, ThamSo
from .serializers import ThamSoSerializer, CreateQuyDinhVaNienKhoaSerializer, NienKhoaSerializer, GiaoVuUpdateThamSoSerializer
from students.models import HocSinh
from classes.models import LopHoc
from .serializers import CreateQuyDinhVaNienKhoaSerializer

class TaoNienKhoaVaThamSoView(generics.CreateAPIView):
    queryset = ThamSo.objects.all()
    serializer_class = CreateQuyDinhVaNienKhoaSerializer
    pagination_class = [IsAuthenticated, IsBGH]

class ListCreateQuyDinhView(generics.ListCreateAPIView):
    # Sắp xếp mặc định theo TenNienKhoa giảm dần
    queryset = ThamSo.objects.select_related('IDNienKhoa').order_by('-IDNienKhoa__TenNienKhoa')
    permission_classes = [IsAuthenticated, IsBGH]
    
    # Kích hoạt tính năng tìm kiếm
    filter_backends = [filters.SearchFilter]
    search_fields = ['IDNienKhoa__TenNienKhoa']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateQuyDinhVaNienKhoaSerializer
        return ThamSoSerializer

class LatestQuyDinhSettingsView(generics.RetrieveUpdateAPIView):
    """
    API này chỉ làm việc với quy định (ThamSo) của niên khóa MỚI NHẤT.
    - GET: Lấy thông tin cài đặt hiện tại.
    - PATCH/PUT: Cập nhật cài đặt.
    Dành cho Giáo vụ và BGH.
    """
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu]

    def get_object(self):
        # Luôn tìm đối tượng ThamSo của niên khóa mới nhất
        latest_thamso = ThamSo.objects.order_by('-IDNienKhoa__TenNienKhoa').first()
        if not latest_thamso:
            raise NotFound("Không tìm thấy quy định nào trong hệ thống.")
        return latest_thamso

    def get_serializer_class(self):
        user = self.request.user
        # Khi Giáo vụ cập nhật, chỉ dùng serializer giới hạn quyền
        if self.request.method in ['PUT', 'PATCH'] and hasattr(user, 'taikhoan') and user.taikhoan.MaVaiTro.MaVaiTro == 'GiaoVu':
            return GiaoVuUpdateThamSoSerializer
        # Mặc định (GET) hoặc khi BGH sửa, dùng serializer đầy đủ
        return ThamSoSerializer
    

    
class QuyDinhDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ThamSo.objects.select_related('IDNienKhoa').all()
    serializer_class = ThamSoSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu]
    lookup_field = 'IDNienKhoa'

    def get_serializer_class(self):
        """
        Trả về serializer phù hợp với vai trò của người dùng.
        - BGH: Có toàn quyền sửa (ThamSoSerializer).
        - Giáo Vụ: Chỉ có quyền sửa các trường cho phép (GiaoVuUpdateThamSoSerializer).
        """
        user = self.request.user
        # Mặc định dùng serializer đầy đủ cho BGH (hoặc khi xem GET)
        serializer = ThamSoSerializer
        
        # Nếu là request UPDATE/PATCH và người dùng là Giáo Vụ
        if self.request.method in ['PUT', 'PATCH'] and hasattr(user, 'taikhoan') and user.taikhoan.MaVaiTro.MaVaiTro == 'GiaoVu':
            return GiaoVuUpdateThamSoSerializer
        
        return ThamSoSerializer

    def _check_related_data(self, nien_khoa_id):
        has_students = HocSinh.objects.filter(IDNienKhoaTiepNhan_id=nien_khoa_id).exists()
        has_classes = LopHoc.objects.filter(IDNienKhoa_id=nien_khoa_id).exists()
        return has_students or has_classes

    def perform_update(self, serializer):
        # ✅ BGH mới được sửa khi đã có dữ liệu liên quan
        user_role = self.request.user.taikhoan.MaVaiTro.MaVaiTro
        if user_role == 'BGH':
             if self._check_related_data(self.kwargs['IDNienKhoa']):
                raise ValidationError("Không thể sửa quy định vì đã có dữ liệu (học sinh, lớp học,...) trong niên khóa này.")
        
        # Giáo vụ vẫn có thể sửa quyền nhập điểm dù đã có dữ liệu
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        # Chỉ BGH mới có quyền xóa
        if not self.request.user.taikhoan.MaVaiTro.MaVaiTro == 'BGH':
             raise ValidationError("Chỉ Ban Giám Hiệu mới có quyền xóa quy định.")
        if self._check_related_data(instance.IDNienKhoa_id):
            raise ValidationError("Không thể xóa quy định vì đã có dữ liệu (học sinh, lớp học,...) trong niên khóa này.")
        nien_khoa = instance.IDNienKhoa
        instance.delete()
        nien_khoa.delete()

class LatestQuyDinhView(views.APIView):
    """API này cung cấp thông tin đọc của quy định mới nhất cho toàn hệ thống."""
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        latest_thamso = ThamSo.objects.select_related('IDNienKhoa').order_by('-IDNienKhoa__TenNienKhoa').first()
        if not latest_thamso:
            return Response({}, status=status.HTTP_200_OK)
        serializer = ThamSoSerializer(latest_thamso)
        return Response(serializer.data)
    

class ListNienKhoaView(generics.ListAPIView):
    queryset = NienKhoa.objects.all()
    serializer_class = NienKhoaSerializer
    permission_classes = [IsAuthenticated] # Chỉ BGH mới được xem danh sách này cho mục đích quản lý

from classes.models import Khoi # Import Khoi model
from classes.serializers import KhoiSerializer # Import KhoiSerializer

class ListKhoiView(generics.ListAPIView):
    queryset = Khoi.objects.all()
    serializer_class = KhoiSerializer
    permission_classes = [IsAuthenticated] 