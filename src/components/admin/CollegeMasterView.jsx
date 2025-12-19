// src/components/admin/CollegeMasterView.jsx
import React, { useState } from "react";
import ExcelExportButton from "../ExcelExportButton.jsx";

export default function CollegeMasterView({
  collegeMasterList,
  collegeSearch,
  setCollegeSearch,
  showCollegeForm,
  setShowCollegeForm,
  newCollege,
  setNewCollege,
  onSearch,
  onCreate,
  onUpdate,
  onDelete,
  working,
  styles,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const {
    card = { background: "#fff", padding: 18, marginTop: 12, borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" },
    inputStyle = { display: "block", width: "100%", marginBottom: 10, padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14 },
    applyBtn = { background: "#006400", color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", cursor: "pointer", fontWeight: 600, marginRight: 8 },
  } = styles || {};

  return (
    <div>
      {/* 🔍 SEARCH & EXPORT BAR */}
      {!showCollegeForm && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
          <input
            placeholder="Search colleges..."
            value={collegeSearch || ""}
            onChange={(e) => setCollegeSearch(e.target.value)}
            style={{ ...inputStyle, width: 300, margin: 0 }}
          />
          <button onClick={onSearch} style={applyBtn}>Search</button>
          
          <ExcelExportButton 
            getData={() => Promise.resolve(collegeMasterList)} 
            filenamePrefix="Admin_College_Master"
            style={{ ...applyBtn, background: "#217346" }}
          />

          <button
            onClick={() => setShowCollegeForm(true)}
            style={{ ...applyBtn, background: "#0d6efd", marginLeft: "auto" }}
          >
            ➕ New Record
          </button>
        </div>
      )}
      {/* ... rest of the component remains the same ... */}
    </div>
  );
}