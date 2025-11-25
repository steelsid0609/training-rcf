// src/layouts/SupervisorLayout.jsx
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const sidebarStyle = {
  width: 260,
  background: "#263238",
  color: "#fff",
  padding: "16px 12px",
  display: "flex",
  flexDirection: "column",
  position: "sticky",
  top: 0,
  alignSelf: "flex-start",
  minHeight: "100vh",
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
        background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
      })}
    >
      {label}
    </NavLink>
  );
}

export default function SupervisorLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);      // 🔥 Firebase logout
      navigate("/login");
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      <aside style={sidebarStyle}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Supervisor Panel</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            {user?.email || "Logged in"}
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <NavItem to="/supervisor/dashboard" label="Dashboard" />
          <NavItem
            to="/supervisor/applications/pending"
            label="Pending Applications"
          />
          <NavItem
            to="/supervisor/applications/all"
            label="All Applications"
          />
          <NavItem
            to="/supervisor/applications/completed"
            label="Completed Applications"
          />
          <NavItem
            to="/supervisor/applications/rejected"
            label="Rejected Applications"
          />
          <NavItem to="/supervisor/users" label="Users / Students" />
          <NavItem to="/supervisor/colleges/temp" label="College Temp View" />
          <NavItem
            to="/supervisor/colleges/master"
            label="College Master View"
          />
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

      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
