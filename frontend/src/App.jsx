// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

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

// BGH pages
import BGHDashboard from "./pages/BGH/BGHDashboard";
import AccountManagement from "./pages/BGH/AccountManagement/AccountManagement";
import QuyDinhManagement from "./pages/BGH/QuyDinhManagement";
import BaoCaoThongKeBGH from "./pages/BGH/BaoCaoThongKe";
import BaoCaoTongKetHocKyBGH from "./pages/BGH/BaoCaoTongKetHocKy";
import BaoCaoTongKetMonBGH from "./pages/BGH/BaoCaoTongKetMon";
import QuanLyMonHoc from "./pages/BGH/QuanLyMonHoc";

// Giao Vu pages
import GiaoVuDashboard from "./pages/GiaoVu/GiaoVuDashboard";
import StudentManagement from "./pages/GiaoVu/StudentManagement/StudentManagement";
import BaoCaoThongKeGV from "./pages/GiaoVu/BaoCaoThongKe";
import BaoCaoTongKetMonGV from "./pages/GiaoVu/BaoCaoTongKetMon";
import BaoCaoTongKetHocKyGV from "./pages/GiaoVu/BaoCaoTongKetHocKy";
import QuanLyLopHoc from "./pages/GiaoVu/QuanLyLopHoc/QuanLyLopHoc";
import LapDanhSachLop from "./pages/GiaoVu/LapDanhSachLop/LapDanhSachLop"

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
          <Routes>

            {/* Guest Routes (chưa đăng nhập) */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/password-reset" element={<PasswordResetRequest />} />
              <Route path="/password-reset/confirm" element={<PasswordResetConfirm />} />
            </Route>

            {/* Unauthorized page */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes (sau khi đăng nhập) */}
            <Route path="/" element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route index element={<HomeRedirect />} />

                {/* BGH Routes */}
                <Route element={<ProtectedRoute allowedRoles={["BGH"]} />}>
                  <Route path="bgh" element={<BGHDashboard />} />
                  <Route path="bgh/taikhoan" element={<AccountManagement />} />
                  <Route path="bgh/quydinh" element={<QuyDinhManagement />} />
                  <Route path="bgh/baocao" element={<BaoCaoThongKeBGH />} />
                  <Route path="bgh/baocao-hocky" element={<BaoCaoTongKetHocKyBGH />} />
                  <Route path="bgh/baocao-monhoc" element={<BaoCaoTongKetMonBGH />} />
                  <Route path="bgh/monhoc" element={<QuanLyMonHoc />} />
                </Route>

                {/* Giao Vu Routes */}
                <Route element={<ProtectedRoute allowedRoles={["GiaoVu"]} />}>
                  <Route path="giaovu" element={<GiaoVuDashboard />} />
                  <Route path="giaovu/hocsinh" element={<StudentManagement />} />
                  <Route path="giaovu/baocao" element={<BaoCaoThongKeGV />} />
                  <Route path="giaovu/baocao-hocky" element={<BaoCaoTongKetHocKyGV />} />
                  <Route path="giaovu/baocao-monhoc" element={<BaoCaoTongKetMonGV />} />
                  <Route path="giaovu/quan-ly-lop-hoc" element={<QuanLyLopHoc />} />
                  <Route path="giaovu/lap-danh-sach-lop" element={<LapDanhSachLop />} />
                </Route>

                {/* Giao Vien Routes */}
                <Route element={<ProtectedRoute allowedRoles={["GiaoVien"]} />}>
                  <Route path="giaovien" element={<GiaoVienDashboard />} />
                  <Route path="giaovien/quan-ly-diem" element={<NhapDiemHocSinh />} />
                  <Route path="giaovien/tra-cuu" element={<TraCuuHocSinh />} />
                  <Route path="giaovien/xuat-danh-sach-lop" element={<DanhSachLop />} />
                </Route>
              </Route>
            </Route>

            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </LayoutProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
