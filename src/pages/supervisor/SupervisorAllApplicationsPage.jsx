// src/pages/supervisor/SupervisorAllApplicationsPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

export default function SupervisorAllApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  
  // Local state for the inputs
  const [reasons, setReasons] = useState({}); 
  const [statusUpdates, setStatusUpdates] = useState({});

  useEffect(() => { loadPaymentApps(); }, []);

  async function loadPaymentApps() {
    setLoading(true);
    try {
      // Get apps that are either approved (waiting for payment) or accepted (payment done)
      const q = query(
        collection(db, "applications"),
        where("status", "in", ["approved", "accepted"]),
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

  async function updatePayment(app) {
    const newStatus = statusUpdates[app.id] || app.paymentStatus || "pending";
    const reason = reasons[app.id] || "";

    if (newStatus === "rejected" && !reason.trim()) return toast.error("Rejection reason required");
    
    setWorking(true);
    try {
      const payload = {
        paymentStatus: newStatus,
        paymentRejectReason: "",
        status: "approved" // Default back to approved
      };

      if (newStatus === "verified") {
        payload.paymentVerifiedBy = user.uid;
        payload.paymentVerifiedAt = serverTimestamp();
        payload.status = "accepted"; // Move to next stage
      } else if (newStatus === "rejected") {
        payload.paymentRejectReason = reason;
        payload.paymentReceiptNumber = null; // Clear receipt
      }

      await updateDoc(doc(db, "applications", app.id), payload);
      toast.success("Payment updated");
      await loadPaymentApps();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Payment Verification</h2>
      {applications.map(app => (
        <div key={app.id} style={{ background: app.status === "accepted" ? "#f0fff0" : "#fff", padding: 18, marginBottom: 12, borderRadius: 10, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
          <div style={{ fontWeight: "bold" }}>{app.studentName}</div>
          <div style={{ fontSize: 14 }}>Receipt: {app.paymentReceiptNumber || "Not uploaded yet"}</div>
          
          {app.status !== "accepted" ? (
             <div style={{ marginTop: 10 }}>
               <select 
                 value={statusUpdates[app.id] || app.paymentStatus || "pending"} 
                 onChange={(e) => setStatusUpdates({...statusUpdates, [app.id]: e.target.value})}
                 style={{ padding: 8, marginRight: 10 }}
               >
                 <option value="pending">Pending</option>
                 <option value="verified">Verified</option>
                 <option value="rejected">Rejected</option>
               </select>
               
               {(statusUpdates[app.id] === "rejected") && (
                 <input 
                   placeholder="Rejection Reason" 
                   value={reasons[app.id] || ""}
                   onChange={(e) => setReasons({...reasons, [app.id]: e.target.value})}
                   style={{ padding: 8, marginRight: 10 }}
                 />
               )}
               
               <button onClick={() => updatePayment(app)} disabled={working} style={{ padding: "8px 12px", background: "#006400", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer"}}>Update</button>
             </div>
          ) : (
            <div style={{ color: "green", fontWeight: "bold", marginTop: 5 }}>✅ Payment Verified</div>
          )}
        </div>
      ))}
    </div>
  );
}