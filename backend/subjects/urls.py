# subjects/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # URLs cho ToHop (Tổ hợp môn)
    path('tohop/', views.ToHopListView.as_view(), name='tohop-list'),
    
    # URLs cho MonHoc (Môn học)
    path('monhoc/', views.MonHocListCreateView.as_view(), name='monhoc-list-create'),
    path('monhoc/<int:pk>/', views.MonHocDetailView.as_view(), name='monhoc-detail'),
    
    # ... Bạn có thể thêm các URL khác cho app 'subjects' tại đây sau này
]