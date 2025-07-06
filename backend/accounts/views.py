# accounts/views.py
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import TaiKhoan, VaiTro
from .serializers import TaiKhoanSerializer, VaiTroSerializer, UserProfileSerializer
from .permissions import IsBGH

# --- Views cho Admin/BGH quản lý ---
class CreateTaiKhoanView(generics.CreateAPIView):
    queryset = TaiKhoan.objects.all()
    serializer_class = TaiKhoanSerializer
    permission_classes = [IsAuthenticated, IsBGH] # Sử dụng permission class mới

class ListTaiKhoanView(generics.ListAPIView):
    queryset = TaiKhoan.objects.all()
    serializer_class = TaiKhoanSerializer
    permission_classes = [IsAuthenticated, IsBGH]

class UpdateTaiKhoanView(generics.UpdateAPIView):
    queryset = TaiKhoan.objects.all()
    serializer_class = TaiKhoanSerializer
    permission_classes = [IsAuthenticated, IsBGH]

class DeleteTaiKhoanView(generics.DestroyAPIView):
    queryset = TaiKhoan.objects.all()
    permission_classes = [IsAuthenticated, IsBGH]

    def perform_destroy(self, instance):
        # User sẽ tự động bị xóa theo on_delete=models.CASCADE
        instance.user.delete()
        # instance.delete() # Dòng này không cần thiết nữa

# --- View cho các chức năng khác ---
class ListVaiTroView(generics.ListAPIView):
    queryset = VaiTro.objects.all()
    serializer_class = VaiTroSerializer
    permission_classes = [IsAuthenticated]

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.taikhoan

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsBGH]

    def get(self, request, *args, **kwargs):
        data = {
            'total_accounts': TaiKhoan.objects.count(),
            'teacher_accounts': TaiKhoan.objects.filter(MaVaiTro__MaVaiTro='GiaoVien').count(),
            'giaovu_accounts': TaiKhoan.objects.filter(MaVaiTro__MaVaiTro='GiaoVu').count(),
            'bgh_accounts': TaiKhoan.objects.filter(MaVaiTro__MaVaiTro='BGH').count(),
        }
        return Response(data, status=status.HTTP_200_OK)