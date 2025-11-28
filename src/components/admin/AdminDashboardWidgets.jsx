// src/components/admin/AdminDashboardWidgets.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboardWidgets() {
  const navigate = useNavigate();

  return (
    <div style={styles.grid}>
      {/* Card 1: Manage Training Slots */}
      <div
        onClick={() => navigate("/admin/slots")}
        style={{ ...styles.card, borderLeft: "5px solid #007bff", cursor: "pointer" }}
      >
        <div style={styles.title}>Training Slots</div>
        <div style={styles.count}>📅</div> {/* Icon as placeholder for count */}
        <div style={styles.sub}>
          Create, edit, or delete available internship time slots.
        </div>
      </div>

      {/* You can add more admin widgets here (e.g. User Management) */}
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    transition: "0.2s",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  title: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#444",
    marginBottom: "10px",
  },
  count: {
    fontSize: "36px",
    fontWeight: "bold",
    color: "#111",
    marginBottom: "5px",
  },
  sub: {
    fontSize: "13px",
    color: "#888",
    marginTop: "5px",
  },
};