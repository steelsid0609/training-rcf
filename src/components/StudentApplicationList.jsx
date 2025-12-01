// src/components/StudentApplicationList.jsx
import React, { useState } from "react";
import StudentApplicationDetailsModal from "./StudentApplicationDetailsModal"; 

export default function StudentApplicationList({ 
  applications, 
  setUploadModalApp, 
  setPaymentModalApp 
}) {
  const [viewDetailsApp, setViewDetailsApp] = useState(null);

  if (!applications || applications.length === 0) {
    return <div>No applications found.</div>;
  }
  
  // Helper to get the correct dates
  const getDates = (app) => {
      // Prioritize actual dates if available
      const start = app.actualStartDate || app.preferredStartDate || "-";
      const end = app.actualEndDate || app.preferredEndDate || "-";
      // If approved, use the final/actual dates. If pending, show preferred.
      return { start, end };
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {applications.map((app) => {
          const status = (app.status || "pending").toLowerCase();
          const payStatus = (app.paymentStatus || "pending").toLowerCase();
          
          // Check if Cover Letter exists
          const hasCoverLetter = !!app.coverLetterURL;

          // Show Payment Button if Approved AND (Payment Pending OR Rejected)
          const showPayBtn = status === "approved" && (payStatus === "pending" || payStatus === "rejected");
          
          const { start, end } = getDates(app); // Use helper

          return (
            <div key={app.id} style={cardStyle}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ margin: "0 0 5px 0", color: "#006400" }}>{app.internshipType}</h3>
                  <div style={{ fontSize: "13px", color: "#666" }}>ID: {app.id}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={statusBadge(status)}>{status.toUpperCase()}</span>
                </div>
              </div>

              {/* Summary (UPDATED TO USE ACTUAL/PREFERRED DATES) */}
              <div style={{ marginTop: 15, color: "#444", fontSize: 14, lineHeight: "1.6" }}>
                <div>
                  <strong>Dates:</strong> {start} to {end}
                  {app.actualStartDate && <span style={{color: '#006400', fontWeight: 'bold'}}> (Final)</span>}
                </div>
                <div><strong>College:</strong> {app.collegeName}</div>
                {app.paymentStatus && app.paymentStatus !== "pending" && (
                   <div style={{marginTop: 5}}>
                     <strong>Payment:</strong> {app.paymentStatus.replace("_", " ").toUpperCase()}
                   </div>
                )}
              </div>

              <hr style={{ margin: "15px 0", border: "0", borderTop: "1px solid #eee" }} />

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                
                {/* 1. View Details */}
                <button
                  onClick={() => setViewDetailsApp(app)}
                  style={viewBtn}
                >
                  👁️ View Full Details
                </button>

                {/* 2. Upload Cover Letter (BLOCKED IF EXISTS) */}
                <button
                  onClick={() => !hasCoverLetter && setUploadModalApp(app)}
                  disabled={hasCoverLetter} // Disable if already has URL
                  style={hasCoverLetter ? disabledBtn : secondaryBtn}
                >
                  {hasCoverLetter ? "Cover Letter Submitted" : "Upload Cover Letter"}
                </button>

                {/* 3. Update Payment */}
                {showPayBtn && (
                  <button
                    onClick={() => setPaymentModalApp(app)}
                    style={primaryBtn}
                  >
                    {payStatus === "rejected" ? "Re-Upload Payment" : "Update Payment"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- DETAILS MODAL --- */}
      {viewDetailsApp && (
        <StudentApplicationDetailsModal 
          app={viewDetailsApp} 
          onClose={() => setViewDetailsApp(null)} 
        />
      )}
    </>
  );
}

// --- STYLES ---
const cardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  borderLeft: "5px solid #006400",
  transition: "transform 0.2s",
};

const statusBadge = (status) => {
  let bg = "#eee"; let col = "#333";
  if (status === "approved") { bg = "#d4edda"; col = "#155724"; }
  else if (status === "rejected") { bg = "#f8d7da"; col = "#721c24"; }
  else if (status === "pending") { bg = "#fff3cd"; col = "#856404"; }
  else if (status === "completed") { bg = "#cce5ff"; col = "#004085"; }
  return {
    background: bg, color: col, padding: "4px 8px", borderRadius: "4px", fontWeight: "bold", fontSize: "11px"
  };
};

const viewBtn = {
  padding: "8px 12px", background: "#e2e6ea", color: "#333", border: "1px solid #dae0e5", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: "600"
};

const secondaryBtn = {
  padding: "8px 12px", background: "#fff", color: "#6c757d", border: "1px solid #6c757d", borderRadius: "4px", cursor: "pointer", fontSize: "13px"
};

const disabledBtn = {
  padding: "8px 12px", background: "#f2f2f2", color: "#aaa", border: "1px solid #ddd", borderRadius: "4px", cursor: "not-allowed", fontSize: "13px"
};

const primaryBtn = {
  padding: "8px 12px", background: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: "bold"
};