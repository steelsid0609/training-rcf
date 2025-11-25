import React from "react";

export default function CurrentTraineesView({
  currentTrainees,
  onFinish, // (app, status)
  working,
  styles,
}) {
  const { card, applyBtn } = styles;

  if (!currentTrainees || currentTrainees.length === 0) {
    return <div>No current trainees found.</div>;
  }

  return (
    <div>
      {currentTrainees.map((app) => (
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
                {app.studentName || app.email}
              </div>
              <div style={{ marginTop: 6 }}>
                {app.college?.name || app.collegeName || "-"}
              </div>
              <div
                style={{ marginTop: 6, fontSize: 12, color: "#666" }}
              >
                Approved:{" "}
                {app.approvedAt?.toDate
                  ? app.approvedAt.toDate().toLocaleString()
                  : "-"}
              </div>
            </div>

            {onFinish && (
              <div
                style={{
                  minWidth: 220,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => onFinish(app, "completed")}
                    style={{ ...applyBtn, background: "#28a745" }}
                    disabled={working}
                  >
                    Mark Completed
                  </button>
                  <button
                    onClick={() => onFinish(app, "terminated")}
                    style={{ ...applyBtn, background: "#dc3545" }}
                    disabled={working}
                  >
                    Terminate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
