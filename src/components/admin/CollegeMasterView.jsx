// src/components/admin/CollegeMasterView.jsx
import React, { useState } from "react";

export default function CollegeMasterView({
  collegeMasterList,
  setCollegeMasterList, // Not used directly for local edit, but kept for signature
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
  // --- STATE FOR UI INTERACTION ---
  const [expandedId, setExpandedId] = useState(null); // Which card is open?
  const [editingId, setEditingId] = useState(null);   // Which card is being edited?
  const [editFormData, setEditFormData] = useState({}); // Temporary data while editing

  // --- STYLES DEFAULT ---
  const {
    card = {
      background: "#fff",
      padding: 18,
      marginTop: 12,
      borderRadius: 10,
      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      transition: "0.2s",
    },
    inputStyle = {
      display: "block",
      width: "100%",
      marginBottom: 10,
      padding: "8px 10px",
      borderRadius: 6,
      border: "1px solid #ccc",
      fontSize: 14,
    },
    applyBtn = {
      background: "#006400",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      padding: "8px 14px",
      cursor: "pointer",
      fontWeight: 600,
      marginRight: 8,
    },
  } = styles || {};

  // --- HANDLERS ---

  const handleExpand = (id) => {
    // If we are editing, don't allow collapsing or switching easily without cancelling
    if (editingId) return; 
    setExpandedId(expandedId === id ? null : id);
  };

  const handleEditClick = (college, e) => {
    e.stopPropagation(); // Prevent toggling expansion
    setEditingId(college.id);
    setEditFormData({ ...college }); // Copy data to temp state
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSaveClick = () => {
    if (onUpdate) {
      onUpdate(editFormData); // Pass the temp data to parent
      setEditingId(null);     // Exit edit mode (parent will refresh list)
    }
  };

  const handleChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      {/* 🔍 SEARCH BAR */}
      {!showCollegeForm && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input
            placeholder="Search colleges..."
            value={collegeSearch || ""}
            onChange={(e) => setCollegeSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch && onSearch()}
            style={{ ...inputStyle, width: 300, margin: 0 }}
          />
          <button onClick={onSearch} style={applyBtn}>Search</button>
          <button 
            onClick={() => { setCollegeSearch(""); if(onSearch) onSearch(); }} 
            style={{ ...applyBtn, background: "#6c757d" }}
          >
            Clear
          </button>
          <button
            onClick={() => setShowCollegeForm(true)}
            style={{ ...applyBtn, background: "#0d6efd", marginLeft: "auto" }}
          >
            ➕ New Record
          </button>
        </div>
      )}

      {/* 📝 NEW RECORD FORM */}
      {showCollegeForm ? (
        <div style={card}>
          <h3>Add New College</h3>
          <label>Name</label>
          <input 
            value={newCollege.name || ""} 
            onChange={(e) => setNewCollege(prev => ({...prev, name: e.target.value}))} 
            style={inputStyle} 
          />
          <label>Address</label>
          <input 
            value={newCollege.address || ""} 
            onChange={(e) => setNewCollege(prev => ({...prev, address: e.target.value}))} 
            style={inputStyle} 
          />
          <label>Email</label>
          <input 
            value={newCollege.email || ""} 
            onChange={(e) => setNewCollege(prev => ({...prev, email: e.target.value}))} 
            style={inputStyle} 
          />
          <label>Contact</label>
          <input 
            value={newCollege.contact || ""} 
            onChange={(e) => setNewCollege(prev => ({...prev, contact: e.target.value}))} 
            style={inputStyle} 
          />
          <div style={{ marginTop: 15 }}>
            <button onClick={() => onCreate(newCollege)} style={applyBtn} disabled={working}>Submit</button>
            <button onClick={() => setShowCollegeForm(false)} style={{ ...applyBtn, background: "#6c757d" }}>Cancel</button>
          </div>
        </div>
      ) : (
        /* 📋 COLLEGE LIST */
        collegeMasterList.length === 0 ? (
          <div>No colleges found.</div>
        ) : (
          collegeMasterList.map((c) => {
            const isExpanded = expandedId === c.id;
            const isEditing = editingId === c.id;

            return (
              <div 
                key={c.id} 
                style={{ ...card, borderLeft: isExpanded ? "5px solid #006400" : "5px solid transparent" }}
              >
                {/* --- HEADER (Always Visible) --- */}
                <div 
                  onClick={() => handleExpand(c.id)}
                  style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div style={{ width: "100%" }}>
                    {isEditing ? (
                       /* EDIT MODE: Header Inputs */
                       <>
                         <input 
                           value={editFormData.name || ""} 
                           onChange={(e) => handleChange("name", e.target.value)} 
                           placeholder="College Name"
                           style={{ ...inputStyle, fontWeight: "bold" }}
                           onClick={(e) => e.stopPropagation()}
                         />
                         <input 
                           value={editFormData.address || ""} 
                           onChange={(e) => handleChange("address", e.target.value)} 
                           placeholder="Address"
                           style={inputStyle}
                           onClick={(e) => e.stopPropagation()}
                         />
                       </>
                    ) : (
                      /* VIEW MODE: Header Text */
                      <>
                        <div style={{ fontWeight: 700, fontSize: "17px", color: "#333" }}>{c.name}</div>
                        <div style={{ color: "#666", fontSize: "14px", marginTop: 4 }}>{c.address || "No Address Provided"}</div>
                      </>
                    )}
                  </div>
                  {/* Chevron Icon */}
                  {!isEditing && (
                     <div style={{ fontSize: "20px", color: "#999", marginLeft: 10 }}>
                       {isExpanded ? "▲" : "▼"}
                     </div>
                  )}
                </div>

                {/* --- EXPANDED DETAILS BODY --- */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid #eee", marginTop: 12, paddingTop: 12 }}>
                    {isEditing ? (
                      /* EDIT MODE: Inputs */
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{fontSize:12, fontWeight:600}}>Email</label>
                          <input 
                            value={editFormData.email || ""} 
                            onChange={(e) => handleChange("email", e.target.value)} 
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={{fontSize:12, fontWeight:600}}>Contact</label>
                          <input 
                            value={editFormData.contact || ""} 
                            onChange={(e) => handleChange("contact", e.target.value)} 
                            style={inputStyle}
                          />
                        </div>
                      </div>
                    ) : (
                      /* VIEW MODE: Text Details */
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, color: "#444", fontSize: "14px" }}>
                        <div><strong>Email:</strong> {c.email || "-"}</div>
                        <div><strong>Contact:</strong> {c.contact || "-"}</div>
                      </div>
                    )}

                    {/* --- ACTION BUTTONS --- */}
                    <div style={{ marginTop: 15, display: "flex", justifyContent: "flex-end" }}>
                      {isEditing ? (
                        <>
                          <button onClick={handleSaveClick} style={applyBtn} disabled={working}>💾 Save Changes</button>
                          <button onClick={handleCancelEdit} style={{ ...applyBtn, background: "#6c757d" }}>❌ Cancel</button>
                        </>
                      ) : (
                        <>
                          {onUpdate && (
                            <button 
                              onClick={(e) => handleEditClick(c, e)} 
                              style={{ ...applyBtn, background: "#ff9800" }}
                            >
                              ✏️ Edit
                            </button>
                          )}
                          {onDelete && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onDelete(c); }} 
                              style={{ ...applyBtn, background: "#dc3545" }}
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )
      )}
    </div>
  );
}