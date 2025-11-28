// src/pages/admin/AdminCompletedApplicationsPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

export default function AdminCompletedApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const q = query(
        collection(db, "applications"),
        where("status", "in", ["pending_confirmation", "completed"]),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  async function completeInternship(app) {
    if (!window.confirm("Mark internship as Completed?")) return;
    setWorking(true);
    try {
      await updateDoc(doc(db, "applications", app.id), {
        status: "completed",
        completedBy: user.uid,
        completedAt: serverTimestamp()
      });
      toast.success("Marked as Completed");
      await loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  }

  async function rejectConfirmation(app) {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    setWorking(true);
    try {
      await updateDoc(doc(db, "applications", app.id), {
        status: "approved", // Revert to approved (payment verified) state
        confirmationRejectReason: reason
      });
      toast.warn("Confirmation rejected.");
      await loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <div style={{padding:30}}>Loading...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{marginBottom: 20}}>Completed / Final Confirmation</h2>
      {applications.length === 0 && <p>No records found.</p>}
      
      {applications.map(app => (
        <div key={app.id} style={{ background: "#fff", padding: 20, marginBottom: 15, borderRadius: 8, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
             <div>
                <h3 style={{margin: "0 0 5px 0"}}>{app.studentName}</h3>
                <p style={{margin:0, color: "#666"}}>{app.internshipType} | {app.collegeName}</p>
                <p style={{marginTop: 8, fontSize: 14}}>
                   <strong>Confirmation No:</strong> {app.finalConfirmationNumber || app.confirmationNumber || "N/A"}
                </p>
             </div>
             
             <div style={{textAlign: "right"}}>
               <span style={{ 
                 fontWeight: "bold", 
                 padding: "5px 10px", 
                 borderRadius: 15,
                 background: app.status === "completed" ? "#d4edda" : "#fff3cd",
                 color: app.status === "completed" ? "#155724" : "#856404"
               }}>
                 {app.status === "completed" ? "COMPLETED" : "PENDING REVIEW"}
               </span>
             </div>
          </div>

          {app.status === "pending_confirmation" && (
            <div style={{ marginTop: 15, display: "flex", gap: 10 }}>
              <button 
                onClick={() => completeInternship(app)} 
                disabled={working} 
                style={{ padding: "8px 15px", background: "#28a745", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}
              >
                 ✅ Verify & Complete
              </button>
              <button 
                onClick={() => rejectConfirmation(app)} 
                disabled={working} 
                style={{ padding: "8px 15px", background: "#dc3545", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}
              >
                 ❌ Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}