# accounts/permissions.py

from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied
from .models import TaiKhoan # Import TaiKhoan của bạn

class IsBGH(BasePermission):
    message = "Chỉ người có vai trò BGH mới có quyền thực hiện thao tác này."
    def has_permission(self, request, view):
        try:
            return request.user.taikhoan.MaVaiTro.MaVaiTro == 'BGH'
        except TaiKhoan.DoesNotExist:
            return False

# THÊM PERMISSION CLASS MỚI NÀY
class IsGiaoVu(BasePermission):
    message = "Chỉ người có vai trò Giáo Vụ mới có quyền thực hiện thao tác này."
    def has_permission(self, request, view):
        try:
            return request.user.taikhoan.MaVaiTro.MaVaiTro == 'GiaoVu'
        except TaiKhoan.DoesNotExist:
            return False

class IsGiaoVien(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'taikhoan') and request.user.taikhoan.MaVaiTro.MaVaiTro == 'GiaoVien'
