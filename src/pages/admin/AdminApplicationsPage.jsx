// src/pages/admin/AdminApplicationsPage.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-toastify";
import AdminApplicationDetailsModal from "../../components/admin/AdminApplicationDetailsModal";

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    loadApps();
  }, []);

  async function loadApps() {
    setLoading(true);
    try {
      const q = query(collection(db, "applications"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setApps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  // Filter Logic
  const filteredApps = apps.filter(app => {
    const term = searchTerm.toLowerCase();
    const name = (app.studentName || "").toLowerCase();
    const email = (app.email || "").toLowerCase();
    const type = (app.internshipType || "").toLowerCase();
    const id = app.id.toLowerCase();
    
    return name.includes(term) || email.includes(term) || type.includes(term) || id.includes(term);
  });

  if (loading) return <div style={{ padding: 30 }}>Loading applications...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{ marginBottom: 20 }}>All Applications</h2>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="🔍 Search by Name, Email, Type, or ID..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.search}
      />

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.trHead}>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>College</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Submitted</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredApps.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: 20, textAlign: "center" }}>No records found.</td></tr>
            ) : (
              filteredApps.map(app => (
                <tr key={app.id} style={styles.tr}>
                  <td style={styles.td}>
                    <strong>{app.studentName}</strong>
                    <div style={{ fontSize: 12, color: "#666" }}>{app.email}</div>
                  </td>
                  <td style={styles.td}>{app.internshipType}</td>
                  <td style={styles.td}>{app.collegeName || "-"}</td>
                  <td style={styles.td}>
                    <span style={getStatusBadge(app.status)}>{app.status}</span>
                  </td>
                  <td style={styles.td}>
                    {app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString() : "-"}
                  </td>
                  <td style={styles.td}>
                    <button 
                      onClick={() => setSelectedApp(app)}
                      style={styles.viewBtn}
                    >
                      View Full Data
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <AdminApplicationDetailsModal 
          app={selectedApp} 
          onClose={() => setSelectedApp(null)} 
        />
      )}
    </div>
  );
}

// --- Styles & Helpers ---
const getStatusBadge = (status) => {
  const s = (status || "pending").toLowerCase();
  let bg = "#eee", col = "#333";
  
  if (s === "approved") { bg = "#d4edda"; col = "#155724"; }
  else if (s === "rejected") { bg = "#f8d7da"; col = "#721c24"; }
  else if (s === "completed") { bg = "#cce5ff"; col = "#004085"; }
  else if (s === "pending") { bg = "#fff3cd"; col = "#856404"; }

  return { background: bg, color: col, padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" };
};

const styles = {
  search: {
    width: "100%", maxWidth: "400px", padding: "10px", marginBottom: "20px",
    borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px"
  },
  tableContainer: {
    background: "#fff", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", overflow: "hidden"
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "800px" },
  trHead: { background: "#f8f9fa", borderBottom: "2px solid #eee" },
  th: { padding: "12px 15px", textAlign: "left", fontSize: "14px", color: "#555" },
  tr: { borderBottom: "1px solid #eee" },
  td: { padding: "12px 15px", fontSize: "14px", color: "#333", verticalAlign: "middle" },
  viewBtn: {
    padding: "6px 12px", background: "#007bff", color: "#fff", border: "none",
    borderRadius: "4px", cursor: "pointer", fontSize: "13px"
  }
};