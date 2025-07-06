// src/components/HomeRedirect.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const HomeRedirect = () => {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Lấy role từ user object trong context
  const role = user?.role || user?.MaVaiTro?.MaVaiTro;

  switch (role) {
    case "BGH":
      return <Navigate to="/bgh" replace />;
    case "GiaoVu":
      return <Navigate to="/giaovu" replace />;
    case "GiaoVien":
      return <Navigate to="/giaovien" replace />;
    default:
      // Nếu có token nhưng không có role hoặc role lạ
      return <Navigate to="/unauthorized" replace />;
  }
};

export default HomeRedirect;