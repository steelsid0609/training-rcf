// src/components/StudentApplicationList.jsx

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 10,
};

const cellStyle = {
  padding: "10px",
  borderBottom: "1px solid #ddd",
  textAlign: "left",
  verticalAlign: "top",
};

export default function StudentApplicationList({
  applications = [],
  setUploadModalApp,
}) {
  if (!applications || applications.length === 0) {
    return <div style={{ marginTop: 20 }}>No previous applications to show.</div>;
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h4>Past Applications 📜</h4>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={cellStyle}>Type</th>
            <th style={cellStyle}>Status</th>
            <th style={cellStyle}>Letter</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((a) => {
            const status = a.status || "";
            const statusLower = status.toLowerCase();

            const bgColor =
              statusLower === "approved" || statusLower === "accepted"
                ? "rgba(40, 167, 69, 0.15)"
                : statusLower === "rejected"
                ? "rgba(220, 53, 69, 0.15)"
                : "rgba(255, 193, 7, 0.15)";

            const color =
              statusLower === "approved" || statusLower === "accepted"
                ? "#28a745"
                : statusLower === "rejected"
                ? "#dc3545"
                : "#ff9800";

            return (
              <tr key={a.id}>
                <td style={cellStyle}>{a.internshipType || "N/A"}</td>
                <td style={cellStyle}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      backgroundColor: bgColor,
                      color,
                      fontWeight: 700,
                      textTransform: "capitalize",
                    }}
                  >
                    {status || "—"}
                  </span>
                </td>
                <td style={cellStyle}>
                  {a.coverLetterURL ? (
                    // --- SHOW VIEW BUTTON ---
                    <a
                      href={a.coverLetterURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#006400", fontWeight: "bold" }}
                    >
                      View
                    </a>
                  ) : a.coverLetterRequested ? (
                    // --- SHOW UPLOAD BUTTON ---
                    <button
                      onClick={() => setUploadModalApp(a)}
                      style={{
                        padding: "4px 8px",
                        background: "#ffc107",
                        color: "#333",
                        border: "none",
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      Upload
                    </button>
                  ) : (
                    "N/A"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
