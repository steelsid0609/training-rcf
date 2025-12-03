import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import AppLayout from "./layouts/AppLayout.jsx"; // NEW UNIVERSAL LAYOUT

// --- TOAST NOTIFICATIONS CONFIGURATION ---
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layouts
import HomeLayout from "./layouts/HomeLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";

// Public pages
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import FinishVerify from "./pages/FinishVerify.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import NotFound from "./pages/NotFound.jsx";

// Student pages
import StudentDashboard from "./pages/StudentDashboard.jsx";
import StudentBasicDetailsPage from "./pages/student/StudentBasicDetailsPage.jsx";
import StudentChangePasswordPage from "./pages/student/StudentChangePasswordPage.jsx";
import StudentCoverLetterPage from "./pages/student/StudentCoverLetterPage.jsx";
import StudentApplicationsPage from "./pages/student/StudentApplicationsPage.jsx";
import StudentPostingLetterPage from "./pages/student/StudentPostingLetterPage.jsx";

// Supervisor pages
import SupervisorDashboardPage from "./pages/supervisor/SupervisorDashboardPage.jsx";
import SupervisorPendingApplicationsPage from "./pages/supervisor/SupervisorPendingApplicationsPage.jsx";
import SupervisorPaymentVerificationPage from "./pages/supervisor/SupervisorPaymentVerificationPage.jsx";
import SupervisorRejectedApplicationsPage from "./pages/supervisor/SupervisorRejectedApplicationsPage.jsx";
import SupervisorUsersPage from "./pages/supervisor/SupervisorUsersPage.jsx";
import SupervisorCollegesTempPage from "./pages/supervisor/SupervisorCollegesTempPage.jsx";
import SupervisorCollegesMasterPage from "./pages/supervisor/SupervisorCollegesMasterPage.jsx";
import SupervisorCurrentTraineesPage from "./pages/supervisor/SupervisorCurrentTraineesPage.jsx";
import SupervisorMasterApplicationsPage from "./pages/supervisor/SupervisorMasterApplicationsPage.jsx";

// Admin pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.jsx";
import AdminSlotsPage from "./pages/admin/AdminSlotsPage.jsx";
import AdminApplicationsPage from "./pages/admin/AdminApplicationsPage.jsx";
import AdminPendingApplicationsPage from "./pages/admin/AdminPendingApplicationsPage.jsx";
import AdminPaymentPage from "./pages/admin/AdminPaymentPage.jsx";
import AdminTraineesPage from "./pages/admin/AdminTraineesPage.jsx";
import AdminCompletedApplicationsPage from "./pages/admin/AdminCompletedApplicationsPage.jsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Global Toast Container for Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        <Routes>
          {/* PUBLIC / HOME */}
          <Route element={<HomeLayout />}>
            <Route path="/" element={<Home />} />
          </Route>

          {/* AUTH PAGES */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          <Route path="/finishVerify" element={<FinishVerify />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* STUDENT DASHBOARD ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route element={<AppLayout />}> {/* Use AppLayout */}
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/basic-details" element={<StudentBasicDetailsPage />} />
              <Route path="/student/change-password" element={<StudentChangePasswordPage />} />
              <Route path="/student/cover-letter" element={<StudentCoverLetterPage />} />
              <Route path="/student/applications" element={<StudentApplicationsPage />} />
              <Route path="/student/posting-letter" element={<StudentPostingLetterPage />} />
            </Route>
          </Route>

          {/* SUPERVISOR DASHBOARD ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={["supervisor"]} />}>
            <Route element={<AppLayout />}> {/* Use AppLayout */}
              <Route path="/supervisor/dashboard" element={<SupervisorDashboardPage />} />
              <Route path="/supervisor/applications/pending" element={<SupervisorPendingApplicationsPage />} />
              <Route path="/supervisor/applications/all" element={<SupervisorPaymentVerificationPage />} />
              <Route path="/supervisor/current-trainees" element={<SupervisorCurrentTraineesPage />} />
              <Route path="/supervisor/applications/rejected" element={<SupervisorRejectedApplicationsPage />} />
              <Route path="/supervisor/users" element={<SupervisorUsersPage />} />
              <Route path="/supervisor/colleges/temp" element={<SupervisorCollegesTempPage />} />
              <Route path="/supervisor/colleges/master" element={<SupervisorCollegesMasterPage />} />
              <Route path="/supervisor/applications/master" element={<SupervisorMasterApplicationsPage />} />
            </Route>
          </Route>

          {/* ADMIN DASHBOARD ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<AppLayout />}> {/* Use AppLayout */}
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/slots" element={<AdminSlotsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/applications" element={<AdminApplicationsPage />} />
              <Route path="/admin/applications/pending" element={<AdminPendingApplicationsPage />} />
              <Route path="/admin/applications/payments" element={<AdminPaymentPage />} />
              <Route path="/admin/applications/trainees" element={<AdminTraineesPage />} />
              <Route path="/admin/applications/completed" element={<AdminCompletedApplicationsPage />} />
            </Route>
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;