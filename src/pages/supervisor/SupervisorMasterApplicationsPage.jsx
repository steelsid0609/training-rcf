// src/pages/supervisor/SupervisorMasterApplicationsPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase.js";
import AdminApplicationDetailsModal from "../../components/admin/AdminApplicationDetailsModal.jsx";
import ExcelExportButton from "../../components/ExcelExportButton.jsx";
import ApplicationsTable from "../../components/common/ApplicationsTable.jsx"; // Use reusable table
import { UI_STYLES } from "../../utils/constants.js";

export default function SupervisorMasterApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    // Listen to ALL applications ordered by newest
    const q = query(collection(db, "applications"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setApps(list);
      setLoading(false);
    }, (err) => {
      console.error("Sync error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter Logic (Memoized for performance)
  const filteredApps = useMemo(() => {
    return apps.filter(app => {
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
  }, [apps, searchTerm, statusFilter]);

  if (loading) return <div style={{ padding: 30 }}>Loading master list...</div>;

  return (
    <div style={{ padding: 30 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: UI_STYLES.TEXT_MAIN }}>Master Application List</h2>
        <p style={{ color: UI_STYLES.TEXT_MUTED, marginTop: 5 }}>View and export all student applications.</p>
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
          <option value="pending">Pending Review</option>
          <option value="approved">Approved (Payment Pending)</option>
          <option value="pending_confirmation">Payment Verified</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Export Button */}
        <ExcelExportButton 
          getData={() => Promise.resolve(filteredApps)} 
          filenamePrefix="RCF_Master_Report"
          style={styles.exportBtn}
          label="Export to Excel"
        />
      </div>

      {/* Data Table - Using Reusable Table */}
      <ApplicationsTable
        applications={filteredApps}
        onViewDetails={setSelectedApp} // Pass the handler to the table
      />

      {/* Detail Modal (Read Only) */}
      {selectedApp && (
        <AdminApplicationDetailsModal 
          app={selectedApp} 
          onClose={() => setSelectedApp(null)} 
        />
      )}
    </div>
  );
}

const styles = {
  controls: { 
    display: "flex", 
    gap: "10px", 
    marginBottom: "20px", 
    flexWrap: "wrap" 
  },
  search: { 
    flex: 2, 
    minWidth: "200px", 
    padding: "10px", 
    borderRadius: "6px", 
    border: "1px solid #ccc", 
    fontSize: "14px" 
  },
  select: { 
    flex: 1, 
    minWidth: "150px", 
    padding: "10px", 
    borderRadius: "6px", 
    border: "1px solid #ccc", 
    fontSize: "14px", 
    cursor: "pointer" 
  },
  exportBtn: { 
    padding: "10px 20px", 
    background: "#217346", 
    color: "#fff", 
    border: "none", 
    borderRadius: "6px", 
    cursor: "pointer", 
    fontWeight: "bold", 
    fontSize: "14px" 
  }
};