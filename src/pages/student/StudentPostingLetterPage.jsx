import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

export default function StudentPostingLetterPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadApplications(user.uid);
    }
  }, [user]);

  async function loadApplications(uid) {
    setLoading(true);
    try {
      const q = query(
        collection(db, "applications"),
        where("createdBy", "==", uid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Sort by newest
      list.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });

      setApplications(list);
    } catch (err) {
      console.error("Error loading applications:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 10 }}>My Posting Letters</h2>
      <p style={{ color: "#666", marginBottom: 30 }}>
        Once your internship is confirmed and processed, your Posting Letter will appear here.
      </p>

      {applications.length === 0 ? (
        <p>No applications found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {applications.map((app) => (
            <div key={app.id} style={cardStyle}>
              {/* Application Header */}
              <div style={{ borderBottom: "1px solid #eee", paddingBottom: 10, marginBottom: 10 }}>
                <h3 style={{ margin: 0, color: "#003366" }}>{app.internshipType}</h3>
                <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
                  {app.collegeName}
                </div>
              </div>

              {/* Status & Dates */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#444", marginBottom: 15 }}>
                <div>
                  <strong>Status: </strong> 
                  <span style={getStatusStyle(app.status)}>{app.status?.toUpperCase() || "PENDING"}</span>
                </div>
                <div>
                  {app.preferredStartDate} to {app.preferredEndDate}
                </div>
              </div>

              {/* Posting Letter Section */}
              <div style={{ background: "#f9f9f9", padding: 15, borderRadius: 6, border: "1px dashed #ccc" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: 14 }}>Posting Letter Status</h4>
                
                {app.postingLetterURL ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                    <span style={{ color: "green", fontWeight: "bold", fontSize: 13 }}>
                      ✅ Generated
                    </span>
                    <a 
                      href={app.postingLetterURL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={downloadBtn}
                    >
                      📥 Download / View Posting Letter
                    </a>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "#777", fontStyle: "italic" }}>
                    {app.status === "completed" || app.status === "approved" 
                      ? "Processing... Please wait for admin to upload." 
                      : "Not available yet (Application pending or rejected)."}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Styles ---
const cardStyle = {
  background: "#fff",
  padding: 20,
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  borderLeft: "5px solid #003366"
};

const downloadBtn = {
  display: "inline-block",
  padding: "8px 16px",
  background: "#006400",
  color: "#fff",
  textDecoration: "none",
  borderRadius: 4,
  fontSize: 13,
  fontWeight: "bold",
  cursor: "pointer"
};

function getStatusStyle(status) {
  const base = { fontWeight: "bold", padding: "2px 6px", borderRadius: 4, fontSize: 12 };
  if (status === "approved") return { ...base, background: "#d4edda", color: "#155724" };
  if (status === "rejected") return { ...base, background: "#f8d7da", color: "#721c24" };
  return { ...base, background: "#fff3cd", color: "#856404" };
}