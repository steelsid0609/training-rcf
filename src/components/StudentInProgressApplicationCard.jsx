// src/components/StudentInProgressApplicationCard.jsx

export default function StudentInProgressApplicationCard({
  app,
  user, // not used right now but kept for future features
  reloadApplications, // also kept for future use
  setUploadModalApp,
}) {
  if (!app) return null;

  return (
    <div style={{ padding: 20, background: "#fff", borderRadius: 8 }}>
      <h3>Application In Progress ⏳</h3>
      <div>Application Type: {app.internshipType || app.id}</div>
      <div>Status: {app.status}</div>

      <p>
        College Recommendation Letter Status:{" "}
        {app.coverLetterURL ? "Uploaded" : "Not Uploaded"}
      </p>

      <div style={{ marginTop: 10 }}>
        {app.coverLetterURL ? (
          // --- SHOW VIEW BUTTON ---
          <a
            href={app.coverLetterURL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 12px",
              background: "#006400",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              textDecoration: "none",
            }}
          >
            🖼️ View Letter
          </a>
        ) : (
          // --- SHOW UPLOAD BUTTON ---
          <button
            onClick={() => setUploadModalApp(app)}
            style={{
              padding: "8px 12px",
              background: "#0d6efd",
              color: "#fff",
              border: "none",
              borderRadius: 6,
            }}
          >
            Upload Letter
          </button>
        )}
      </div>
    </div>
  );
}
