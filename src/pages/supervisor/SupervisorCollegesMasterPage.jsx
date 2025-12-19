// src/pages/supervisor/SupervisorCollegesMasterPage.jsx
import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import ExcelExportButton from "../../components/ExcelExportButton.jsx";

export default function SupervisorCollegesMasterPage() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollege, setSelectedCollege] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "colleges_master"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setColleges(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter Logic
  const filteredColleges = colleges.filter(col => 
    col.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (col.address || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ padding: 20 }}>Loading Master List...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: "#006400", margin: 0 }}>College Master List</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <ExcelExportButton 
            getData={() => Promise.resolve(filteredColleges)} 
            filenamePrefix="College_Master_List"
            style={styles.exportBtn}
          />
          <span style={styles.badge}>{filteredColleges.length} Institutions Found</span>
        </div>
      </div>

      {/* --- SEARCH BAR --- */}
      <div style={{ marginBottom: "20px" }}>
        <input 
          type="text"
          placeholder="🔍 Search by college name or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchBar}
        />
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>College Name</th>
              <th style={styles.th}>Address</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredColleges.length > 0 ? (
              filteredColleges.map((col) => (
                <tr key={col.id} style={styles.row}>
                  <td style={{ ...styles.td, fontWeight: "600" }}>{col.name}</td>
                  <td style={styles.td}>{col.address || "N/A"}</td>
                  <td style={styles.td}>
                    <button 
                      onClick={() => setSelectedCollege(col)} 
                      style={styles.viewBtn}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" style={{ padding: "20px", textAlign: "center", color: "#666" }}>No matching institutions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- DETAILS MODAL --- */}
      {selectedCollege && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>{selectedCollege.name}</h3>
              <button onClick={() => setSelectedCollege(null)} style={styles.closeBtn}>&times;</button>
            </div>
            
            <div style={styles.modalBody}>
              <section style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>College Contact Info</h4>
                <p><strong>Emails:</strong> {selectedCollege.emails?.join(", ") || "N/A"}</p>
                <p><strong>Phones:</strong> {selectedCollege.contacts?.join(", ") || "N/A"}</p>
              </section>

              <section style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>Principal Details</h4>
                <p><strong>Name:</strong> {selectedCollege.principal?.name || "N/A"}</p>
                <p><strong>Emails:</strong> {selectedCollege.principal?.emails?.join(", ") || "N/A"}</p>
                <p><strong>Contacts:</strong> {selectedCollege.principal?.contacts?.join(", ") || "N/A"}</p>
              </section>

              <section style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>Faculty / Coordinators</h4>
                {selectedCollege.faculties && selectedCollege.faculties.length > 0 ? (
                  selectedCollege.faculties.map((fac, idx) => (
                    <div key={idx} style={styles.facultyItem}>
                      <p><strong>{fac.name}</strong></p>
                      <p style={{ fontSize: '12px', color: '#666' }}>
                        Email: {fac.emails?.join(", ")} | Contact: {fac.contacts?.join(", ")}
                      </p>
                    </div>
                  ))
                ) : <p>No faculty data available.</p>}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  // ... existing styles ...
  searchBar: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none" },
  exportBtn: { padding: "8px 16px", background: "#217346", color: "#fff", border: "none", borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" },
  tableCard: { background: "#fff", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  headerRow: { background: "#f8f9fa", borderBottom: "2px solid #eee" },
  th: { padding: "15px", fontSize: "14px", color: "#555", fontWeight: "700" },
  td: { padding: "15px", borderBottom: "1px solid #eee", fontSize: "14px", color: "#333" },
  row: { transition: "background 0.2s" },
  viewBtn: { background: "#006400", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" },
  badge: { background: "#e8f5e9", color: "#2e7d32", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modal: { background: "#fff", width: "90%", maxWidth: "600px", borderRadius: "12px", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" },
  modalHeader: { padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fcfcfc" },
  closeBtn: { background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#999" },
  modalBody: { padding: "20px", overflowY: "auto" },
  modalSection: { marginBottom: "20px", borderBottom: "1px solid #f9f9f9", paddingBottom: "15px" },
  sectionTitle: { color: "#006400", marginBottom: "10px", fontSize: "15px", borderLeft: "4px solid #006400", paddingLeft: "10px" },
  facultyItem: { padding: "10px", background: "#f9f9f9", borderRadius: "6px", marginBottom: "8px" }
};