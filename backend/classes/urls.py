# classes/urls.py

from django.urls import path
from . import views
from .views import KhoiListView, LopHocListCreateView, LopHocDetailView, LopHocListView

urlpatterns = [
    # URLs cho Khoi (Khối)
    path('khoi/', views.KhoiListView.as_view(), name='khoi-list'),
    
    # URLs cho LopHoc (Lớp học)
    path('lophoc/', views.LopHocListCreateView.as_view(), name='lophoc-list-create'),
    path('lophoc/<int:pk>/', views.LopHocDetailView.as_view(), name='lophoc-detail'),
    path('lophoc-list/', LopHocListView.as_view(), name='lop-hoc-list'),
    
    # ... Bạn có thể thêm các URL khác cho app 'classes' tại đây sau này
]