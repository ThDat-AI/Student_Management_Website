from django.urls import path
from .views import (
    BaoCaoMonHocView, ExportBaoCaoMonHocExcel, ExportBaoCaoMonHocPDF,
    BaoCaoHocKyView, ExportBaoCaoHocKyExcel, ExportBaoCaoHocKyPDF,
)

urlpatterns = [
    # Báo cáo theo môn học
    path('baocao/monhoc/', BaoCaoMonHocView.as_view(), name='baocao-monhoc'),
    path('baocao/monhoc/xuat-excel/', ExportBaoCaoMonHocExcel.as_view(), name='baocao-monhoc-excel'),
    path('baocao/monhoc/xuat-pdf/', ExportBaoCaoMonHocPDF.as_view(), name='baocao-monhoc-pdf'),

    # Báo cáo theo học kỳ
    path('baocao/hocky/', BaoCaoHocKyView.as_view(), name='baocao-hocky'),
    path('baocao/hocky/xuat-excel/', ExportBaoCaoHocKyExcel.as_view(), name='baocao-hocky-excel'),
    path('baocao/hocky/xuat-pdf/', ExportBaoCaoHocKyPDF.as_view(), name='baocao-hocky-pdf'),
]
