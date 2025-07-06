# accounts/models.py
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator

class VaiTro(models.Model):
    MaVaiTro = models.CharField(max_length=20, unique=True, primary_key=True)
    TenVaiTro = models.CharField(max_length=50)

    def __str__(self):
        return self.TenVaiTro

    class Meta:
        db_table = 'VAITRO'

class TaiKhoan(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='taikhoan')
    Ho = models.CharField(max_length=50)
    Ten = models.CharField(max_length=50)
    MaVaiTro = models.ForeignKey(VaiTro, on_delete=models.CASCADE)
    GENDER_CHOICES = (('Nam', 'Nam'), ('Nữ', 'Nữ'), ('Khác', 'Khác'),)
    GioiTinh = models.CharField(max_length=10, choices=GENDER_CHOICES)
    NgaySinh = models.DateField()
    DiaChi = models.CharField(max_length=255)
    SoDienThoai = models.CharField(max_length=20, validators=[RegexValidator(r'^\d{10,11}$', 'Số điện thoại không hợp lệ')], unique=True)
    Email = models.EmailField(unique=True)

    def __str__(self):
        return f"{self.Ho} {self.Ten}"

    class Meta:
        db_table = 'TAIKHOAN'