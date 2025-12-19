// src/pages/supervisor/SupervisorCurrentTraineesPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

// --- CLOUDINARY CONFIG ---
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export default function SupervisorCurrentTraineesPage() {
  const { user } = useAuth();
  
  // Data Buckets
  const [readyToStart, setReadyToStart] = useState([]); // status: "pending_confirmation"
  const [activeTrainees, setActiveTrainees] = useState([]); // status: "in_progress"
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [expandedId, setExpandedId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form State
  const [targetApp, setTargetApp] = useState(null); // The app being acted upon
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    period: "", // e.g. "1st Month"
    plant: "",  // e.g. "Ammonia"
    file: null
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch both "pending_confirmation" (Ready) and "in_progress" (Active)
      const q = query(
        collection(db, "applications"),
        where("status", "in", ["pending_confirmation", "in_progress"])
      );
      
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Sort by newest
      docs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

      const ready = [];
      const active = [];

      docs.forEach(app => {
        if (app.status === "pending_confirmation") ready.push(app);
        else active.push(app);
      });

      setReadyToStart(ready);
      setActiveTrainees(active);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // --- HANDLERS ---

  function openIssueModal(app) {
    setTargetApp(app);
    setFormData({ period: "", plant: "", file: null });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setTargetApp(null);
  }

  async function handleIssueLetter() {
    const { period, plant, file } = formData;
    if (!period || !plant || !file) return toast.warn("Please fill all fields and select a file.");
    if (!targetApp) return;

    setUploading(true);
    try {
      // 1. Upload File
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", UPLOAD_PRESET);
      data.append("public_id", `posting_${targetApp.id}_${Date.now()}`);

      const res = await fetch(CLOUDINARY_URL, { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Upload failed");

      // 2. Prepare Letter Object
      const newLetter = {
        period,
        plant,
        url: json.secure_url,
        issuedAt: Timestamp.now(),
        issuedBy: user.uid,
        id: Date.now().toString()
      };

      // 3. Determine Updates based on status
      const updates = {
        postingLetters: arrayUnion(newLetter),
        updatedAt: serverTimestamp()
      };

      // IF this was "Ready to Start", move to "in_progress"
      if (targetApp.status === "pending_confirmation") {
        updates.status = "in_progress";
        updates.internshipStartedAt = serverTimestamp();
      }

      await updateDoc(doc(db, "applications", targetApp.id), updates);

      toast.success(targetApp.status === "pending_confirmation" ? "Internship Started & Letter Issued!" : "New Posting Letter Issued!");
      
      closeModal();
      await loadData();

    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleMarkCompleted(app) {
    if(!confirm(`Mark internship for ${app.studentName} as COMPLETED? This ends the training.`)) return;
    
    setProcessing(true);
    try {
      await updateDoc(doc(db, "applications", app.id), {
        status: "completed",
        completedAt: serverTimestamp(),
        completedBy: user.uid
      });
      toast.success("Marked as Completed");
      await loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  }

  // --- RENDER ---

  if (loading) return <div style={{padding: 30}}>Loading...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{ marginBottom: 10, color: "#333" }}>Current Trainees & Postings</h2>
      <p style={{ color: "#666", marginBottom: 30 }}>
        Issue posting letters for new joiners and manage active departmental rotations.
      </p>

      {/* --- SECTION 2: ACTIVE TRAINEES --- */}
      <div style={styles.sectionHeader}>
        ⚙️ Active Trainees ({activeTrainees.length})
      </div>
      
      {activeTrainees.length === 0 ? (
        <div style={styles.empty}>No active trainees.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          {activeTrainees.map(app => {
            const isExpanded = expandedId === app.id;
            const letters = app.postingLetters || [];

            return (
              <div key={app.id} style={{...styles.card, borderLeft: isExpanded ? "5px solid #006400" : "5px solid #0d6efd"}}>
                {/* Header */}
                <div style={styles.rowHeader} onClick={() => setExpandedId(isExpanded ? null : app.id)}>
                  <div style={{flex: 1}}>
                    <div style={styles.name}>{app.studentName}</div>
                    <div style={styles.sub}>{app.internshipType} • {app.collegeName}</div>
                  </div>
                  <div style={{textAlign: "right", marginRight: 20}}>
                    <div style={{fontSize: 12, color: "#666"}}>Last Posting</div>
                    <div style={{fontWeight: "bold", color: "#006400"}}>
                      {letters.length > 0 ? letters[letters.length-1].plant : "None"}
                    </div>
                  </div>
                  <button style={styles.expandBtn}>{isExpanded ? "▲" : "▼"}</button>
                </div>

                {/* Expanded Body */}
                {isExpanded && (
                  <div style={styles.body}>
                    
                    {/* Letter History */}
                    <div style={{marginBottom: 20}}>
                      <h4 style={styles.h4}>Posting History</h4>
                      {letters.length === 0 ? <p style={{fontStyle:"italic"}}>No letters yet.</p> : (
                        <table style={styles.table}>
                          <thead>
                            <tr style={{background: "#f9f9f9", textAlign:"left"}}>
                              <th style={styles.th}>Period</th>
                              <th style={styles.th}>Plant</th>
                              <th style={styles.th}>Date</th>
                              <th style={styles.th}>File</th>
                            </tr>
                          </thead>
                          <tbody>
                            {letters.map((l, i) => (
                              <tr key={i} style={{borderBottom: "1px solid #eee"}}>
                                <td style={styles.td}>{l.period}</td>
                                <td style={styles.td}>{l.plant}</td>
                                <td style={styles.td}>{l.issuedAt?.toDate ? l.issuedAt.toDate().toLocaleDateString() : "-"}</td>
                                <td style={styles.td}><a href={l.url} target="_blank" rel="noreferrer" style={styles.link}>View</a></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{display: "flex", gap: 10, justifyContent: "flex-end"}}>
                      <button 
                        onClick={() => openIssueModal(app)}
                        style={styles.btnSecondary}
                      >
                        ➕ Issue Next Letter
                      </button>
                      <button 
                        onClick={() => handleMarkCompleted(app)}
                        style={styles.btnDanger}
                        disabled={processing}
                      >
                        🏁 Mark Completed
                      </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL FOR ISSUING LETTER --- */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>Issue Posting Letter</h3>
            <p style={{marginBottom: 15, fontSize: 14}}>
              Student: <strong>{targetApp?.studentName}</strong>
            </p>
            
            <label style={styles.label}>Period (e.g. 1st Month / 2nd Month)</label>
            <input 
              style={styles.input} 
              value={formData.period} 
              onChange={e => setFormData({...formData, period: e.target.value})}
              placeholder="Enter duration period..."
            />

            <label style={styles.label}>Plant / Department</label>
            <input 
              style={styles.input} 
              value={formData.plant} 
              onChange={e => setFormData({...formData, plant: e.target.value})}
              placeholder="Allocated Plant..."
            />

            <label style={styles.label}>Upload Letter (Image/PDF)</label>
            <input 
              type="file" 
              style={styles.input} 
              onChange={e => setFormData({...formData, file: e.target.files[0]})}
            />

            <div style={{marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10}}>
              <button onClick={closeModal} style={styles.btnCancel}>Cancel</button>
              <button 
                onClick={handleIssueLetter} 
                disabled={uploading}
                style={styles.btnPrimary}
              >
                {uploading ? "Uploading..." : "Issue & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- STYLES ---
const styles = {
  sectionHeader: { fontSize: 18, fontWeight: "bold", color: "#444", marginBottom: 15, borderBottom: "2px solid #ddd", paddingBottom: 5 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 },
  card: { background: "#fff", borderRadius: 8, boxShadow: "0 2px 5px rgba(0,0,0,0.1)", overflow: "hidden" },
  name: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 4 },
  sub: { fontSize: 13, color: "#666", marginBottom: 10 },
  info: { fontSize: 13, color: "#444", marginBottom: 5 },
  
  btnPrimary: { width: "100%", padding: "10px", background: "#006400", color: "#fff", border: "none", borderRadius: 4, fontWeight: "bold", cursor: "pointer", marginTop: 10 },
  btnSecondary: { padding: "8px 16px", background: "#0d6efd", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" },
  btnDanger: { padding: "8px 16px", background: "#dc3545", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" },
  btnCancel: { padding: "10px 20px", background: "#6c757d", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" },

  empty: { padding: 20, background: "#f8f9fa", borderRadius: 8, color: "#666", fontStyle: "italic" },
  
  rowHeader: { padding: 20, display: "flex", alignItems: "center", cursor: "pointer" },
  expandBtn: { background: "none", border: "1px solid #ccc", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#555" },
  body: { padding: 20, background: "#f9f9f9", borderTop: "1px solid #eee" },
  h4: { marginTop: 0, marginBottom: 10, fontSize: 14, color: "#333", textTransform: "uppercase" },
  
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", fontSize: 13, marginBottom: 10 },
  th: { padding: 8, borderBottom: "1px solid #eee", color: "#555" },
  td: { padding: 8, borderBottom: "1px solid #eee" },
  link: { color: "#007bff", textDecoration: "none" },

  // Modal
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", width: 450, padding: 25, borderRadius: 8, boxShadow: "0 4px 15px rgba(0,0,0,0.2)" },
  label: { display: "block", fontSize: 13, fontWeight: "bold", marginBottom: 5, marginTop: 15 },
  input: { width: "100%", padding: 10, borderRadius: 4, border: "1px solid #ccc" }
};