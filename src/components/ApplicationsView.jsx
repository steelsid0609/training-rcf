import React from "react";

export default function ApplicationsView({
  applications,
  onApprove,
  onReject,
  working,
  formatDate,
  styles,
}) {
  const { card, applyBtn } = styles;

  if (!applications || applications.length === 0) {
    return <div>No pending applications</div>;
  }

  return (
    <div>
      {applications.map((app) => {
        const internshipType =
          app.internshipType ||
          app.internType ||
          app.type ||
          app.internship ||
          "—";

        const startRaw =
          app.startDate ||
          app.fromDate ||
          app.from ||
          app.internshipStart ||
          app.start;

        const endRaw =
          app.endDate ||
          app.toDate ||
          app.to ||
          app.internshipEnd ||
          app.end;

        const collegeName =
          (app.college && (app.college.name || app.collegeName)) ||
          app.collegeName ||
          app.college_name ||
          "-";

        const confirmation =
          app.confirmationNumber ||
          app.confirmationNo ||
          app.confirmation ||
          app.confirmation_id ||
          app.confirmNo ||
          "";

        return (
          <div key={app.id} style={card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>
                  {app.studentName || app.email || "Applicant"}
                </div>

                <div style={{ marginTop: 6 }}>
                  <strong>Application:</strong> {internshipType}
                </div>
                <div style={{ marginTop: 6 }}>
                  <strong>Duration:</strong>{" "}
                  {startRaw ? formatDate(startRaw) : "-"} {" → "}{" "}
                  {endRaw ? formatDate(endRaw) : "-"}
                </div>
                <div style={{ marginTop: 6 }}>
                  <strong>College:</strong> {collegeName}
                </div>
                {confirmation ? (
                  <div style={{ marginTop: 6 }}>
                    <strong>Confirmation No.:</strong> {confirmation}
                  </div>
                ) : null}

                <div
                  style={{ marginTop: 6, fontSize: 12, color: "#666" }}
                >
                  Submitted:{" "}
                  {app.createdAt?.toDate
                    ? app.createdAt.toDate().toLocaleString()
                    : app.createdAt || "-"}
                </div>
              </div>

              <div
                style={{
                  minWidth: 220,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 13 }}>
                  Status:{" "}
                  <span
                    style={{ fontWeight: 700, color: "#ff9800" }}
                  >
                    {app.status || "Pending"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {onApprove && (
                    <button
                      onClick={() => onApprove(app)}
                      style={applyBtn}
                      disabled={working}
                    >
                      Approve
                    </button>
                  )}
                  {onReject && (
                    <button
                      onClick={() => onReject(app)}
                      style={{ ...applyBtn, background: "#6c757d" }}
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
