// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// layouts
import StudentLayout from "./layouts/StudentLayout";
import SupervisorLayout from "./layouts/SupervisorLayout";
import AdminLayout from "./layouts/AdminLayout";
import AuthLayout from "./layouts/AuthLayout";
import HomeLayout from "./layouts/HomeLayout";

// pages (adjust paths/names to match your repo)
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import StudentDashboard from "./pages/StudentDashboard";
import StudentApplications from "./pages/StudentApplications";

import SupervisorDashboard from "./pages/SupervisorDashboard";

import AdminDashboard from "./pages/AdminDashboard";

import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* public routes */}
          <Route element={<HomeLayout />}>
            <Route path="/" element={<Home />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* STUDENT routes */}
          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route element={<StudentLayout />}>
              <Route
                path="/student/dashboard"
                element={<StudentDashboard />}
              />
              <Route
                path="/student/applications"
                element={<StudentApplications />}
              />
            </Route>
          </Route>

          {/* SUPERVISOR routes */}
          <Route element={<ProtectedRoute allowedRoles={["supervisor"]} />}>
            <Route element={<SupervisorLayout />}>
              <Route
                path="/supervisor/dashboard"
                element={<SupervisorDashboard />}
              />
              {/* add more here */}
            </Route>
          </Route>

          {/* ADMIN routes */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              {/* add more here */}
            </Route>
          </Route>

          {/* default redirect or 404 */}
          <Route path="/student" element={<Navigate to="/student/dashboard" />} />
          <Route path="/supervisor" element={<Navigate to="/supervisor/dashboard" />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
