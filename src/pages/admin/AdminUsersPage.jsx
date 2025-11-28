// src/pages/admin/AdminUsersPage.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-toastify";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Temporary state to track role changes per user card (userId -> newRole)
  const [roleSelection, setRoleSelection] = useState({});

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      // Fetch ALL users (no role restriction)
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  // --- ACTIONS ---

  // Update local selection state for a specific user card
  function handleRoleSelect(userId, newRole) {
    setRoleSelection((prev) => ({ ...prev, [userId]: newRole }));
  }

  // Commit change to Firestore
  async function saveRoleChange(user) {
    const newRole = roleSelection[user.id];
    
    // Validation
    if (!newRole || newRole === user.role) {
      return toast.info("No change detected.");
    }

    if (!window.confirm(`Change role of ${user.email} from '${user.role}' to '${newRole}'?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, "users", user.id), {
        role: newRole
      });
      
      toast.success(`Role updated to ${newRole}`);
      
      // Update local UI immediately
      setUsers((prev) => 
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      
      // Clear selection
      setRoleSelection((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });

    } catch (err) {
      console.error(err);
      toast.error("Failed to update role");
    }
  }

  // --- FILTER LOGIC ---
  const filteredUsers = users.filter((u) => {
    // 1. Role Filter
    if (roleFilter !== "All" && (u.role || "student") !== roleFilter) {
      return false;
    }

    // 2. Search Filter
    const term = searchTerm.toLowerCase();
    const name = (u.fullname || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    
    return name.includes(term) || email.includes(term);
  });

  if (loading) return <div style={{ padding: 30 }}>Loading users...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{ marginBottom: 20, color: "#333" }}>User Management</h2>
      
      {/* --- CONTROLS --- */}
      <div style={styles.controlsBar}>
        <input
          type="text"
          placeholder="🔍 Search by Name or Email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />

        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="All">All Roles</option>
          <option value="student">Student</option>
          <option value="supervisor">Supervisor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* --- USERS GRID --- */}
      {filteredUsers.length === 0 ? (
        <p style={{ color: "#666" }}>No users found matching filters.</p>
      ) : (
        <div style={styles.grid}>
          {filteredUsers.map((u) => {
            const currentSelection = roleSelection[u.id] || u.role || "student";
            const isChanged = currentSelection !== (u.role || "student");

            return (
              <div key={u.id} style={styles.card}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "16px", color: "#333" }}>
                      {u.fullname || "No Name"}
                    </div>
                    <div style={{ fontSize: "13px", color: "#777", marginTop: 2 }}>{u.email}</div>
                  </div>
                  <span style={getRoleBadge(u.role)}>{(u.role || "student").toUpperCase()}</span>
                </div>

                <div style={{ margin: "15px 0", fontSize: "13px", color: "#555" }}>
                  <div>📞 {u.phone || "N/A"}</div>
                  <div>🎓 {u.discipline || "N/A"}</div>
                </div>

                <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "10px 0" }} />

                {/* Role Changer */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    value={currentSelection}
                    onChange={(e) => handleRoleSelect(u.id, e.target.value)}
                    style={styles.roleSelect}
                  >
                    <option value="student">Student</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    onClick={() => saveRoleChange(u)}
                    disabled={!isChanged}
                    style={{
                      ...styles.saveBtn,
                      opacity: isChanged ? 1 : 0.5,
                      cursor: isChanged ? "pointer" : "default"
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const styles = {
  controlsBar: {
    display: "flex", gap: "15px", marginBottom: "25px", flexWrap: "wrap"
  },
  searchInput: {
    flex: 1, minWidth: "250px", padding: "10px 15px", borderRadius: "6px",
    border: "1px solid #ccc", fontSize: "14px"
  },
  filterSelect: {
    padding: "10px 15px", borderRadius: "6px", border: "1px solid #ccc",
    fontSize: "14px", cursor: "pointer", minWidth: "150px"
  },
  grid: {
    display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))"
  },
  card: {
    background: "#fff", padding: "20px", borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)", borderTop: "4px solid #6c757d"
  },
  roleSelect: {
    flex: 1, padding: "6px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "13px"
  },
  saveBtn: {
    padding: "6px 15px", borderRadius: "4px", border: "none",
    background: "#28a745", color: "#fff", fontWeight: "bold", fontSize: "13px"
  }
};

function getRoleBadge(role) {
  const r = (role || "student").toLowerCase();
  let bg = "#e2e3e5"; let col = "#383d41";
  if (r === "admin") { bg = "#dc3545"; col = "#fff"; }
  else if (r === "supervisor") { bg = "#ffc107"; col = "#000"; }
  else if (r === "student") { bg = "#0d6efd"; col = "#fff"; }
  
  return {
    background: bg, color: col, padding: "3px 8px", borderRadius: "12px",
    fontSize: "11px", fontWeight: "bold", letterSpacing: "0.5px"
  };
}