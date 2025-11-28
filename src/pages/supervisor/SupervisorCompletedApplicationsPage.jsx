// src/pages/supervisor/SupervisorCompletedApplicationsPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  orderBy 
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

export default function SupervisorCompletedApplicationsPage() {
  const { user } = useAuth();
  
  // State buckets
  const [pendingStart, setPendingStart] = useState([]);
  const [ongoing, setOngoing] = useState([]);
  const [completed, setCompleted] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  // Toggle for history view
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch 'pending_confirmation' (Ready to Start), 'in_progress' (Ongoing), and 'completed'
      const q = query(
        collection(db, "applications"),
        where("status", "in", ["pending_confirmation", "in_progress", "completed"])
      );
      
      const snap = await getDocs(q);
      const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Sort by newest first
      allDocs.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });

      // Distribute into buckets
      const p = [];
      const o = [];
      const c = [];

      allDocs.forEach(app => {
        if (app.status === "pending_confirmation") p.push(app);
        else if (app.status === "in_progress") o.push(app);
        else if (app.status === "completed") c.push(app);
      });

      setPendingStart(p);
      setOngoing(o);
      setCompleted(c);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  // --- ACTION: Start Internship ---
  async function startInternship(app) {
    if (!window.confirm(`Confirm start of internship for ${app.studentName}?`)) return;
    
    setWorking(true);
    try {
      const ref = doc(db, "applications", app.id);
      await updateDoc(ref, {
        status: "in_progress",
        postingLetterIssued: true,
        internshipStartedBy: user.uid,
        internshipStartedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Internship Started! Moved to Ongoing list.");
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error starting internship: " + err.message);
    } finally {
      setWorking(false);
    }
  }

  // --- ACTION: Mark as Completed (End of Internship) ---
  async function completeInternship(app) {
    if (!window.confirm(`Mark internship as COMPLETED for ${app.studentName}? This cannot be undone.`)) return;
    
    setWorking(true);
    try {
      const ref = doc(db, "applications", app.id);
      await updateDoc(ref, {
        status: "completed",
        completedBy: user.uid,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Internship Marked as Completed.");
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error completing internship: " + err.message);
    } finally {
      setWorking(false);
    }
  }

  // --- ACTION: Reject (Send back to payment review) ---
  async function rejectConfirmation(app) {
    const reason = prompt("Enter rejection reason (Application will revert to 'Approved' status):");
    if (!reason) return;
    
    setWorking(true);
    try {
      const ref = doc(db, "applications", app.id);
      await updateDoc(ref, {
        status: "approved", // Revert to approved (payment verified) state logic
        paymentStatus: "rejected", // Force them to check payment again or re-verify
        confirmationRejectReason: reason,
        updatedAt: serverTimestamp()
      });
      toast.warn("Application returned to Payment Verification stage.");
      await loadData();
    } catch (err) {
      toast.error("Error rejecting: " + err.message);
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <div style={{padding: 30}}>Loading...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{marginBottom: 10, color: "#333"}}>Final Confirmation & Internship Management</h2>
      <p style={{color: "#666", marginBottom: 30}}>
        Manage the start and completion of student internships.
      </p>

      {/* --- SECTION 1: Ready to Start --- */}
      <div style={styles.sectionHeader}>
        📋 Ready for Posting Letter / Start ({pendingStart.length})
      </div>
      
      {pendingStart.length === 0 ? (
        <p style={styles.emptyText}>No applications waiting to start.</p>
      ) : (
        <div style={styles.grid}>
          {pendingStart.map(app => (
            <div key={app.id} style={{...styles.card, borderLeft: "5px solid #ff9800"}}>
              <div style={styles.cardContent}>
                <div>
                  <h3 style={styles.name}>{app.studentName}</h3>
                  <div style={styles.sub}>{app.internshipType}</div>
                  <div style={styles.detail}>College: {app.collegeName}</div>
                  <div style={styles.detail}>Payment: <span style={{color:"green"}}>Verified</span></div>
                </div>
                <div style={styles.actions}>
                  <button 
                    onClick={() => startInternship(app)} 
                    disabled={working}
                    style={styles.btnStart}
                  >
                    🚀 Issue Posting Letter & Start
                  </button>
                  <button 
                    onClick={() => rejectConfirmation(app)} 
                    disabled={working}
                    style={styles.btnReject}
                  >
                    ❌ Return
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <hr style={{margin: "40px 0", border: "0", borderTop: "1px solid #ddd"}} />

      {/* --- SECTION 2: Ongoing Internships --- */}
      <div style={styles.sectionHeader}>
        ⏳ Ongoing Internships ({ongoing.length})
      </div>

      {ongoing.length === 0 ? (
        <p style={styles.emptyText}>No interns currently training.</p>
      ) : (
        <div style={styles.grid}>
          {ongoing.map(app => (
            <div key={app.id} style={{...styles.card, borderLeft: "5px solid #007bff"}}>
              <div style={styles.cardContent}>
                <div>
                  <h3 style={styles.name}>{app.studentName}</h3>
                  <div style={styles.sub}>{app.internshipType}</div>
                  <div style={styles.detail}>Started: {app.internshipStartedAt?.toDate ? app.internshipStartedAt.toDate().toLocaleDateString() : "Recently"}</div>
                  <div style={styles.detail}>
                    Duration: {app.durationDetails?.value} {app.durationDetails?.type}
                  </div>
                </div>
                <div style={styles.actions}>
                  <button 
                    onClick={() => completeInternship(app)} 
                    disabled={working}
                    style={styles.btnComplete}
                  >
                    ✅ Mark as Completed
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <hr style={{margin: "40px 0", border: "0", borderTop: "1px solid #ddd"}} />

      {/* --- SECTION 3: Completed History --- */}
      <div 
        style={{...styles.sectionHeader, cursor: "pointer", display: "flex", alignItems: "center"}}
        onClick={() => setShowHistory(!showHistory)}
      >
        <span>🏁 Completed History ({completed.length})</span>
        <span style={{fontSize: "14px", marginLeft: "10px", color: "#007bff"}}>
          {showHistory ? "(Hide)" : "(Show)"}
        </span>
      </div>

      {showHistory && (
        <div style={styles.grid}>
          {completed.map(app => (
            <div key={app.id} style={{...styles.card, borderLeft: "5px solid #198754", opacity: 0.8}}>
              <div style={styles.cardContent}>
                <div>
                  <h3 style={styles.name}>{app.studentName}</h3>
                  <div style={styles.sub}>{app.internshipType}</div>
                  <div style={{fontSize: "12px", color: "green", fontWeight: "bold", marginTop: 5}}>
                    COMPLETED on {app.completedAt?.toDate ? app.completedAt.toDate().toLocaleDateString() : "-"}
                  </div>
                </div>
                <div style={{textAlign: "right"}}>
                  <span style={styles.badge}>DONE</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const styles = {
  sectionHeader: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#444",
    marginBottom: "15px",
    background: "#f1f1f1",
    padding: "8px 12px",
    borderRadius: "6px"
  },
  emptyText: {
    color: "#888",
    fontStyle: "italic",
    marginBottom: "20px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "20px",
    marginBottom: "20px"
  },
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    transition: "transform 0.2s"
  },
  cardContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px"
  },
  name: {
    margin: "0 0 5px 0",
    fontSize: "16px",
    color: "#333"
  },
  sub: {
    fontSize: "13px",
    color: "#666",
    fontWeight: "600",
    marginBottom: "5px"
  },
  detail: {
    fontSize: "13px",
    color: "#555"
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "140px"
  },
  btnStart: {
    padding: "8px",
    background: "#006400",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold"
  },
  btnComplete: {
    padding: "8px",
    background: "#0d6efd",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold"
  },
  btnReject: {
    padding: "6px",
    background: "#fff",
    color: "#dc3545",
    border: "1px solid #dc3545",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px"
  },
  badge: {
    background: "#d4edda",
    color: "#155724",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold"
  }
};