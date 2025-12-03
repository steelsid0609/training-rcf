// src/pages/admin/AdminUsersPage.jsx (Used by both Admin and Supervisor)
import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth"; // Used by Supervisor view
import { db, auth } from "../../firebase";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { getStatusStyle, ROLES, UI_STYLES } from "../../utils/constants";

const UserCard = ({ u, currentSelection, handleRoleSelect, saveRoleChange, sendReset, isAdmin, isSupervisor }) => {
  const isChanged = currentSelection !== (u.role || ROLES.STUDENT);

  const getRoleBadge = (role) => {
    const r = (role || ROLES.STUDENT).toLowerCase();
    let bg = "#e2e3e5"; let col = "#383d41";
    if (r === ROLES.ADMIN) { bg = UI_STYLES.DANGER_RED; col = "#fff"; }
    else if (r === ROLES.SUPERVISOR) { bg = "#ffc107"; col = "#000"; }
    else if (r === ROLES.STUDENT) { bg = UI_STYLES.PRIMARY_BLUE; col = "#fff"; }
    
    return {
      background: bg, color: col, padding: "3px 8px", borderRadius: "12px",
      fontSize: "11px", fontWeight: "bold", letterSpacing: "0.5px"
    };
  };

  return (
    <div style={cardStyles.card}>
      {/* Header */}
      <div style={cardStyles.header}>
        <div>
          <div style={cardStyles.name}>
            {u.fullname || "No Name"}
          </div>
          <div style={cardStyles.email}>{u.email}</div>
        </div>
        <span style={getRoleBadge(u.role)}>{(u.role || ROLES.STUDENT).toUpperCase()}</span>
      </div>

      <div style={cardStyles.info}>
        <div>📞 {u.phone || "N/A"}</div>
        <div>🎓 {u.discipline || "N/A"}</div>
      </div>

      <hr style={cardStyles.divider} />

      {/* Role Changer (Admin Only) */}
      {isAdmin && (
        <div style={cardStyles.roleChanger}>
          <select
            value={currentSelection}
            onChange={(e) => handleRoleSelect(u.id, e.target.value)}
            style={cardStyles.roleSelect}
          >
            <option value={ROLES.STUDENT}>Student</option>
            <option value={ROLES.SUPERVISOR}>Supervisor</option>
            <option value={ROLES.ADMIN}>Admin</option>
          </select>

          <button
            onClick={() => saveRoleChange(u)}
            disabled={!isChanged}
            style={{
              ...cardStyles.saveBtn,
              opacity: isChanged ? 1 : 0.5,
              cursor: isChanged ? "pointer" : "default"
            }}
          >
            Save
          </button>
        </div>
      )}
      
      {/* Password Reset (Supervisor/Admin) */}
      {(isAdmin || isSupervisor) && (
          <button 
            onClick={() => sendReset(u.email)}
            style={{...cardStyles.resetBtn, marginTop: isAdmin ? 10 : 0}}
            disabled={!u.email}
          >
            Send Password Reset
          </button>
      )}
    </div>
  );
};


