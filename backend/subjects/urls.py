from subjects.views import MonHocTheoLopView
from django.urls import path
from . import views

urlpatterns = [
    path('tohop/', views.ToHopListView.as_view(), name='tohop-list'),

    # Thêm dòng này để khớp với frontend
    path('monhoc-list/', views.MonHocListCreateView.as_view(), name='monhoc-list'),

    path('monhoc/', views.MonHocListCreateView.as_view(), name='monhoc-list-create'),
    path('monhoc/<int:pk>/', views.MonHocDetailView.as_view(), name='monhoc-detail'),
     path('monhoc-theo-lop/<int:lop_id>/', MonHocTheoLopView.as_view(), name='monhoc-theo-lop'),
     path('nienkhoa/', views.NienKhoaListView.as_view(), name='nienkhoa-list'),

]
