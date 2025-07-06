# reporting/models.py
from django.db import models

class BaoCaoMonHoc(models.Model):
    IDMonHoc = models.ForeignKey('subjects.MonHoc', on_delete=models.CASCADE)
    IDLopHoc = models.ForeignKey('classes.LopHoc', on_delete=models.CASCADE)
    IDHocKy = models.ForeignKey('grading.HocKy', on_delete=models.CASCADE)
    IDNienKhoa = models.ForeignKey('configurations.NienKhoa', on_delete=models.CASCADE)
    SiSo = models.IntegerField()
    SoLuongDat = models.IntegerField()
    TiLe = models.FloatField()
    class Meta: db_table = 'BAOCAOMONHOC'

class BaoCaoHocKy(models.Model):
    IDLopHoc = models.ForeignKey('classes.LopHoc', on_delete=models.CASCADE)
    IDHocKy = models.ForeignKey('grading.HocKy', on_delete=models.CASCADE)
    IDNienKhoa = models.ForeignKey('configurations.NienKhoa', on_delete=models.CASCADE)
    SiSo = models.IntegerField()
    SoLuongDat = models.IntegerField()
    TiLe = models.FloatField()
    class Meta: db_table = 'BAOCAOHOCKY'