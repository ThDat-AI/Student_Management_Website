# Subject/models.py
from django.db import models

class ToHop(models.Model):
    TenToHop = models.CharField(max_length=100, unique=True) # VD: "Khoa học Tự nhiên", "Khoa học Xã hội"
    def __str__(self): return self.TenToHop
    class Meta: db_table = 'TOHOP'

class MonHoc(models.Model):
    TenMonHoc = models.CharField(max_length=100)
    IDNienKhoa = models.ForeignKey('configurations.NienKhoa', on_delete=models.CASCADE)
    IDToHop = models.ForeignKey(ToHop, on_delete=models.SET_NULL, null=True, blank=True)
    def __str__(self): return f"{self.TenMonHoc} ({self.IDNienKhoa.TenNienKhoa})"
    class Meta: db_table = 'MONHOC'; unique_together = ('TenMonHoc', 'IDNienKhoa')