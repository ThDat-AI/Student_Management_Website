from django.urls import path
from .views import (
    BaoCaoMonHocView, ExportBaoCaoMonHocExcel,
    BaoCaoHocKyView, ExportBaoCaoHocKyExcel,
)

urlpatterns = [
    # Báo cáo theo môn học
    path('baocao/monhoc/', BaoCaoMonHocView.as_view(), name='baocao-monhoc'),
    path('baocao/monhoc/xuat-excel/', ExportBaoCaoMonHocExcel.as_view(), name='baocao-monhoc-excel'),

    # Báo cáo theo học kỳ
    path('baocao/hocky/', BaoCaoHocKyView.as_view(), name='baocao-hocky'),
    path('baocao/hocky/xuat-excel/', ExportBaoCaoHocKyExcel.as_view(), name='baocao-hocky-excel'),
]
