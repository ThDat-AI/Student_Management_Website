# configurations/urls.py

from django.urls import path
from . import views
from .views import TaoNienKhoaVaThamSoView

urlpatterns = [
    path('quydinh/', views.ListCreateQuyDinhView.as_view(), name='list-create-quydinh'),
    path('quydinh/settings/latest/', views.LatestQuyDinhSettingsView.as_view(), name='latest-quydinh-settings'),
    path('quydinh/latest/', views.LatestQuyDinhView.as_view(), name='latest-quydinh'),
    path('quydinh/<int:IDNienKhoa>/', views.QuyDinhDetailView.as_view(), name='detail-quydinh'),
    path('nienkhoa-list/', views.ListNienKhoaView.as_view(), name='nienkhoa-list'),
    path('khoi-list/', views.ListKhoiView.as_view(), name='khoi-list'),
    path('tao-nien-khoa-va-tham-so/', TaoNienKhoaVaThamSoView.as_view(), name='tao-nien-khoa-tham-so'),

]