// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// Layouts
import HomeLayout from "./layouts/HomeLayout";
import AuthLayout from "./layouts/AuthLayout";
import StudentLayout from "./layouts/StudentLayout";
import SupervisorLayout from "./layouts/SupervisorLayout";
import AdminLayout from "./layouts/AdminLayout";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Student pages
import StudentDashboard from "./pages/StudentDashboard";
import StudentBasicDetailsPage from "./pages/student/StudentBasicDetailsPage";
import StudentChangePasswordPage from "./pages/student/StudentChangePasswordPage";
import StudentCoverLetterPage from "./pages/student/StudentCoverLetterPage";
import StudentApplicationsPage from "./pages/student/StudentApplicationsPage";
import StudentPostingLetterPage from "./pages/student/StudentPostingLetterPage.jsx";

// Supervisor pages
import SupervisorDashboardPage from "./pages/supervisor/SupervisorDashboardPage";
import SupervisorPendingApplicationsPage from "./pages/supervisor/SupervisorPendingApplicationsPage";
import SupervisorAllApplicationsPage from "./pages/supervisor/SupervisorAllApplicationsPage";
// Removed: SupervisorCompletedApplicationsPage
import SupervisorRejectedApplicationsPage from "./pages/supervisor/SupervisorRejectedApplicationsPage";
import SupervisorUsersPage from "./pages/supervisor/SupervisorUsersPage";
import SupervisorCollegesTempPage from "./pages/supervisor/SupervisorCollegesTempPage";
import SupervisorCollegesMasterPage from "./pages/supervisor/SupervisorCollegesMasterPage";
import FinishVerify from "./pages/FinishVerify";
import SupervisorCurrentTraineesPage from "./pages/supervisor/SupervisorCurrentTraineesPage"; 

// Admin pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminSlotsPage from "./pages/admin/AdminSlotsPage";
import AdminApplicationsPage from "./pages/admin/AdminApplicationsPage";
import AdminPendingApplicationsPage from "./pages/admin/AdminPendingApplicationsPage"; 
import AdminCompletedApplicationsPage from "./pages/admin/AdminCompletedApplicationsPage"; 

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC / HOME */}
          <Route element={<HomeLayout />}>
            <Route path="/" element={<Home />} />
          </Route>

          {/* AUTH PAGES */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/finishVerify" element={<FinishVerify />} />
          </Route>

          {/* STUDENT DASHBOARD ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route element={<StudentLayout />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route
                path="/student/basic-details"
                element={<StudentBasicDetailsPage />}
              />
              <Route
                path="/student/change-password"
                element={<StudentChangePasswordPage />}
              />
              <Route
                path="/student/cover-letter"
                element={<StudentCoverLetterPage />}
              />
              <Route
                path="/student/applications"
                element={<StudentApplicationsPage />}
              />
              <Route
                path="/student/posting-letter"
                element={<StudentPostingLetterPage />}
              />
            </Route>
          </Route>

          {/* SUPERVISOR DASHBOARD ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={["supervisor"]} />}>
            <Route element={<SupervisorLayout />}>
              <Route
                path="/supervisor/dashboard"
                element={<SupervisorDashboardPage />}
              />
              <Route
                path="/supervisor/applications/pending"
                element={<SupervisorPendingApplicationsPage />}
              />
              <Route
                path="/supervisor/applications/all"
                element={<SupervisorAllApplicationsPage />}
              />
              
              {/* REPLACED: Completed/Final Confirmation with Current Trainees */}
              <Route 
                path="/supervisor/current-trainees" 
                element={<SupervisorCurrentTraineesPage />} 
              />
              
              <Route
                path="/supervisor/applications/rejected"
                element={<SupervisorRejectedApplicationsPage />}
              />
              <Route
                path="/supervisor/users"
                element={<SupervisorUsersPage />}
              />
              <Route
                path="/supervisor/colleges/temp"
                element={<SupervisorCollegesTempPage />}
              />
              <Route
                path="/supervisor/colleges/master"
                element={<SupervisorCollegesMasterPage />}
              />
            </Route>
          </Route>

          {/* ADMIN DASHBOARD ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/slots" element={<AdminSlotsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/applications" element={<AdminApplicationsPage />} />
              <Route path="/admin/applications/pending" element={<AdminPendingApplicationsPage />} />
              <Route path="/admin/applications/completed" element={<AdminCompletedApplicationsPage />} />
              <Route path="/admin/applications" element={<AdminApplicationsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;