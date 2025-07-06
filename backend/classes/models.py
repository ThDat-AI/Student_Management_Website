# classes/models.py
from django.db import models

class Khoi(models.Model):
    TenKhoi = models.CharField(max_length=10, unique=True) # VD: "Khối 10", "Khối 11"
    def __str__(self): return self.TenKhoi
    class Meta: db_table = 'KHOI'

class LopHoc(models.Model):
    TenLop = models.CharField(max_length=50)
    IDKhoi = models.ForeignKey(Khoi, on_delete=models.PROTECT)
    SiSo = models.PositiveIntegerField(default=0)
    IDNienKhoa = models.ForeignKey('configurations.NienKhoa', on_delete=models.PROTECT)
    IDToHop = models.ForeignKey('subjects.ToHop', on_delete=models.SET_NULL, null=True, blank=True)
    MonHoc = models.ManyToManyField('subjects.MonHoc', through='LopHoc_MonHoc', related_name='lophoc_list')
    HocSinh = models.ManyToManyField('students.HocSinh', through='LopHoc_HocSinh', related_name='lophoc_list')
    def __str__(self): return f"{self.TenLop} ({self.IDNienKhoa.TenNienKhoa})"
    class Meta: db_table = 'LOPHOC'; unique_together = ('TenLop', 'IDNienKhoa')

class LopHoc_MonHoc(models.Model):
    IDLopHoc = models.ForeignKey(LopHoc, on_delete=models.CASCADE)
    IDMonHoc = models.ForeignKey('subjects.MonHoc', on_delete=models.CASCADE)
    class Meta: db_table = 'LOPHOC_MONHOC'; unique_together = ('IDLopHoc', 'IDMonHoc')

class LopHoc_HocSinh(models.Model):
    IDLopHoc = models.ForeignKey(LopHoc, on_delete=models.CASCADE)
    IDHocSinh = models.ForeignKey('students.HocSinh', on_delete=models.CASCADE)
    class Meta: db_table = 'LOPHOC_HOCSINH'; unique_together = ('IDLopHoc', 'IDHocSinh')