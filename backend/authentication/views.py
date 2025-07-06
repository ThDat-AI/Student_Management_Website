# authentication/views.py
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
import random
from accounts.models import TaiKhoan # Import từ app accounts
from .serializers import (
    CustomTokenObtainPairSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)

from rest_framework.throttling import AnonRateThrottle

class PasswordResetRequestThrottle(AnonRateThrottle):
    rate = '5/hour' # Cho phép 5 yêu cầu mỗi giờ từ 1 IP

class PasswordResetConfirmThrottle(AnonRateThrottle):
    rate = '10/min' # Cho phép 10 lần thử mỗi phút từ 1 IP

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class PasswordResetRequestView(APIView):
    permission_classes = []
    throttle_classes = [PasswordResetRequestThrottle]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = str(random.randint(100000, 999999))
            cache_key = f'password_reset_{email}'
            cache.set(cache_key, code, timeout=300)
            try:
                send_mail(
                    'Mã xác nhận đặt lại mật khẩu',
                    f'Mã xác nhận của bạn là: {code}\n\nMã này sẽ hết hạn sau 5 phút.',
                    settings.EMAIL_HOST_USER,
                    [email],
                    fail_silently=False,
                )
            except Exception as e:
                return Response({"error": "Không thể gửi email. Vui lòng thử lại sau."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({"message": "Mã xác nhận đã được gửi đến email của bạn."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    permission_classes = []
    throttle_classes = [PasswordResetConfirmThrottle]
    
    def post(self, request, *args, **kwargs):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            email, code, password = data['email'], data['code'], data['password']
            cache_key = f'password_reset_{email}'
            cached_code = cache.get(cache_key)

            if not cached_code: return Response({"error": "Mã xác nhận đã hết hạn."}, status=status.HTTP_400_BAD_REQUEST)
            if cached_code != code: return Response({"error": "Mã xác nhận không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = TaiKhoan.objects.get(Email__iexact=email).user
                user.set_password(password)
                user.save()
                cache.delete(cache_key)
                return Response({"message": "Mật khẩu của bạn đã được đặt lại thành công."}, status=status.HTTP_200_OK)
            except TaiKhoan.DoesNotExist:
                return Response({"error": "Không tìm thấy tài khoản."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)