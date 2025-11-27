// src/pages/admin/AdminDashboardPage.jsx
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom"; // Import useNavigate

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate(); // Hook

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ color: "#333" }}>Admin Dashboard</h1>
      
      {/* ... stats section ... */}

      {/* --- MANAGEMENT LINKS --- */}
      <div style={{ margin: "30px 0", display: "flex", gap: "15px" }}>
        <button 
          onClick={() => navigate("/admin/slots")} 
          style={{
            padding: "15px 25px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Manage Training Slots 📅
        </button>
      </div>

      {/* --- SYSTEM MANAGEMENT SECTION --- */}
      <div style={{ marginTop: "30px", borderTop: "1px solid #ddd", paddingTop: "20px" }}>
         {/* ... SeedSlots ... */}
      </div>
    </div>
  );
}