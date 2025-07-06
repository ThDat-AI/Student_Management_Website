// src/components/GuestRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const GuestRoute = () => {
  const { token } = useAuth();
  if (token) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default GuestRoute;