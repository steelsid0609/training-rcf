// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { use } from "react";

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role, loading, profileComplete } = useAuth();
  const location = useLocation();

  if (loading) return null; // or a loader component

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    role === "student" &&
    !profileComplete &&
    location.pathname !== "/student/basic-details"
  ) {
    return <Navigate to="/student/basic-details" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
