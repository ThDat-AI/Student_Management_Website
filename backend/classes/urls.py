# classes/urls.py

from django.urls import path
from . import views
<<<<<<< HEAD
from .views import KhoiListView, LopHocListCreateView, LopHocDetailView, LopHocListView, MonHocTheoLopView

urlpatterns = [
    path('khoi/', KhoiListView.as_view(), name='khoi-list'),
    path('lophoc/', LopHocListCreateView.as_view(), name='lophoc-list-create'),
    path('lophoc/<int:pk>/', LopHocDetailView.as_view(), name='lophoc-detail'),
    path('lophoc-list/', LopHocListView.as_view(), name='lop-hoc-list'),
    path('monhoc-theo-lop/', MonHocTheoLopView.as_view(), name='monhoc-theo-lop'),
]
=======
# SỬA LẠI DÒNG NÀY:
from .views import KhoiListView, LopHocListCreateView, LopHocDetailView, LopHocMonHocUpdateView

urlpatterns = [
    # URLs cho Khoi (Khối)
    path('khoi/', views.KhoiListView.as_view(), name='khoi-list'),
    
    # URLs cho LopHoc (Lớp học)
    path('lophoc/', views.LopHocListCreateView.as_view(), name='lophoc-list-create'),
    path('lophoc/<int:pk>/', views.LopHocDetailView.as_view(), name='lophoc-detail'),
    
    # URL mới để cập nhật môn học cho lớp
    path('lophoc/<int:pk>/monhoc/', views.LopHocMonHocUpdateView.as_view(), name='lophoc-monhoc-update'),

    # URL này đã được LopHocListCreateView bao gồm, nhưng giữ lại nếu frontend có dùng
    # Đổi tên cho rõ ràng hơn
    path('lophoc-list/', views.LopHocListCreateView.as_view(), name='lop-hoc-list-filter'),
]
>>>>>>> c008513 (Thêm chức năng quản lý lớp học)
