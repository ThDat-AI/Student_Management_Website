from django.urls import path
from .views import (
    DiemSoListView,
    cap_nhat_diem,
    ListHocKyView,
    XuatExcelDiemSoAPIView,
    XuatPDFDiemSoAPIView
)

urlpatterns = [
    path('diemso/', DiemSoListView.as_view(), name='diemso-list'),
    path('diemso/cap-nhat/', cap_nhat_diem, name='cap-nhat-diem'),
    path('hocky-list/', ListHocKyView.as_view(), name='hocky-list'),
    path('diemso/xuat-excel/', XuatExcelDiemSoAPIView.as_view(), name='diemso-xuat-excel'),
    path('diemso/xuat-pdf/', XuatPDFDiemSoAPIView.as_view(), name='diemso-xuat-pdf'),
]
