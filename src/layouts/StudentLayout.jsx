// src/layouts/StudentLayout.jsx
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const sidebarStyle = {
  width: 260,
  background: "#003366",
  color: "#fff",
  padding: "16px 12px",
  display: "flex",
  flexDirection: "column",
};

const navItemBase = {
  display: "block",
  padding: "8px 10px",
  borderRadius: 6,
  textDecoration: "none",
  fontSize: 14,
  color: "#fff",
  marginBottom: 4,
};

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...navItemBase,
        background: isActive ? "rgba(255,255,255,0.18)" : "transparent",
      })}
    >
      {label}
    </NavLink>
  );
}

export default function StudentLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",   // full viewport height
        width: "100vw",
        overflow: "hidden", // no window scroll; we'll scroll only right pane
        background: "#f5f5f5",
      }}
    >
      {/* LEFT SIDEBAR */}
      <aside
        style={{
          ...sidebarStyle,
          height: "100%", // fills the left side
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Student Panel</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            {user?.email || "Logged in"}
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <NavItem to="/student/dashboard" label="Dashboard" />
          <NavItem to="/student/basic-details" label="Edit Basic Details" />
          <NavItem to="/student/change-password" label="Change Password" />
          <NavItem to="/student/cover-letter" label="Upload Cover Letter" />
          <NavItem to="/student/applications" label="My Applications" />
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            marginTop: 16,
            padding: "8px 12px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            background: "#c62828",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          Logout
        </button>
      </aside>

      {/* RIGHT CONTENT (scrollable) */}
      <main
        style={{
          flex: 1,
          padding: 24,
          height: "100%",
          overflowY: "auto",   // ✅ vertical scroll inside the right pane
          overflowX: "hidden", // prevent horizontal scroll bar here
          boxSizing: "border-box",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
  