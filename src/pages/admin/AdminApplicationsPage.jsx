// src/pages/admin/AdminApplicationsPage.jsx - CLEANED

import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase.js"; 
// Import reusable components
import ApplicationDataModal from "../../components/common/ApplicationDataModal.jsx";
import ExcelExportButton from "../../components/ExcelExportButton.jsx";
import ApplicationsTable from "../../components/common/ApplicationsTable.jsx"; // NEW: Reusable Table

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

      {/* Data Table: Using reusable ApplicationsTable */}
      <ApplicationsTable
        applications={filteredApps}
        onViewDetails={setSelectedApp} // Pass the handler
      />


      {/* Modal */}
      {selectedApp && (
        <ApplicationDataModal 
          app={selectedApp} 
          onClose={() => setSelectedApp(null)} 
        />
      )}
    </div>
  );
}

// NOTE: Removed local getStatusBadge helper function.

// Keeping only necessary styles (controls)
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
  // Removed table-related styles as they are now in ApplicationsTable.jsx
};