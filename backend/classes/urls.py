# classes/urls.py

from django.urls import path
from . import views
from .views import KhoiListView, LopHocListCreateView, LopHocDetailView, LopHocListView, MonHocTheoLopView

urlpatterns = [
    path('khoi/', KhoiListView.as_view(), name='khoi-list'),
    path('lophoc/', LopHocListCreateView.as_view(), name='lophoc-list-create'),
    path('lophoc/<int:pk>/', LopHocDetailView.as_view(), name='lophoc-detail'),
    path('lophoc-list/', LopHocListView.as_view(), name='lop-hoc-list'),
    path('monhoc-theo-lop/', MonHocTheoLopView.as_view(), name='monhoc-theo-lop'),
]
