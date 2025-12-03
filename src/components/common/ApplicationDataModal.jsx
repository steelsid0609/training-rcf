// src/components/admin/AdminApplicationDetailsModal.jsx
import React from "react";

export default function AdminApplicationDetailsModal({ app, onClose }) {
  if (!app) return null;

  // Helper to format values for display
  const renderValue = (key, val) => {
    if (val === null || val === undefined) return <span style={{ color: "#999" }}>N/A</span>;
    
    // Handle Timestamps
    if (val?.toDate && typeof val.toDate === "function") {
      return val.toDate().toLocaleString();
    }
    
    // Handle Dates (strings)
    if (key.toLowerCase().includes("date") && typeof val === "string") {
      return val;
    }

    // Handle Objects (like college info or duration details)
    if (typeof val === "object") {
      return (
        <div style={{ paddingLeft: 10, borderLeft: "2px solid #eee" }}>
          {Object.entries(val).map(([k, v]) => (
            <div key={k} style={{ fontSize: 13, marginBottom: 4 }}>
              <strong>{k}:</strong> {renderValue(k, v)}
            </div>
          ))}
        </div>
      );
    }

    // Handle Booleans
    if (typeof val === "boolean") return val ? "Yes" : "No";

    // Handle Links (URLs)
    if (typeof val === "string" && val.startsWith("http")) {
      return <a href={val} target="_blank" rel="noreferrer" style={{color:"#007bff"}}>Open Link ↗</a>;
    }

    return String(val);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Application Data Viewer</h3>
          <button onClick={onClose} style={styles.closeBtn}>&times;</button>
        </div>

        <div style={styles.content}>
          <div style={styles.infoBox}>
            Viewing raw data for Application ID: <strong>{app.id}</strong>
          </div>

          <div style={styles.grid}>
            {Object.entries(app).map(([key, value]) => (
              <div key={key} style={styles.fieldRow}>
                <div style={styles.label}>{key}</div>
                <div style={styles.value}>{renderValue(key, value)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.btn}>Close</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.6)", zIndex: 1200,
    display: "flex", justifyContent: "center", alignItems: "center"
  },
  modal: {
    background: "#fff", width: "90%", maxWidth: "800px", maxHeight: "90vh",
    borderRadius: "10px", display: "flex", flexDirection: "column",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
  },
  header: {
    padding: "15px 20px", borderBottom: "1px solid #ddd",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "#f8f9fa", borderRadius: "10px 10px 0 0"
  },
  content: {
    padding: "20px", overflowY: "auto", flex: 1
  },
  infoBox: {
    background: "#e3f2fd", color: "#0d47a1", padding: "10px",
    borderRadius: "6px", marginBottom: "20px", fontSize: "14px"
  },
  grid: {
    display: "flex", flexDirection: "column", gap: "10px"
  },
  fieldRow: {
    display: "grid", gridTemplateColumns: "200px 1fr", gap: "15px",
    borderBottom: "1px solid #f0f0f0", paddingBottom: "8px"
  },
  label: {
    fontWeight: "bold", color: "#555", fontSize: "14px", wordBreak: "break-word"
  },
  value: {
    color: "#333", fontSize: "14px", wordBreak: "break-word"
  },
  footer: {
    padding: "15px 20px", borderTop: "1px solid #ddd", textAlign: "right"
  },
  btn: {
    padding: "8px 20px", background: "#333", color: "#fff", border: "none",
    borderRadius: "6px", cursor: "pointer"
  },
  closeBtn: {
    background: "transparent", border: "none", fontSize: "24px", cursor: "pointer"
  }
};