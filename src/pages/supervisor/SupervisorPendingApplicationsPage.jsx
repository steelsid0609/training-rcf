// src/pages/supervisor/SupervisorPendingApplicationsPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase"; // Note the ../.. for folder depth
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

// --- Helper Components from your old code ---
function DetailRow({ label, value }) {
  return (
    <div style={{ margin: "4px 0" }}>
      <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 14, color: "#111", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

export default function SupervisorPendingApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    loadPendingApps();
  }, []);

  async function loadPendingApps() {
    setLoading(true);
    try {
      // Filter for status == 'pending'
      const q = query(
        collection(db, "applications"),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pending applications");
    } finally {
      setLoading(false);
    }
  }

  // --- Actions ---
  async function supervisorApprove(app) {
    if (!window.confirm("Approve this application?")) return;
    setWorking(true);
    try {
      await updateDoc(doc(db, "applications", app.id), { 
        status: "approved", 
        approvedBy: user.uid, 
        approvedAt: serverTimestamp() 
      });
      toast.success("Application approved.");
      await loadPendingApps(); // Refresh list
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setWorking(false);
    }
  }

  async function supervisorReject(app) {
    if (!window.confirm("Reject this application?")) return;
    setWorking(true);
    try {
      await updateDoc(doc(db, "applications", app.id), { 
        status: "rejected", 
        rejectedBy: user.uid, 
        rejectedAt: serverTimestamp() 
      });
      toast.info("Application rejected.");
      await loadPendingApps();
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setWorking(false);
    }
  }

  async function supervisorRequestCoverLetter(app) {
    setWorking(true);
    try {
      await updateDoc(doc(db, "applications", app.id), { coverLetterRequested: true });
      toast.success("Request sent.");
      await loadPendingApps();
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setWorking(false);
    }
  }

  // Helper for dates
  function formatDate(raw) {
    if (!raw) return "-";
    try {
        if (raw?.toDate) return raw.toDate().toLocaleString();
        return new Date(raw).toLocaleString();
    } catch(e) { return String(raw); }
  }

  if (loading) return <div>Loading pending applications...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Pending Applications</h2>
      {applications.length === 0 ? <p>No pending applications.</p> : (
        applications.map(app => (
          <div key={app.id} style={styles.card}>
             <div 
               style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}
               onClick={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)}
             >
                <div>
                   <div style={{ fontWeight: 700, fontSize: 17 }}>{app.studentName || "Applicant"}</div>
                   <div>{app.college?.name || app.collegeName || "Unknown College"}</div>
                </div>
                <div style={{textAlign:"right"}}>
                   <span style={{ fontWeight: "bold", color: "#ff9800" }}>Pending Approval</span>
                </div>
             </div>

             {expandedAppId === app.id && (
               <div style={{ marginTop: 15, paddingTop: 15, borderTop: "1px solid #eee" }}>
                  <DetailRow label="Discipline" value={app.internshipType || app.discipline} />
                  <DetailRow label="Dates" value={`${formatDate(app.startDate)} - ${formatDate(app.endDate)}`} />
                  
                  {app.coverLetterURL ? (
                    <a href={app.coverLetterURL} target="_blank" rel="noreferrer" style={{...styles.btn, background:"#17a2b8"}}>View Cover Letter</a>
                  ) : (
                    <button onClick={() => supervisorRequestCoverLetter(app)} style={{...styles.btn, background:"#ff9800"}} disabled={working}>Request Cover Letter</button>
                  )}

                  <div style={{ marginTop: 15, display: "flex", gap: 10 }}>
                     <button onClick={() => supervisorApprove(app)} style={styles.btn} disabled={working}>Approve</button>
                     <button onClick={() => supervisorReject(app)} style={{...styles.btn, background:"#dc3545"}} disabled={working}>Reject</button>
                  </div>
               </div>
             )}
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  card: { background: "#fff", padding: 18, marginBottom: 12, borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  btn: { padding: "8px 14px", border: "none", borderRadius: 6, color: "#fff", background: "#006400", cursor: "pointer", fontWeight: 600 }
};