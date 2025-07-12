# classes/urls.py
from django.urls import path
from . import views
from .views import (
    KhoiListView,
    LopHocListCreateView,
    LopHocDetailView,
    LopHocListView,
    MonHocTheoLopView,
    LopHocMonHocUpdateView,
    LopHocHocSinhManagementView,
    XuatDanhSachHocSinhView,
    DanhSachHocSinhJsonView
)

urlpatterns = [
    path('khoi/', KhoiListView.as_view(), name='khoi-list'),
    path('lophoc/', LopHocListCreateView.as_view(), name='lophoc-list-create'),
    path('lophoc/<int:pk>/', LopHocDetailView.as_view(), name='lophoc-detail'),
    path('lophoc-list/', LopHocListView.as_view(), name='lop-hoc-list'),  
    path('monhoc-theo-lop/', MonHocTheoLopView.as_view(), name='monhoc-theo-lop'),
    path('lophoc/<int:pk>/monhoc/', LopHocMonHocUpdateView.as_view(), name='lophoc-monhoc-update'),
    path('lophoc/<int:pk>/hocsinh/', LopHocHocSinhManagementView.as_view(), name='lophoc-hocsinh-management'),
    path('lophoc/xuat-danh-sach/', XuatDanhSachHocSinhView.as_view(), name='xuat-danh-sach-hoc-sinh'),
    path('lophoc/danh-sach-json/', DanhSachHocSinhJsonView.as_view(), name='danh-sach-hoc-sinh-json')

]
