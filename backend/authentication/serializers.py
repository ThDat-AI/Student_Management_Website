# authentication/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from accounts.models import TaiKhoan # Import từ app accounts

# Serializer để custom token
# trong auth/serializers.py

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    # hàm get_token giữ nguyên
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        try:
            token['role'] = user.taikhoan.MaVaiTro.MaVaiTro 
        except TaiKhoan.DoesNotExist:
            token['role'] = None
        return token

    def validate(self, attrs):
        data = super().validate(attrs) # Lấy data gốc (gồm access, refresh token)
        
        # Thêm thông tin người dùng vào response body
        # self.user đã có sẵn sau khi super().validate() chạy thành công
        try:
            taikhoan = self.user.taikhoan
            data['user'] = {
                'id': taikhoan.id,
                'username': self.user.username,
                'Ho': taikhoan.Ho,
                'Ten': taikhoan.Ten,
                'role': taikhoan.MaVaiTro.MaVaiTro,
                'role_name': taikhoan.MaVaiTro.TenVaiTro
            }
        except TaiKhoan.DoesNotExist:
            data['user'] = None
            
        return data

# Serializers cho chức năng quên mật khẩu
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        if not TaiKhoan.objects.filter(Email__iexact=value).exists():
            raise serializers.ValidationError("Không tìm thấy tài khoản nào với địa chỉ email này.")
        return value

class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    code = serializers.CharField(required=True, max_length=6, min_length=6)
    password = serializers.CharField(required=True, min_length=8, write_only=True, error_messages={'min_length': 'Mật khẩu phải có ít nhất {min_length} ký tự.'})
    password_confirm = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Mật khẩu và xác nhận mật khẩu không khớp."})
        return attrs