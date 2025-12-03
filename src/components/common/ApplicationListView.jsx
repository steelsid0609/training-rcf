// src/components/admin/ApplicationsView.jsx
import React from "react";

export default function ApplicationsView({
  applications,
  slotsMap = {}, // Default to empty object if not provided
  onApprove,
  onReject,
  working,
  styles,
}) {
  const { card, applyBtn } = styles;

  function safeFormatDate(isoString) {
    if (!isoString) return "-";
    if (isoString.toDate) return isoString.toDate().toLocaleDateString();
    const parts = isoString.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoString;
  }

  if (!applications || applications.length === 0) {
    return <div style={{padding: 20, color: "#666"}}>No applications found in this category.</div>;
  }

  return (
    <div>
      {applications.map((app) => {
        const collegeName = app.collegeName || (app.college && app.college.name) || "Unknown College";
        const startDisplay = safeFormatDate(app.preferredStartDate);
        const endDisplay = safeFormatDate(app.preferredEndDate);

        // Duration Text
        let durationText = "";
        let slotId = "";
        if (app.durationDetails) {
          const { value, type, slotId: sId } = app.durationDetails;
          durationText = `(${value} ${type})`;
          slotId = sId;
        }

        // Lookup Slot Label
        const slotLabel = slotsMap[slotId] || "Custom/Unknown Slot";

        return (
          <div key={app.id} style={{...card, borderLeft: "5px solid #006400"}}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 20
              }}
            >
              {/* --- DETAILS --- */}
              <div style={{ flex: 1, minWidth: "280px" }}>
                <div style={{ fontWeight: 700, fontSize: "18px", color: "#333" }}>
                  {app.studentName || app.email || "Applicant"}
                </div>
                <div style={{ fontSize: "14px", color: "#555", marginBottom: 8 }}>
                  {app.email} &bull; {app.phone || "No Phone"}
                </div>

                <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "10px 0" }} />

                <div style={{ marginBottom: 6, fontSize: "15px" }}>
                  <strong>📅 Slot:</strong> <span style={{color: "#0056b3", fontWeight: "bold"}}>{slotLabel}</span>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Duration:</strong> {startDisplay} {" → "} {endDisplay}{" "}
                  <span style={{fontWeight: "bold", color: "#e65100"}}>
                    {durationText}
                  </span>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Type:</strong> {app.internshipType}
                </div>
                
                <div style={{ marginBottom: 6 }}>
                  <strong>College:</strong> {collegeName}
                </div>

                {/* Recommendation Letter */}
                {app.coverLetterURL ? (
                  <div style={{ marginTop: 12 }}>
                    <a 
                      href={app.coverLetterURL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        padding: "6px 12px",
                        background: "#f0f8ff",
                        color: "#006400",
                        textDecoration: "none",
                        borderRadius: "4px",
                        fontSize: "13px",
                        fontWeight: "600",
                        border: "1px solid #b3d7ff"
                      }}
                    >
                      📄 View Recommendation Letter
                    </a>
                  </div>
                ) : (
                  <div style={{ marginTop: 10, color: "#dc3545", fontSize: "13px" }}>
                    ⚠️ No Recommendation Letter
                  </div>
                )}

                <div style={{ marginTop: 10, fontSize: 12, color: "#999" }}>
                  Submitted:{" "}
                  {app.createdAt?.toDate
                    ? app.createdAt.toDate().toLocaleString()
                    : "Just now"}
                </div>
              </div>

              {/* --- ACTIONS --- */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  minWidth: "150px",
                  alignItems: "flex-end"
                }}
              >
                <div style={{ fontSize: 13, marginBottom: 5 }}>
                  Status:{" "}
                  <span
                    style={{
                      fontWeight: 700,
                      color: app.status === "pending" ? "#ff9800" : "#28a745",
                      textTransform: "uppercase"
                    }}
                  >
                    {app.status || "Pending"}
                  </span>
                </div>

                {onApprove && (
                  <button
                    onClick={() => onApprove(app)}
                    style={{...applyBtn, width: "100%", textAlign: "center"}}
                    disabled={working}
                  >
                    Approve
                  </button>
                )}
                {onReject && (
                  <button
                    onClick={() => onReject(app)}
                    style={{
                      ...applyBtn,
                      background: "#dc3545",
                      width: "100%",
                      textAlign: "center"
                    }}
                    disabled={working}
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}