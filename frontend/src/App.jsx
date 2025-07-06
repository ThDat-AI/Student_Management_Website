// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

import { AuthProvider } from "./contexts/AuthContext";
import { LayoutProvider } from "./contexts/LayoutContext";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import HomeRedirect from "./components/HomeRedirect";

import Login from "./pages/Common/Login";
import NotFound from "./pages/Common/NotFound";
import Unauthorized from "./pages/Common/Unauthorized";

import BGHDashboard from "./pages/BGH/BGHDashboard";
import AccountManagement from "./pages/BGH/AccountManagement/AccountManagement";
import QuyDinhManagement from "./pages/BGH/QuyDinhManagement";
import BaoCaoThongKe from "./pages/BGH/BaoCaoThongKe";
import BaoCaoTongKetHocKy from "./pages/BGH/BaoCaoTongKetHocKy";
import BaoCaoTongKetMonBGH from "./pages/BGH/BaoCaoTongKetMon"; // ✅ Đổi tên

import GiaoVuDashboard from "./pages/GiaoVu/GiaoVuDashboard";
import StudentManagement from "./pages/GiaoVu/StudentManagement/StudentManagement";
import BaoCaoTongKetMonGV from "./pages/GiaoVu/BaoCaoTongKetMon"; // ✅ Đổi tên

import GiaoVienDashboard from "./pages/GiaoVien/GiaoVienDashboard";
import NhapDiemHocSinh from "./pages/GiaoVien/NhapDiemHocSinh";

import PasswordResetRequest from "./pages/Common/PasswordResetRequest";
import PasswordResetConfirm from "./pages/Common/PasswordResetConfirm";

import QuanLyMonHoc from "./pages/BGH/QuanLyMonHoc";
import StudentManagement from "./pages/GiaoVu/StudentManagement/StudentManagement";
import BaoCaoTongKetMon from "./pages/GiaoVu/BaoCaoTongKetMon";
import BaoCaoTongKetHocKy from "./pages/BGH/BaoCaoTongKetHocKy";
import NhapDiemHocSinh from "./pages/GiaoVien/NhapDiemHocSinh";
import QuanLyLopHoc from "./pages/GiaoVu/QuanLyLopHoc/QuanLyLopHoc";


function App() {
  return (
    <Router>
      <AuthProvider>
        <LayoutProvider>
          <Routes>
            {/* Guest routes */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/password-reset" element={<PasswordResetRequest />} />
              <Route path="/password-reset/confirm" element={<PasswordResetConfirm />} />
            </Route>

            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route index element={<HomeRedirect />} />

                {/* BGH routes */}
                <Route element={<ProtectedRoute allowedRoles={["BGH"]} />}>
                  <Route path="bgh" element={<BGHDashboard />} />
                  <Route path="bgh/taikhoan" element={<AccountManagement />} />
                  <Route path="bgh/quydinh" element={<QuyDinhManagement />} />
                  <Route path="bgh/baocao" element={<BaoCaoThongKe />} />
                  <Route path="bgh/baocao-hocky" element={<BaoCaoTongKetHocKy />} />
                  <Route path="bgh/baocao-monhoc" element={<BaoCaoTongKetMonBGH />} />
                  <Route path="bgh/monhoc" element={<QuanLyMonHoc />} />
                </Route>

                {/* Giao Vu routes */}
                <Route element={<ProtectedRoute allowedRoles={["GiaoVu"]} />}>
                  <Route path="giaovu" element={<GiaoVuDashboard />} />
                  <Route path="giaovu/hocsinh" element={<StudentManagement />} />
                  <Route path="giaovu/baocao-monhoc" element={<BaoCaoTongKetMon />} />
                  <Route path="giaovu/quan-ly-lop-hoc" element={<QuanLyLopHoc />} />
                </Route>

                {/* Giao Vien routes */}
                <Route element={<ProtectedRoute allowedRoles={["GiaoVien"]} />}>
                  <Route path="giaovien" element={<GiaoVienDashboard />} />
                  <Route path="teacher/quan-ly-diem" element={<NhapDiemHocSinh />} />
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
