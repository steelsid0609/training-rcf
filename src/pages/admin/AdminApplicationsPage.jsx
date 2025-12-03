import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase.js"; // Ensure this path is correct based on folder structure
import AdminApplicationDetailsModal from "../../components/common/ApplicationDataModal.jsx";
import ExcelExportButton from "../../components/ExcelExportButton.jsx";

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    // Real-time listener
    const q = query(collection(db, "applications"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setApps(list);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching applications:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter Logic
  const filteredApps = apps.filter(app => {
    const term = searchTerm.toLowerCase();
    const appStatus = (app.status || "pending").toLowerCase();
    
    // 1. Text Search
    const matchesSearch = 
      (app.studentName || "").toLowerCase().includes(term) ||
      (app.email || "").toLowerCase().includes(term) ||
      (app.internshipType || "").toLowerCase().includes(term) ||
      app.id.toLowerCase().includes(term);

    // 2. Status Filter
    const matchesStatus = statusFilter === "All" || appStatus === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  if (loading) return <div style={{ padding: 30 }}>Loading applications...</div>;

  return (
    <div style={{ padding: 30 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: "#333" }}>All Applications</h2>
        <div style={{ fontSize: "14px", color: "#666" }}>
          Total: {apps.length} | Showing: {filteredApps.length}
        </div>
      </div>

      {/* Controls Bar */}
      <div style={styles.controls}>
        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search Student, Email, Type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.search}
        />

        {/* Status Filter */}
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          style={styles.select}
        >
          <option value="All">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="pending_confirmation">Pending Confirmation</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Export Button */}
        <ExcelExportButton 
          getData={() => Promise.resolve(filteredApps)} 
          filenamePrefix="RCF_All_Applications"
          style={styles.exportBtn}
        />
      </div>

      {/* Data Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.trHead}>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>College</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Applied On</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredApps.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: 30, textAlign: "center", color: "#888" }}>No records match your filters.</td></tr>
            ) : (
              filteredApps.map(app => (
                <tr key={app.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{fontWeight: "bold"}}>{app.studentName}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{app.email}</div>
                  </td>
                  <td style={styles.td}>{app.internshipType}</td>
                  <td style={styles.td}>{app.collegeName || "-"}</td>
                  <td style={styles.td}>
                    <span style={getStatusBadge(app.status)}>{app.status?.toUpperCase()}</span>
                  </td>
                  <td style={styles.td}>
                    {app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString() : "-"}
                  </td>
                  <td style={styles.td}>
                    <button 
                      onClick={() => setSelectedApp(app)}
                      style={styles.viewBtn}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedApp && (
        <AdminApplicationDetailsModal 
          app={selectedApp} 
          onClose={() => setSelectedApp(null)} 
        />
      )}
    </div>
  );
}

// --- Helpers ---
const getStatusBadge = (status) => {
  const s = (status || "pending").toLowerCase();
  let bg = "#eee", col = "#333";
  
  switch(s) {
    case "approved": bg = "#d4edda"; col = "#155724"; break;
    case "rejected": bg = "#f8d7da"; col = "#721c24"; break;
    case "completed": bg = "#cce5ff"; col = "#004085"; break;
    case "pending": bg = "#fff3cd"; col = "#856404"; break;
    case "in_progress": bg = "#e0cffc"; col = "#5e35b1"; break;
    case "pending_confirmation": bg = "#d1ecf1"; col = "#0c5460"; break;
    default: bg = "#e2e3e5"; col = "#383d41";
  }

  return { background: bg, color: col, padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold", whiteSpace: "nowrap" };
};

const styles = {
  controls: {
    display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap"
  },
  search: {
    flex: 2, minWidth: "200px", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px"
  },
  select: {
    flex: 1, minWidth: "150px", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", cursor: "pointer"
  },
  exportBtn: {
    padding: "10px 20px", background: "#217346", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px"
  },
  tableContainer: {
    background: "#fff", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", overflowX: "auto"
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "800px" },
  trHead: { background: "#f8f9fa", borderBottom: "2px solid #eee" },
  th: { padding: "12px 15px", textAlign: "left", fontSize: "14px", color: "#555", fontWeight: "600" },
  tr: { borderBottom: "1px solid #eee" },
  td: { padding: "12px 15px", fontSize: "14px", color: "#333", verticalAlign: "middle" },
  viewBtn: {
    padding: "6px 14px", background: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px"
  }
};