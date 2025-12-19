import React from "react";

export default function ApplicationsView({
  applications,
  slotsMap = {},
  onApprove,
  onReject,
  onSlotClick, // New prop for interactive filtering
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
    return <div style={{ padding: 20, color: "#666" }}>No applications found in this category.</div>;
  }

  return (
    <div>
      {applications.map((app) => {
        const collegeName = app.collegeName || (app.college && app.college.name) || "Unknown College";
        const startDisplay = safeFormatDate(app.preferredStartDate);
        const endDisplay = safeFormatDate(app.preferredEndDate);

        // --- Logic to extract Slot ID safely ---
        const slotId = app.durationDetails?.slotId || app.slotId || "";
        const slotLabel = slotsMap[slotId] || "Custom/Manual Slot";

        let durationText = "";
        if (app.durationDetails) {
          const { value, type } = app.durationDetails;
          durationText = `(${value} ${type})`;
        }

        return (
          <div key={app.id} style={{ ...card, borderLeft: "5px solid #006400" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 20
              }}
            >
              {/* --- STUDENT DETAILS --- */}
              <div style={{ flex: 1, minWidth: "280px" }}>
                <div style={{ fontWeight: 700, fontSize: "19px", color: "#004d40" }}>
                  {app.fullname || app.studentName || "Applicant Name Missing"}
                </div>
                <div style={{ fontSize: "14px", color: "#555", marginBottom: 8 }}>
                  📧 {app.email} &bull; 📱 {app.phone || app.mobile || "No Contact"}
                </div>

                <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "10px 0" }} />

                {/* --- CLICKABLE SLOT NAME --- */}
                <div style={{ marginBottom: 8, fontSize: "15px" }}>
                  <strong>📅 Selected Slot:</strong>{" "}
                  <span 
                    onClick={() => onSlotClick && onSlotClick(slotId)}
                    style={{
                      color: "#0056b3", 
                      fontWeight: "bold", 
                      cursor: onSlotClick ? "pointer" : "default",
                      textDecoration: onSlotClick ? "underline" : "none",
                      background: "#f0f7ff",
                      padding: "2px 6px",
                      borderRadius: "4px"
                    }}
                    title={onSlotClick ? "Click to filter all students in this slot" : ""}
                  >
                    {slotLabel}
                  </span>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>🎓 Discipline:</strong> {app.discipline || "Not Specified"}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>⏱ Duration:</strong> {startDisplay} {" → "} {endDisplay}{" "}
                  <span style={{ fontWeight: "bold", color: "#e65100" }}>
                    {durationText}
                  </span>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>🏢 College:</strong> {collegeName}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>📝 Internship Type:</strong> {app.internshipType}
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
                        background: "#f0fdf4",
                        color: "#166534",
                        textDecoration: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        border: "1px solid #bbf7d0"
                      }}
                    >
                      📄 View Recommendation Letter
                    </a>
                  </div>
                ) : (
                  <div style={{ marginTop: 10, color: "#dc3545", fontSize: "13px", fontWeight: "bold" }}>
                    ⚠️ No Recommendation Letter Provided
                  </div>
                )}

                <div style={{ marginTop: 12, fontSize: 11, color: "#999", fontStyle: "italic" }}>
                  Applied on: {app.createdAt?.toDate ? app.createdAt.toDate().toLocaleString() : "Recently"}
                </div>
              </div>

              {/* --- ACTION BUTTONS --- */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  minWidth: "160px",
                  alignItems: "flex-end"
                }}
              >
                <div style={{ fontSize: 13, marginBottom: 5 }}>
                  STATUS:{" "}
                  <span
                    style={{
                      fontWeight: 800,
                      color: app.status === "pending" ? "#f57c00" : "#2e7d32",
                      padding: "4px 8px",
                      background: app.status === "pending" ? "#fff3e0" : "#e8f5e9",
                      borderRadius: "4px"
                    }}
                  >
                    {app.status?.toUpperCase() || "PENDING"}
                  </span>
                </div>

                {onApprove && (
                  <button
                    onClick={() => onApprove(app)}
                    style={{ ...applyBtn, width: "100%", textAlign: "center", background: "#2e7d32" }}
                    disabled={working}
                  >
                    Approve & Finalize
                  </button>
                )}
                {onReject && (
                  <button
                    onClick={() => onReject(app)}
                    style={{
                      ...applyBtn,
                      background: "#c62828",
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