export default function UserManagementPage({ roleFilterOverride }) { // Use shared component
  const { role: currentUserRole } = useAuth();
  const isAdmin = currentUserRole === ROLES.ADMIN;
  const isSupervisor = currentUserRole === ROLES.SUPERVISOR;
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState(roleFilterOverride || ROLES.STUDENT); // Default filter for Supervisor
  
  // Admin only state for role updates
  const [roleSelection, setRoleSelection] = useState({});

  // Determine the correct data query based on role
  const collectionQuery = useMemo(() => {
    let q = collection(db, "users");
    // Supervisor only needs student data. Admin needs all.
    if (isSupervisor) {
      q = query(q, where("role", "==", ROLES.STUDENT));
    }
    return q;
  }, [isSupervisor]);

  useEffect(() => {
    loadUsers();
  }, [collectionQuery]);

  async function loadUsers() {
    setLoading(true);
    try {
      const snap = await getDocs(collectionQuery);
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
  function handleRoleSelect(userId, newRole) {
    setRoleSelection((prev) => ({ ...prev, [userId]: newRole }));
  }

  async function saveRoleChange(user) {
    const newRole = roleSelection[user.id];
    if (!newRole || newRole === user.role) return toast.info("No change detected.");
    if (!window.confirm(`Change role of ${user.email} from '${user.role}' to '${newRole}'?`)) return;

    try {
      await updateDoc(doc(db, "users", user.id), { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
      setRoleSelection((prev) => { const next = { ...prev }; delete next[user.id]; return next; });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update role");
    }
  }

  async function sendReset(email) {
    if (!email) return toast.warn("User has no email record");
    // NOTE: Cannot use window.confirm due to modal conflict, but keeping for now as a quick action.
    if (!window.confirm(`Send password reset link to ${email}?`)) return; 

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Reset link sent to ${email}`);
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  }


  // --- FILTER LOGIC ---
  const filteredUsers = users.filter((u) => {
    // 1. Role Filter
    const targetRole = roleFilterOverride || roleFilter;
    if (targetRole !== "All" && (u.role || ROLES.STUDENT) !== targetRole) return false;

    // 2. Search Filter
    const term = searchTerm.toLowerCase();
    const name = (u.fullname || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    
    return name.includes(term) || email.includes(term) || (u.phone || "").includes(term);
  });

  if (loading) return <div style={{ padding: 30 }}>Loading users...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{ marginBottom: 20, color: UI_STYLES.TEXT_MAIN }}>{isAdmin ? "Admin User Management" : "Registered Students"}</h2>
      <p style={{ color: UI_STYLES.TEXT_MUTED, marginTop: -15, marginBottom: 25 }}>
        {isAdmin ? "Manage roles for all registered users." : "Search and manage student accounts."}
      </p>
      
      {/* --- CONTROLS --- */}
      <div style={pageStyles.controlsBar}>
        <input
          type="text"
          placeholder="🔍 Search by Name, Email, or Phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={pageStyles.searchInput}
        />
        
        {isAdmin && (
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            style={pageStyles.filterSelect}
          >
            <option value="All">All Roles</option>
            <option value={ROLES.STUDENT}>Student</option>
            <option value={ROLES.SUPERVISOR}>Supervisor</option>
            <option value={ROLES.ADMIN}>Admin</option>
          </select>
        )}
      </div>

      {/* --- USERS GRID --- */}
      {filteredUsers.length === 0 ? (
        <p style={{ color: UI_STYLES.TEXT_MUTED }}>No users found matching filters.</p>
      ) : (
        <div style={pageStyles.grid}>
          {filteredUsers.map((u) => {
            const currentSelection = roleSelection[u.id] || u.role || ROLES.STUDENT;

            return (
              <UserCard
                key={u.id}
                u={u}
                currentSelection={currentSelection}
                handleRoleSelect={handleRoleSelect}
                saveRoleChange={saveRoleChange}
                sendReset={sendReset}
                isAdmin={isAdmin}
                isSupervisor={isSupervisor && !isAdmin} // Only show Supervisor actions if not admin
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- SHARED STYLES FOR USER MANAGEMENT ---
const cardStyles = {
  card: {
    background: "#fff", padding: "20px", borderRadius: "8px",
    boxShadow: UI_STYLES.CARD_SHADOW, borderTop: `4px solid ${UI_STYLES.SECONDARY_GRAY}`
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start"
  },
  name: {
    fontWeight: "bold", fontSize: "16px", color: UI_STYLES.TEXT_MAIN
  },
  email: {
    fontSize: "13px", color: UI_STYLES.TEXT_MUTED, marginTop: 2
  },
  info: {
    margin: "15px 0", fontSize: "13px", color: "#555"
  },
  divider: { 
    border: "0", borderTop: "1px solid #eee", margin: "10px 0" 
  },
  roleChanger: {
    display: "flex", gap: 8, alignItems: "center"
  },
  roleSelect: {
    flex: 1, padding: "6px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "13px"
  },
  saveBtn: {
    padding: "6px 15px", borderRadius: "4px", border: "none",
    background: "#28a745", color: "#fff", fontWeight: "bold", fontSize: "13px"
  },
  resetBtn: {
    width: "100%",
    padding: "8px 12px",
    background: "#0d6efd",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500"
  }
};

const pageStyles = {
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
  }
};