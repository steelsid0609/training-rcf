// src/layouts/StudentLayout.jsx
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "../../src/App.css"; 
// Import the background image to use in inline style
import bgImage from "../assets/left-bg.jpg"; 

const sidebarStyle = {
  width: 270,
  // Use background image here
  backgroundImage: `url(${bgImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundColor: "#2c3e50", // Fallback color
  color: "#fff", // White text for contrast on image
  textShadow: "0 1px 3px rgba(0,0,0,0.8)", // Added text shadow for readability
  padding: "25px 15px",
  display: "flex",
  flexDirection: "column",
  boxShadow: "4px 0 15px rgba(0,0,0,0.2)",
  borderRight: "none",
  height: "100vh", 
  position: "sticky", 
  top: 0
};

// Styling for Nav Links (White text on Image background)
function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: "block",
        padding: "12px 15px",
        borderRadius: "8px",
        textDecoration: "none",
        fontSize: "15px",
        marginBottom: "6px",
        fontWeight: isActive ? "700" : "500",
        // Active: Semi-transparent white bg. Inactive: Transparent
        background: isActive ? "rgba(255, 255, 255, 0.2)" : "transparent", 
        color: "#fff",
        textShadow: "0 1px 2px rgba(0,0,0,0.8)", // Text shadow for links
        boxShadow: isActive ? "0 4px 6px rgba(0,0,0,0.1)" : "none",
        backdropFilter: isActive ? "blur(5px)" : "none",
        borderLeft: isActive ? "4px solid #fff" : "4px solid transparent",
        transition: "all 0.2s ease"
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
    try { await signOut(auth); navigate("/"); } catch (err) { console.error(err); }
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      <aside style={sidebarStyle}>
        {/* Dark Overlay to ensure text readability */}
        <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0, 0, 0, 0.26)", // Darker tint overlay
            zIndex: 0
        }}></div>

        {/* Content wrapper with z-index to sit above overlay */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
            
            {/* Header */}
            <div style={{ marginBottom: 30, textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 20 }}>
            <div style={{ fontSize: 24, fontWeight: "800", letterSpacing: "1px", color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,0.6)" }}>STUDENT</div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, overflowY: "auto" }}>
            <NavItem to="/student/dashboard" label="Dashboard" />
            <NavItem to="/student/applications" label="My Applications" />
            <NavItem to="/student/posting-letter" label="Posting Letter" />
            <NavItem to="/student/cover-letter" label="Documents" />
            <div style={{ margin: "15px 0", borderTop: "1px solid rgba(255,255,255,0.3)" }}></div>
            <NavItem to="/student/basic-details" label="Profile" />
            <NavItem to="/student/change-password" label="Change Password" />
            </nav>

            {/* Footer & Sign Out */}
            <div>
            <div style={{ fontSize: 12, textAlign: "center", marginBottom: 10, color: "#ddd" }}>
                {user?.email}
            </div>
            <button onClick={handleLogout} className="btn-sidebar">
                <span>⏻</span> Sign Out
            </button>
            </div>
        </div>
      </aside>

      {/* Main Content Area - Solid White Background */}
      <main style={{ flex: 1, padding: "30px", overflowY: "auto", background: "#ffffff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}