# configurations/models.py
from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError

class NienKhoa(models.Model):
    TenNienKhoa = models.CharField(
        max_length=9, 
        unique=True, 
        help_text="Định dạng YYYY-YYYY, ví dụ: 2023-2024"
    )

    def __str__(self):
        return self.TenNienKhoa

    class Meta:
        db_table = 'NIENKHOA'
        ordering = ['-TenNienKhoa']


class ThamSo(models.Model):
    IDNienKhoa = models.OneToOneField(
        NienKhoa, 
        on_delete=models.PROTECT, 
        primary_key=True, 
        related_name='thamso'
    )
    TuoiToiThieu = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    TuoiToiDa = models.PositiveIntegerField()
    SoMonHocToiDa = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    SiSoToiDa = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    DiemDatMon = models.FloatField(default=5.0)
    SoLopK10 = models.PositiveIntegerField(default=0)
    SoLopK11 = models.PositiveIntegerField(default=0)
    SoLopK12 = models.PositiveIntegerField(default=0)
    ChoPhepSuaDiemHK1 = models.BooleanField(default=False, help_text="Cho phép giáo viên sửa điểm hay không")
    ChoPhepSuaDiemHK2 = models.BooleanField(default=False, help_text="Cho phép giáo viên sửa điểm hay không")

    def __str__(self):
        return f"Quy định niên khóa {self.IDNienKhoa.TenNienKhoa}"

    def clean(self):
        if self.TuoiToiThieu > self.TuoiToiDa:
            raise ValidationError({'TuoiToiDa': 'Tuổi tối đa phải lớn hơn hoặc bằng tuổi tối thiểu.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'THAMSO'
