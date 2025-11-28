import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { signOut } from "firebase/auth";
import { auth } from "../firebase.js";
import "../../src/App.css";
import bgImage from "../assets/left-bg.jpg"; 

const sidebarStyle = {
  width: 270,
  backgroundImage: `url(${bgImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  color: "#fff",
  padding: "25px 15px",
  display: "flex",
  flexDirection: "column",
  boxShadow: "4px 0 15px rgba(0,0,0,0.2)",
  borderRight: "none",
  height: "100vh",
  position: "sticky",
  top: 0
};

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
        background: isActive ? "rgba(255, 255, 255, 0.2)" : "transparent",
        color: "#fff",
        borderLeft: isActive ? "4px solid #fff" : "4px solid transparent",
        transition: "all 0.2s ease"
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
    try { await signOut(auth); navigate("/"); } catch (err) { console.error(err); }
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      <aside style={sidebarStyle}>
         <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.35)", zIndex: 0 }}></div>
         
         <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ marginBottom: 30, textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 20 }}>
            <div style={{ fontSize: 22, fontWeight: "800", color: "#fff" }}>SUPERVISOR</div>
            </div>

            <nav style={{ flex: 1, overflowY: "auto" }}>
            <NavItem to="/supervisor/dashboard" label="Dashboard" />
            
            <div style={{ margin: "15px 0 5px 15px", fontSize: "11px", color: "#ddd", textTransform: "uppercase" }}>Workflow</div>
            <NavItem to="/supervisor/applications/pending" label="Pending Reviews" />
            <NavItem to="/supervisor/applications/all" label="Payment Verification" />
            <NavItem to="/supervisor/current-trainees" label="Current Trainees" />
            <NavItem to="/supervisor/applications/rejected" label="Rejected Archive" />
            
            <div style={{ margin: "15px 0 5px 15px", fontSize: "11px", color: "#ddd", textTransform: "uppercase" }}>Reports</div>
            <NavItem to="/supervisor/applications/master" label="All Applications" />

            <div style={{ margin: "15px 0 5px 15px", fontSize: "11px", color: "#ddd", textTransform: "uppercase" }}>Management</div>
            <NavItem to="/supervisor/users" label="Student Users" />
            <NavItem to="/supervisor/colleges/temp" label="College Requests" />
            <NavItem to="/supervisor/colleges/master" label="College Master List" />
            </nav>

            <div style={{ marginTop: "auto" }}>
            <button onClick={handleLogout} className="btn-sidebar">
                Sign Out
            </button>
            </div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "30px", overflowY: "auto", background: "#ffffff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}