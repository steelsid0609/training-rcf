import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query 
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function AdminSlotsPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    label: "",
    startDate: "",
    isActive: true
  });

  useEffect(() => {
    fetchSlots();
  }, []);

  async function fetchSlots() {
    setLoading(true);
    try {
      const q = query(collection(db, "trainingSlots"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort by date
      list.sort((a, b) => a.startDate.localeCompare(b.startDate));
      
      setSlots(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load slots");
    } finally {
      setLoading(false);
    }
  }

  // --- ACTIONS ---

  // 1. Load data into form for editing
  function handleEditClick(slot) {
    setIsEditing(true);
    setEditId(slot.id);
    setFormData({
      label: slot.label,
      startDate: slot.startDate,
      isActive: slot.isActive !== false // Default to true if undefined
    });
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 2. Cancel Edit
  function handleCancelEdit() {
    setIsEditing(false);
    setEditId(null);
    setFormData({ label: "", startDate: "", isActive: true });
  }

  // 3. Delete
  async function handleDelete(id) {
    if(!window.confirm("Are you sure you want to delete this slot permanently?")) return;
    try {
      await deleteDoc(doc(db, "trainingSlots", id));
      setSlots(slots.filter(s => s.id !== id));
      toast.success("Slot deleted");
      
      // If we deleted the slot being edited, reset form
      if (editId === id) handleCancelEdit();
    } catch (err) {
      toast.error("Failed to delete");
    }
  }

  // 4. Submit (Add or Update)
  async function handleSubmit(e) {
    e.preventDefault();
    if(!formData.label || !formData.startDate) return toast.warn("Please fill all fields");

    setLoading(true);
    try {
      if (isEditing) {
        // UPDATE EXISTING
        const ref = doc(db, "trainingSlots", editId);
        await updateDoc(ref, {
          label: formData.label,
          startDate: formData.startDate,
          isActive: formData.isActive
        });
        toast.success("Slot updated successfully");
        setIsEditing(false);
        setEditId(null);
      } else {
        // CREATE NEW
        await addDoc(collection(db, "trainingSlots"), {
          label: formData.label,
          startDate: formData.startDate,
          isActive: formData.isActive
        });
        toast.success("New slot added");
      }
      
      // Reset Form & Reload List
      setFormData({ label: "", startDate: "", isActive: true });
      await fetchSlots();
      
    } catch (err) {
      console.error(err);
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 30, maxWidth: 1000, margin: "0 auto" }}>
      <button onClick={() => navigate("/admin/dashboard")} style={backBtn}>
        ← Back to Dashboard
      </button>

      <h2 style={{ margin: "20px 0", color: "#333" }}>Manage Training Slots</h2>

      {/* --- ADD / EDIT FORM --- */}
      <div style={formCard(isEditing)}>
        <h4 style={{ margin: "0 0 15px 0", color: isEditing ? "#e65100" : "#006400" }}>
          {isEditing ? `Editing Slot` : "Add New Slot"}
        </h4>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 15, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={label}>Label (e.g. 1st Jan - 15th Jan)</label>
            <input 
              style={input} 
              value={formData.label} 
              onChange={e => setFormData({...formData, label: e.target.value})}
              placeholder="Enter Label"
            />
          </div>
          
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={label}>Start Date</label>
            <input 
              type="date" 
              style={input} 
              value={formData.startDate} 
              onChange={e => setFormData({...formData, startDate: e.target.value})}
            />
          </div>

          <div style={{ flex: 1, minWidth: 100 }}>
             <label style={label}>Status</label>
             <select 
               style={input}
               value={formData.isActive ? "true" : "false"}
               onChange={e => setFormData({...formData, isActive: e.target.value === "true"})}
             >
               <option value="true">Active</option>
               <option value="false">Inactive</option>
             </select>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" style={isEditing ? updateBtn : addBtn}>
              {isEditing ? "Update Slot" : "Add Slot"}
            </button>
            
            {isEditing && (
              <button type="button" onClick={handleCancelEdit} style={cancelBtn}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- SLOTS LIST --- */}
      {loading && !isEditing ? <p>Loading...</p> : (
        <table style={table}>
          <thead>
            <tr style={{ background: "#f4f4f4", textAlign: "left" }}>
              <th style={th}>Status</th>
              <th style={th}>Start Date</th>
              <th style={th}>Label</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slots.map(slot => {
              const isActive = slot.isActive !== false;
              // Highlight row if being edited
              const rowStyle = slot.id === editId ? { background: "#fff8e1", borderBottom: "1px solid #ddd" } : { borderBottom: "1px solid #eee" };
              
              return (
                <tr key={slot.id} style={rowStyle}>
                  <td style={td}>
                    <span style={isActive ? badgeActive : badgeInactive}>
                      {isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td style={td}>{slot.startDate}</td>
                  <td style={td}>{slot.label}</td>
                  <td style={td}>
                    <button 
                      onClick={() => handleEditClick(slot)} 
                      style={editActionBtn}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(slot.id)} 
                      style={deleteBtn}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// --- STYLES ---
const formCard = (isEditing) => ({
  background: "#fff",
  padding: 25,
  borderRadius: 8,
  boxShadow: isEditing ? "0 0 0 2px #ff9800" : "0 2px 5px rgba(0,0,0,0.1)", // Highlight border if editing
  marginBottom: 30,
  transition: "box-shadow 0.3s"
});

const label = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5, color: "#555" };
const input = { width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ccc", fontSize: 14 };

const table = { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" };
const th = { padding: "12px 15px", borderBottom: "2px solid #ddd", fontSize: 14, color: "#444" };
const td = { padding: "12px 15px", fontSize: 14, verticalAlign: "middle" };

// Buttons
const backBtn = { background: "transparent", border: "none", color: "#666", cursor: "pointer", fontSize: 14, marginBottom: 10 };
const addBtn = { padding: "10px 20px", background: "#28a745", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 };
const updateBtn = { padding: "10px 20px", background: "#e65100", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 };
const cancelBtn = { padding: "10px 15px", background: "#6c757d", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" };

const editActionBtn = { padding: "6px 12px", background: "#007bff", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", marginRight: 8, fontSize: 13 };
const deleteBtn = { padding: "6px 12px", background: "#dc3545", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13 };

// Badges
const badgeActive = { background: "#d4edda", color: "#155724", padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: "bold" };
const badgeInactive = { background: "#f8d7da", color: "#721c24", padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: "bold" };