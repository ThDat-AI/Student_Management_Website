// src/App.jsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context providers
import { AuthProvider } from "./contexts/AuthContext";
import { LayoutProvider } from "./contexts/LayoutContext";

// Layouts & routing components
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import HomeRedirect from "./components/HomeRedirect";

// Common pages
import Login from "./pages/Common/Login";
import NotFound from "./pages/Common/NotFound";
import Unauthorized from "./pages/Common/Unauthorized";
import PasswordResetRequest from "./pages/Common/PasswordResetRequest";
import PasswordResetConfirm from "./pages/Common/PasswordResetConfirm";
import XemDiemSo from "./pages/Common/GiaoVien_GiaoVu_BGH/XemDiemSo";
import BaoCaoTongKetHocKy from "./pages/Common/GiaoVien_GiaoVu_BGH/BaoCaoTongKetHocKy";
import BaoCaoTongKetMon from "./pages/Common/GiaoVien_GiaoVu_BGH/BaoCaoTongKetMon";
import BaoCaoThongKe from "./pages/Common/GiaoVien_GiaoVu_BGH/BaoCaoThongKe";

// BGH pages
import BGHDashboard from "./pages/BGH/BGHDashboard";
import AccountManagement from "./pages/BGH/AccountManagement/AccountManagement";
import QuyDinhManagement from "./pages/BGH/QuyDinhManagement";
import QuanLyMonHoc from "./pages/BGH/QuanLyMonHoc";

// Giao Vu pages
import GiaoVuDashboard from "./pages/GiaoVu/GiaoVuDashboard";
import QuanLyDanhSachLopPage from "./pages/GiaoVu/LapDanhSachLop/QuanLyDanhSachLopPage";
import StudentManagement from "./pages/GiaoVu/StudentManagement/StudentManagement";
import QuanLyLopHoc from "./pages/GiaoVu/QuanLyLopHoc/QuanLyLopHoc";
import LapDanhSachLop from "./pages/GiaoVu/LapDanhSachLop/LapDanhSachLop";
import QuanLyQuyenSuaDiem from "./pages/GiaoVu/QuanLyQuyenSuaDiem"; 


// Giao Vien pages
import GiaoVienDashboard from "./pages/GiaoVien/GiaoVienDashboard";
import NhapDiemHocSinh from "./pages/GiaoVien/NhapDiemHocSinh";
import TraCuuHocSinh from "./pages/GiaoVien/TraCuuHocSinh";
import DanhSachLop from "./pages/GiaoVien/DanhSachLop";

function App() {
  return (
    <Router>
      <AuthProvider>
        <LayoutProvider>
          {/* Thêm ToastContainer ở đây để dùng toast global */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          <Routes>
            {/* Guest Routes */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/password-reset" element={<PasswordResetRequest />} />
              <Route path="/password-reset/confirm" element={<PasswordResetConfirm />} />
            </Route>

            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route index element={<HomeRedirect />} />

                {/* BGH Routes */}
                <Route element={<ProtectedRoute allowedRoles={["BGH"]} />}>
                  <Route path="bgh" element={<BGHDashboard />} />
                  <Route path="bgh/taikhoan" element={<AccountManagement />} />
                  <Route path="bgh/quydinh" element={<QuyDinhManagement />} />
                  <Route path="bgh/baocao" element={<BaoCaoThongKe />} />
                  <Route path="bgh/baocao-hocky" element={<BaoCaoTongKetHocKy />} />
                  <Route path="bgh/baocao-monhoc" element={<BaoCaoTongKetMon />} />
                  <Route path="bgh/monhoc" element={<QuanLyMonHoc />} />
                  <Route path="bgh/xem-diem" element={<XemDiemSo />} />
                </Route>

                {/* Giao Vu Routes - ĐÃ CẤU TRÚC LẠI */}
                <Route element={<ProtectedRoute allowedRoles={["GiaoVu", "BGH"]} />}>
                  <Route path="giaovu" element={<GiaoVuDashboard />} />
                  
                  {/* Nhóm Quản lý học sinh */}
                  <Route path="giaovu/hoc-sinh/tiep-nhan" element={<StudentManagement />} />
                  <Route path="giaovu/hoc-sinh/tra-cuu" element={<TraCuuHocSinh />} />
                  
                  {/* Quản lý lớp học (tạo lớp) */}
                  <Route path="giaovu/quan-ly-lop-hoc" element={<QuanLyLopHoc />} />
                  
                  {/* Nhóm Danh sách lớp */}
                  <Route path="giaovu/danh-sach-lop" element={<QuanLyDanhSachLopPage />} />
                  <Route path="giaovu/danh-sach-lop/lap-danh-sach" element={<LapDanhSachLop />} />
                  <Route path="giaovu/danh-sach-lop/xuat-danh-sach" element={<DanhSachLop />} />
                  
                  {/* Báo cáo */}
                  <Route path="giaovu/baocao" element={<BaoCaoThongKe />} />
                  <Route path="giaovu/baocao-hocky" element={<BaoCaoTongKetHocKy />} />
                  <Route path="giaovu/baocao-monhoc" element={<BaoCaoTongKetMon />} />

                  {/* Xem điểm */}
                  <Route path="giaovu/xem-diem" element={<XemDiemSo />} />
                  <Route path="giaovu/quyen-sua-diem" element={<QuanLyQuyenSuaDiem />} />
                </Route>

                {/* Giao Vien Routes */}
                <Route element={<ProtectedRoute allowedRoles={["GiaoVien"]} />}>
                  <Route path="giaovien" element={<GiaoVienDashboard />} />
                  <Route path="giaovien/quan-ly-diem" element={<NhapDiemHocSinh />} />
                  <Route path="giaovien/tra-cuu" element={<TraCuuHocSinh />} />
                  <Route path="giaovien/danh-sach-lop" element={<DanhSachLop />} />
                </Route>

              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </LayoutProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;