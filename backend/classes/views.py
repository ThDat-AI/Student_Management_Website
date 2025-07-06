from rest_framework import generics, views, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from accounts.permissions import IsBGH, IsGiaoVu
from .models import Khoi, LopHoc, LopHoc_MonHoc
from .serializers import KhoiSerializer, LopHocSerializer, LopHocMonHocUpdateSerializer
from subjects.models import MonHoc
from subjects.serializers import MonHocSerializer

# Danh sách khối học (dropdown)
class KhoiListView(generics.ListAPIView):
    queryset = Khoi.objects.all()
    serializer_class = KhoiSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu]

# Tạo và lọc lớp học (admin)
class LopHocListCreateView(generics.ListCreateAPIView):
    queryset = LopHoc.objects.select_related('IDKhoi', 'IDNienKhoa', 'IDToHop').prefetch_related('MonHoc').order_by('-IDNienKhoa__TenNienKhoa', 'TenLop')
    serializer_class = LopHocSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['IDNienKhoa', 'IDKhoi', 'IDToHop']
    search_fields = ['TenLop']

# Danh sách lớp học dùng cho dropdown (lọc đơn giản theo Niên Khóa)
class LopHocListView(generics.ListAPIView):
    serializer_class = LopHocSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = LopHoc.objects.all()
        nienkhoa_id = self.request.query_params.get("nienkhoa_id")
        if nienkhoa_id:
            queryset = queryset.filter(IDNienKhoa__id=nienkhoa_id)
        return queryset

# Chi tiết lớp học
class LopHocDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LopHoc.objects.all()
    serializer_class = LopHocSerializer
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu]

    def perform_destroy(self, instance):
        if instance.HocSinh.exists():
            raise ValidationError("Không thể xóa lớp học này vì vẫn còn học sinh trong lớp.")
        instance.delete()

# Cập nhật môn học theo lớp học
class LopHocMonHocUpdateView(views.APIView):
    permission_classes = [IsAuthenticated, IsBGH | IsGiaoVu]

    def get_lop_hoc(self, pk):
        try:
            return LopHoc.objects.get(pk=pk)
        except LopHoc.DoesNotExist:
            return None

    def post(self, request, pk):
        lop_hoc = self.get_lop_hoc(pk)
        if not lop_hoc:
            return Response({"detail": "Lớp học không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

        serializer = LopHocMonHocUpdateSerializer(data=request.data)
        if serializer.is_valid():
            monhoc_ids = serializer.validated_data['monhoc_ids']
            nien_khoa_lop_hoc = lop_hoc.IDNienKhoa
            mon_hoc_qs = MonHoc.objects.filter(pk__in=monhoc_ids)

            for mon_hoc in mon_hoc_qs:
                if mon_hoc.IDNienKhoa != nien_khoa_lop_hoc:
                    return Response({
                        "detail": f"Môn học '{mon_hoc.TenMonHoc}' không thuộc niên khóa '{nien_khoa_lop_hoc.TenNienKhoa}'."},
                        status=status.HTTP_400_BAD_REQUEST)

            lop_hoc.MonHoc.set(mon_hoc_qs)
            return Response({"message": "Cập nhật môn học cho lớp thành công."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Danh sách môn học theo lớp (cho giáo viên nhập điểm)
class MonHocTheoLopView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        lop_hoc_id = request.query_params.get('lop_hoc_id')
        if not lop_hoc_id:
            return Response({"detail": "Thiếu ID lớp học"}, status=400)

        mon_hoc_qs = LopHoc_MonHoc.objects.filter(IDLopHoc_id=lop_hoc_id).select_related('IDMonHoc')
        mon_hoc_list = [mh.IDMonHoc for mh in mon_hoc_qs]
        return Response(MonHocSerializer(mon_hoc_list, many=True).data)
