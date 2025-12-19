// src/components/common/ApplicationDataModal.jsx
import React from "react";
import { formatDateDisplay } from "../../utils/helpers";

export default function ApplicationDataModal({ app, onClose }) {
  if (!app) return null;

  /**
   * Helper to determine if a field is an "Actual" date or "Payment" date
   * to apply specific highlight styling.
   */
  const getFieldStyle = (key) => {
    const highlightKeys = ["actualStartDate", "actualEndDate", "paymentDate"];
    if (highlightKeys.includes(key)) {
      return { 
        ...styles.fieldRow, 
        background: "#fff9c4", // Light yellow highlight
        borderLeft: "4px solid #fbc02d" 
      };
    }
    return styles.fieldRow;
  };

  const renderSection = (title, data) => (
    <div style={styles.section}>
      <h4 style={styles.sectionTitle}>{title}</h4>
      <div style={styles.grid}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} style={getFieldStyle(key)}>
            <div style={styles.label}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</div>
            <div style={{
                ...styles.value,
                color: ["actualStartDate", "actualEndDate", "paymentDate"].includes(key) ? "#d32f2f" : "#333"
            }}>
              {/* Handle Firebase Timestamps, URLs, and standard strings */}
              {value?.toDate ? formatDateDisplay(value) : 
               (typeof value === "string" && value.startsWith("http") ? 
                <a href={value} target="_blank" rel="noreferrer" style={styles.link}>View Document ↗</a> : 
                String(value || "N/A"))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.headerInfo}>
            <h3 style={{ margin: 0 }}>Application Data Viewer</h3>
            <span style={styles.subHeader}>{app.studentName || app.email} &bull; ID: {app.id}</span>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>&times;</button>
        </div>

        <div style={styles.content}>
          {renderSection("Personal & Professional", {
            studentName: app.studentName,
            email: app.email,
            phone: app.phone || app.mobile,
            college: app.collegeName,
            discipline: app.discipline,
            internshipType: app.internshipType,
            status: app.status?.toUpperCase()
          })}

          {renderSection("Internship Schedule", {
            preferredStartDate: app.preferredStartDate,
            preferredEndDate: app.preferredEndDate,
            actualStartDate: app.actualStartDate, // Highlighted field
            actualEndDate: app.actualEndDate,     // Highlighted field
            duration: app.durationDetails ? `${app.durationDetails.value} ${app.durationDetails.type}` : "N/A"
          })}

          {renderSection("Financials & Submission", {
            paymentDate: app.paymentDate,         // Highlighted field
            paymentRef: app.paymentRef || "N/A",
            appliedOn: app.createdAt,
            approvedBy: app.approvedByEmail || app.approvedBy || "N/A",
            rejectionReason: app.rejectionReason || "N/A"
          })}

          {app.coverLetterURL && renderSection("Documents", {
             recommendationLetter: app.coverLetterURL
          })}
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.btn}>Close Viewer</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1200, display: "flex", justifyContent: "center", alignItems: "center" },
  modal: { background: "#fff", width: "95%", maxWidth: "850px", maxHeight: "92vh", borderRadius: "12px", display: "flex", flexDirection: "column", boxShadow: "0 10px 40px rgba(0,0,0,0.4)", overflow: "hidden" },
  header: { padding: "15px 25px", borderBottom: "1px solid #ddd", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8f9fa" },
  headerInfo: { display: "flex", flexDirection: "column" },
  subHeader: { fontSize: "12px", color: "#666", marginTop: "2px" },
  content: { padding: "20px 25px", overflowY: "auto", flex: 1, background: "#fff" },
  section: { marginBottom: "30px" },
  sectionTitle: { fontSize: "15px", color: "#006400", borderBottom: "2px solid #e8f5e9", paddingBottom: "6px", marginBottom: "15px", fontWeight: "800", letterSpacing: "0.5px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "12px" },
  fieldRow: { padding: "10px 12px", background: "#fcfcfc", borderRadius: "8px", border: "1px solid #eee", display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "10px", color: "#888", fontWeight: "800", textTransform: "uppercase" },
  value: { fontSize: "14px", color: "#333", fontWeight: "600", wordBreak: "break-all" },
  link: { color: "#007bff", textDecoration: "none", fontWeight: "bold" },
  footer: { padding: "15px 25px", borderTop: "1px solid #ddd", textAlign: "right", background: "#f8f9fa" },
  btn: { padding: "10px 24px", background: "#212121", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  closeBtn: { background: "transparent", border: "none", fontSize: "28px", cursor: "pointer", color: "#999", lineHeight: "1" }
};