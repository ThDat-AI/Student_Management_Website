# classes/views.py

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsBGH # Import permission IsBGH
from .models import Khoi, LopHoc
from .serializers import KhoiSerializer, LopHocSerializer

class KhoiListView(generics.ListAPIView):
    queryset = Khoi.objects.all()
    serializer_class = KhoiSerializer
    # Cập nhật permission nếu cần (ví dụ: GiaoVu cũng có thể xem)
    permission_classes = [IsAuthenticated, IsBGH] 

class LopHocListCreateView(generics.ListCreateAPIView):
    queryset = LopHoc.objects.all()
    serializer_class = LopHocSerializer
    permission_classes = [IsAuthenticated, IsAuthenticated] # Placeholder, cần chỉnh sửa

class LopHocDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LopHoc.objects.all()
    serializer_class = LopHocSerializer
    permission_classes = [IsAuthenticated, IsAuthenticated] # Placeholder, cần chỉnh sửa