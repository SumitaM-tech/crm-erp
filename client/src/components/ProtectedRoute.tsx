import { Navigate, Outlet } from "react-router-dom";
import { useAuth, UserRole } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
