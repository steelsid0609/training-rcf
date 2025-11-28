import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase.js"; // Added .js extension
import { useAuth } from "../../context/AuthContext.jsx"; // Added .jsx extension

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

  // Format Helper
  const formatDate = (val) => {
    if (!val) return "";
    if (val.toDate) return val.toDate().toLocaleDateString();
    return val;
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 10 }}>My Posting Letters</h2>
      <p style={{ color: "#666", marginBottom: 30 }}>
        Access your departmental posting letters issued by the supervisor.
      </p>

      {applications.length === 0 ? (
        <p>No applications found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {applications.map((app) => {
            // Check if any letters exist (new array OR old single field)
            const hasLetters = (app.postingLetters && app.postingLetters.length > 0) || app.postingLetterURL;

            return (
              <div key={app.id} style={cardStyle}>
                {/* Application Header */}
                <div style={{ borderBottom: "1px solid #eee", paddingBottom: 10, marginBottom: 10 }}>
                  <h3 style={{ margin: 0, color: "#003366" }}>{app.internshipType}</h3>
                  <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
                    {app.collegeName}
                  </div>
                </div>

                {/* Status */}
                <div style={{ marginBottom: 15 }}>
                  <span style={getStatusStyle(app.status)}>{app.status?.toUpperCase() || "PENDING"}</span>
                </div>

                {/* Posting Letter Section */}
                <div style={{ background: "#f9f9f9", padding: 15, borderRadius: 6, border: "1px dashed #ccc" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: 14, color: "#333" }}>Posting Letters</h4>
                  
                  {hasLetters ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      
                      {/* NEW: Array of Letters */}
                      {app.postingLetters?.map((letter, idx) => (
                        <div key={idx} style={letterRow}>
                          <div style={{display:'flex', alignItems:'center', gap: '10px'}}>
                            <span style={{fontSize: '18px'}}>📄</span>
                            <div>
                              <div style={{fontWeight: 'bold', fontSize: '14px', color: '#006400'}}>
                                {letter.period}
                              </div>
                              <div style={{fontSize: '12px', color: '#666'}}>
                                {letter.plant || "Plant Assigned"} • Issued: {formatDate(letter.issuedAt)}
                              </div>
                            </div>
                          </div>
                          <a 
                            href={letter.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={downloadBtn}
                          >
                            Download
                          </a>
                        </div>
                      ))}

                      {/* OLD: Single Letter Fallback */}
                      {(!app.postingLetters || app.postingLetters.length === 0) && app.postingLetterURL && (
                        <div style={letterRow}>
                          <div style={{fontWeight: 'bold', fontSize: '14px', color: '#006400'}}>Original Posting Letter</div>
                          <a 
                            href={app.postingLetterURL} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={downloadBtn}
                          >
                            Download
                          </a>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#777", fontStyle: "italic" }}>
                      {app.status === "completed" || app.status === "in_progress" || app.status === "pending_confirmation"
                        ? "No letters issued yet. Please check back later." 
                        : "Not available yet (Application pending/rejected)."}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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

const letterRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#fff",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #eee",
  boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
};

const downloadBtn = {
  display: "inline-block",
  padding: "6px 12px",
  background: "#fff",
  color: "#006400",
  border: "1px solid #006400",
  textDecoration: "none",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: "bold",
  cursor: "pointer",
  transition: "0.2s"
};

function getStatusStyle(status) {
  const base = { fontWeight: "bold", padding: "4px 8px", borderRadius: 4, fontSize: 11, display: "inline-block" };
  if (status === "approved" || status === "in_progress" || status === "pending_confirmation") return { ...base, background: "#d4edda", color: "#155724" };
  if (status === "completed") return { ...base, background: "#cce5ff", color: "#004085" };
  if (status === "rejected") return { ...base, background: "#f8d7da", color: "#721c24" };
  return { ...base, background: "#fff3cd", color: "#856404" };
}