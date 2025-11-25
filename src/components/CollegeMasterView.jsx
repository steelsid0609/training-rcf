// src/components/CollegeMasterView.jsx
import React from "react";

export default function CollegeMasterView({
  collegeMasterList,
  setCollegeMasterList,
  collegeSearch,
  setCollegeSearch,
  showCollegeForm,
  setShowCollegeForm,
  newCollege,
  setNewCollege,
  onSearch,   // () => void
  onCreate,   // () => void
  onUpdate,   // (col) => void
  onDelete,   // (col) => void
  working,
  styles,     // { card, inputStyle, applyBtn } – can be omitted
}) {
  // ✅ Safe defaults so no crash if styles is missing
  const {
    card = {
      background: "#fff",
      padding: 18,
      marginTop: 12,
      borderRadius: 10,
      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    },
    inputStyle = {
      display: "block",
      width: "100%",
      margin: "8px 0 12px 0",
      padding: "10px 12px",
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
    },
  } = styles || {};

  const handleSearch = () => {
    if (onSearch) onSearch();
  };

  const handleClear = () => {
    setCollegeSearch("");
    if (onSearch) onSearch("");
  };

  return (
    <div>
      {/* 🔍 Search Bar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <input
          placeholder="Search colleges by name, address, email or contact"
          value={collegeSearch}
          onChange={(e) => setCollegeSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          style={{ ...inputStyle, width: 360, margin: 0 }}
        />
        <button onClick={handleSearch} style={applyBtn}>
          Search
        </button>
        <button
          onClick={handleClear}
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

      {/* 🏫 List or Form */}
      {!showCollegeForm ? (
        collegeMasterList.length === 0 ? (
          <div>No colleges found.</div>
        ) : (
          collegeMasterList.map((c) => (
            <div key={c.id} style={card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div style={{ flex: 1 }}>
                  <label>College Name</label>
                  <input
                    value={c.name || ""}
                    onChange={(e) =>
                      setCollegeMasterList((prev) =>
                        prev.map((p) =>
                          p.id === c.id ? { ...p, name: e.target.value } : p
                        )
                      )
                    }
                    style={{ ...inputStyle, width: "800px" }}
                  />

                  <label>Address</label>
                  <input
                    value={c.address || ""}
                    onChange={(e) =>
                      setCollegeMasterList((prev) =>
                        prev.map((p) =>
                          p.id === c.id
                            ? { ...p, address: e.target.value }
                            : p
                        )
                      )
                    }
                    style={{ ...inputStyle, width: "800px" }}
                  />

                  <label>Email</label>
                  <input
                    value={c.email || ""}
                    onChange={(e) =>
                      setCollegeMasterList((prev) =>
                        prev.map((p) =>
                          p.id === c.id ? { ...p, email: e.target.value } : p
                        )
                      )
                    }
                    style={{ ...inputStyle, width: "300px" }}
                  />

                  <label>Contact No.</label>
                  <input
                    value={c.contact || ""}
                    onChange={(e) =>
                      setCollegeMasterList((prev) =>
                        prev.map((p) =>
                          p.id === c.id ? { ...p, contact: e.target.value } : p
                        )
                      )
                    }
                    style={{ ...inputStyle, width: "120px" }}
                  />
                </div>

                {onUpdate && onDelete && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      minWidth: 160,
                    }}
                  >
                    <button onClick={() => onUpdate(c)} style={applyBtn}>
                      Save
                    </button>
                    <button
                      onClick={() => onDelete(c)}
                      style={{ ...applyBtn, background: "#dc3545" }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )
      ) : (
        <div style={card}>
          <h3>Add New College</h3>

          <label>College Name</label>
          <input
            value={newCollege.name}
            onChange={(e) =>
              setNewCollege((s) => ({ ...s, name: e.target.value }))
            }
            style={inputStyle}
          />

          <label>Address</label>
          <input
            value={newCollege.address}
            onChange={(e) =>
              setNewCollege((s) => ({ ...s, address: e.target.value }))
            }
            style={inputStyle}
          />

          <label>Email</label>
          <input
            value={newCollege.email}
            onChange={(e) =>
              setNewCollege((s) => ({ ...s, email: e.target.value }))
            }
            style={inputStyle}
          />

          <label>Contact No.</label>
          <input
            value={newCollege.contact}
            onChange={(e) =>
              setNewCollege((s) => ({ ...s, contact: e.target.value }))
            }
            style={inputStyle}
          />

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            {onCreate && (
              <button onClick={onCreate} style={applyBtn} disabled={working}>
                Submit
              </button>
            )}
            <button
              onClick={() => setShowCollegeForm(false)}
              style={{ ...applyBtn, background: "#6c757d" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
