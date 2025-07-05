# subjects/views.py

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsBGH # Import permission IsBGH
from .models import ToHop, MonHoc
from .serializers import ToHopSerializer, MonHocSerializer

class ToHopListView(generics.ListAPIView):
    queryset = ToHop.objects.all()
    serializer_class = ToHopSerializer
    # Cập nhật permission nếu cần
    permission_classes = [IsAuthenticated, IsBGH] 

class MonHocListCreateView(generics.ListCreateAPIView):
    queryset = MonHoc.objects.all()
    serializer_class = MonHocSerializer
    permission_classes = [IsAuthenticated, IsAuthenticated] # Placeholder, cần chỉnh sửa

class MonHocDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MonHoc.objects.all()
    serializer_class = MonHocSerializer
    permission_classes = [IsAuthenticated, IsAuthenticated] # Placeholder, cần chỉnh sửa