// src/pages/supervisor/SupervisorCompletedApplicationsPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

export default function SupervisorCompletedApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => { loadConfirmationApps(); }, []);

  async function loadConfirmationApps() {
    setLoading(true);
    try {
      // Fetch 'pending_confirmation' and 'completed'
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
      await loadConfirmationApps();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  }

  async function rejectConfirmation(app) {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;
    setWorking(true);
    try {
      await updateDoc(doc(db, "applications", app.id), {
        status: "accepted", // Send back to accepted step
        finalConfirmationNumber: null,
        confirmationRejectReason: reason
      });
      toast.warn("Confirmation rejected.");
      await loadConfirmationApps();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Final Confirmation & Completion</h2>
      {applications.map(app => (
        <div key={app.id} style={{ background: "#fff", padding: 18, marginBottom: 12, borderRadius: 10, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
             <div>
                <h3>{app.studentName}</h3>
                <p>Confirmation No: <strong>{app.finalConfirmationNumber || "N/A"}</strong></p>
             </div>
             <div>
               <span style={{ fontWeight: "bold", color: app.status === "completed" ? "green" : "blue" }}>
                 {app.status === "completed" ? "Completed" : "Reviewing"}
               </span>
             </div>
          </div>

          {app.status === "pending_confirmation" && (
            <div style={{ marginTop: 15, display: "flex", gap: 10 }}>
              <button onClick={() => completeInternship(app)} disabled={working} style={{ padding: "8px 15px", background: "#006400", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}>
                 Verify & Complete
              </button>
              <button onClick={() => rejectConfirmation(app)} disabled={working} style={{ padding: "8px 15px", background: "#dc3545", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}>
                 Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}