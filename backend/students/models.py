# students/models.py

from django.db import models
from django.core.exceptions import ValidationError
from datetime import date
from configurations.models import ThamSo # Import ThamSo để kiểm tra tuổi

class HocSinh(models.Model):
    Ho = models.CharField(max_length=50)
    Ten = models.CharField(max_length=50)
    GENDER_CHOICES = (
        ('Nam', 'Nam'),
        ('Nữ', 'Nữ'),
        ('Khác', 'Khác'),
    )
    GioiTinh = models.CharField(max_length=10, choices=GENDER_CHOICES)
    NgaySinh = models.DateField()
    DiaChi = models.CharField(max_length=255)
    Email = models.EmailField(unique=True, null=True, blank=True)
    IDNienKhoaTiepNhan = models.ForeignKey('configurations.NienKhoa', on_delete=models.PROTECT)
    # ID này phải trỏ rõ ràng đến app 'classes'
    KhoiDuKien = models.ForeignKey('classes.Khoi', on_delete=models.PROTECT, null=True, blank=True) 

    def __str__(self): return f"{self.Ho} {self.Ten}"

    def clean(self):
        super().clean()
        if not self.IDNienKhoaTiepNhan:
            raise ValidationError('Niên khóa tiếp nhận không được để trống.')
        
        try:
            thamso = ThamSo.objects.get(IDNienKhoa=self.IDNienKhoaTiepNhan)
        except ThamSo.DoesNotExist:
            raise ValidationError(f"Chưa có quy định cho niên khóa {self.IDNienKhoaTiepNhan.TenNienKhoa}. Vui lòng thiết lập quy định trước khi thêm học sinh.")

        if not self.NgaySinh: # Đảm bảo NgaySinh không rỗng trước khi tính toán
            raise ValidationError('Ngày sinh không được để trống.')

        # Tính tuổi của học sinh tại thời điểm tiếp nhận (giả sử vào ngày 1/9 của năm bắt đầu niên khóa)
        nien_khoa_start_year_str = self.IDNienKhoaTiepNhan.TenNienKhoa.split('-')[0]
        nien_khoa_start_year = int(nien_khoa_start_year_str)
        
        # Ngày 1 tháng 9 của năm bắt đầu niên khóa
        september_first_of_nien_khoa = date(nien_khoa_start_year, 9, 1)

        # Tính tuổi
        # Dùng cách tính tuổi chính xác hơn dựa vào ngày tháng năm
        today_for_calc = september_first_of_nien_khoa # Hoặc ngày nhập học thực tế
        calculated_age = today_for_calc.year - self.NgaySinh.year - ((today_for_calc.month, today_for_calc.day) < (self.NgaySinh.month, self.NgaySinh.day))

        # Kiểm tra ràng buộc tuổi
        if not (thamso.TuoiToiThieu <= calculated_age <= thamso.TuoiToiDa):
            raise ValidationError(
                f"Tuổi của học sinh ({calculated_age} tuổi) tại thời điểm tiếp nhận ({september_first_of_nien_kho.strftime('%d/%m/%Y')}) "
                f"không nằm trong khoảng quy định ({thamso.TuoiToiThieu}-{thamso.TuoiToiDa} tuổi) cho niên khóa này."
            )
        
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta: db_table = 'HOCSINH'