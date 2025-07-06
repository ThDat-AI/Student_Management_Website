# subjects/views.py

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsBGH # Import permission IsBGH
from .models import ToHop, MonHoc
from .serializers import ToHopSerializer, MonHocSerializer

from classes.models import LopHoc
from rest_framework.views import APIView
from rest_framework.response import Response
from configurations.models import NienKhoa
from .serializers import NienKhoaSerializer


class ToHopListView(generics.ListAPIView):
    queryset = ToHop.objects.all()
    serializer_class = ToHopSerializer
    # Cập nhật permission nếu cần
    permission_classes = [IsAuthenticated, IsBGH] 

class MonHocListCreateView(generics.ListCreateAPIView):
    queryset = MonHoc.objects.all()
    serializer_class = MonHocSerializer
    permission_classes = [IsAuthenticated] # Placeholder, cần chỉnh sửa

class MonHocDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MonHoc.objects.all()
    serializer_class = MonHocSerializer
    permission_classes = [IsAuthenticated] # Placeholder, cần chỉnh sửa

class MonHocTheoLopView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, lop_id):
        try:
            lop = LopHoc.objects.get(pk=lop_id)
            monhoc_list = lop.MonHoc.all()  # many-to-many
            serializer = MonHocSerializer(monhoc_list, many=True)
            return Response(serializer.data)
        except LopHoc.DoesNotExist:
            return Response({"detail": "Lớp học không tồn tại."}, status=404)
        
class NienKhoaListView(generics.ListAPIView):
    queryset = NienKhoa.objects.all()
    serializer_class = NienKhoaSerializer
    permission_classes = [IsAuthenticated]
