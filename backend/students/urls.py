# students/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('hocsinh/', views.HocSinhListCreateView.as_view(), name='hocsinh-list-create'),
    path('hocsinh/<int:pk>/', views.HocSinhDetailView.as_view(), name='hocsinh-detail'),
    
    # URLs cho các dropdown lọc (đã được đổi tên rõ ràng hơn)
    path('filters/nienkhoa/', views.NienKhoaFilterListView.as_view(), name='hocsinh-filter-nienkhoa'),
    path('filters/khoi/', views.KhoiFilterListView.as_view(), name='hocsinh-filter-khoi'),
]