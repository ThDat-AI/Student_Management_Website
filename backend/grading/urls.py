# grading/urls.py
from django.urls import path
from .views import DiemSoListView, cap_nhat_diem
from .views import ListHocKyView

urlpatterns = [
    path('diemso/', DiemSoListView.as_view(), name='diemso-list'),
    path('diemso/cap-nhat/', cap_nhat_diem, name='cap-nhat-diem'),
    path('hocky-list/', ListHocKyView.as_view(), name='hocky-list'),
]
