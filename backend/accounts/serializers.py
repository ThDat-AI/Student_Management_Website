# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from .models import TaiKhoan, VaiTro

# UserSerializer và TaiKhoanSerializer dùng cho admin/BGH quản lý
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False, 'min_length': 8, 'error_messages': {'min_length': 'Mật khẩu phải có ít nhất {min_length} ký tự.'}},
            'username': {'required': False}
        }

class TaiKhoanSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    MaVaiTro = serializers.PrimaryKeyRelatedField(queryset=VaiTro.objects.all())
    TenVaiTro = serializers.CharField(source='MaVaiTro.TenVaiTro', read_only=True)

    class Meta:
        model = TaiKhoan
        fields = ['id', 'user', 'Ho', 'Ten', 'MaVaiTro', 'TenVaiTro', 'GioiTinh', 'NgaySinh', 'DiaChi', 'SoDienThoai', 'Email']
        extra_kwargs = {'Email': {'error_messages': {'unique': 'Địa chỉ email này đã được sử dụng.'}},
                        'SoDienThoai': {'error_messages': {'unique': 'Số điện thoại này đã được sử dụng.'}},}
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        if 'password' not in user_data:
            raise serializers.ValidationError({'user': {'password': 'This field is required.'}})
        user_data['password'] = make_password(user_data['password'])
        user = User.objects.create(**user_data)
        tai_khoan = TaiKhoan.objects.create(user=user, **validated_data)
        return tai_khoan

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            user = instance.user
            user_data.pop('username', None)
            if 'password' in user_data and user_data['password']:
                user.set_password(user_data['password'])
                user.save()
        
        # Cập nhật các trường còn lại (bao gồm cả MaVaiTro)
        return super().update(instance, validated_data)


# VaiTroSerializer để list các vai trò
class VaiTroSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaiTro
        fields = ['MaVaiTro', 'TenVaiTro']

# UserProfileSerializer dùng cho người dùng tự cập nhật
class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    MaVaiTro = VaiTroSerializer(read_only=True)
    old_password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'}, label="Mật khẩu cũ")
    password = serializers.CharField(write_only=True, required=False, min_length=8, style={'input_type': 'password'}, label="Mật khẩu mới", error_messages={'min_length': 'Mật khẩu mới phải có ít nhất {min_length} ký tự.'})
    password_confirm = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'}, label="Xác nhận mật khẩu mới")

    class Meta:
        model = TaiKhoan
        fields = ['id', 'username', 'Ho', 'Ten', 'GioiTinh', 'NgaySinh', 'DiaChi', 'SoDienThoai', 'Email', 'MaVaiTro', 'old_password', 'password', 'password_confirm']
        read_only_fields = ['id', 'username', 'MaVaiTro']

    def validate(self, data):
        user = self.context['request'].user
        instance = self.instance
        new_password = data.get('password')
        if new_password:
            old_password = data.get('old_password')
            if not old_password: raise serializers.ValidationError({'old_password': 'Để đổi mật khẩu, bạn phải nhập mật khẩu cũ.'})
            if not user.check_password(old_password): raise serializers.ValidationError({'old_password': 'Mật khẩu cũ không chính xác.'})
            if new_password != data.get('password_confirm'): raise serializers.ValidationError({'password_confirm': 'Mật khẩu xác nhận không khớp.'})
        new_email = data.get('Email')
        if new_email and new_email.lower() != instance.Email.lower():
            if TaiKhoan.objects.filter(Email__iexact=new_email).exists(): raise serializers.ValidationError({"Email": "Email này đã được sử dụng."})
        new_phone = data.get('SoDienThoai')
        if new_phone and new_phone != instance.SoDienThoai:
             if TaiKhoan.objects.filter(SoDienThoai=new_phone).exists(): raise serializers.ValidationError({"SoDienThoai": "Số điện thoại này đã được sử dụng."})
        return data
    
    def update(self, instance, validated_data):
        user = instance.user
        password = validated_data.get('password')
        if password:
            user.set_password(password)
            user.save()
        validated_data.pop('old_password', None)
        validated_data.pop('password', None)
        validated_data.pop('password_confirm', None)
        return super().update(instance, validated_data)