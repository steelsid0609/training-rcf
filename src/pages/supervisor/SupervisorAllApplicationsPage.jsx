// src/pages/supervisor/SupervisorAllApplicationsPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

export default function SupervisorPaymentVerificationPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch ONLY applications that are "approved" (Stage 1 cleared)
      // These are the ones waiting for payment or having submitted payment
      const q = query(
        collection(db, "applications"),
        where("status", "==", "approved")
      );
      
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Sort: Prioritize those who have submitted payment ("verification_pending")
      // Then by newest created
      list.sort((a, b) => {
        const pA = a.paymentStatus === "verification_pending" ? 1 : 0;
        const pB = b.paymentStatus === "verification_pending" ? 1 : 0;
        if (pA !== pB) return pB - pA; // Show pending verifications first
        
        // Secondary sort by date
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });

      setApplications(list);
    } catch (err) {
      console.error("Error loading data:", err);
      toast.error("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }

  // --- ACTIONS ---

  async function handleVerifyPayment(app) {
    if (!window.confirm("Confirm payment verification? This will move the application to the Final Confirmation stage.")) return;
    
    setWorking(true);
    try {
      const ref = doc(db, "applications", app.id);
      await updateDoc(ref, {
        paymentStatus: "verified",
        status: "pending_confirmation", // Move to next stage
        paymentVerifiedBy: user.uid,
        paymentVerifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Payment Verified! Application moved to Final Confirmation.");
      await loadData(); // Refresh list
    } catch (err) {
      console.error(err);
      toast.error("Failed to verify payment: " + err.message);
    } finally {
      setWorking(false);
    }
  }

  async function handleRejectPayment(app) {
    const reason = prompt("Enter reason for payment rejection (Student will be asked to re-upload):");
    if (!reason) return;

    setWorking(true);
    try {
      const ref = doc(db, "applications", app.id);
      await updateDoc(ref, {
        paymentStatus: "rejected",
        paymentRejectReason: reason,
        // We keep status as "approved" so they stay in this stage to re-upload
        updatedAt: serverTimestamp()
      });
      toast.info("Payment Rejected. Student notified to re-upload.");
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject payment: " + err.message);
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <div style={{ padding: 30 }}>Loading payment data...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{ marginBottom: 20, color: "#333" }}>Payment Verification</h2>
      <p style={{ marginBottom: 25, color: "#666" }}>
        Review payment details below.
      </p>
      
      {applications.length === 0 ? (
        <div style={{ padding: 20, background: "#f8f9fa", borderRadius: 8, color: "#666" }}>
          No applications pending payment verification.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {applications.map((app) => {
            const hasPayment = app.paymentStatus === "verification_pending";
            const isRejected = app.paymentStatus === "rejected";
            
            return (
              <div key={app.id} style={styles.card}>
                <div style={styles.header}>
                  <div>
                    <h3 style={{ margin: "0 0 5px 0", color: "#006400" }}>{app.studentName}</h3>
                    <div style={{ fontSize: "13px", color: "#555" }}>
                      {app.internshipType} | {app.email}
                    </div>
                  </div>
                  <div style={styles.badge(app.paymentStatus)}>
                    {app.paymentStatus ? app.paymentStatus.toUpperCase().replace("_", " ") : "PAYMENT PENDING"}
                  </div>
                </div>

                <div style={styles.body}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "5px 0", fontSize: "14px" }}>
                      <strong>College:</strong> {app.collegeName}
                    </p>
                    <p style={{ margin: "5px 0", fontSize: "14px" }}>
                      <strong>Duration:</strong> {app.durationDetails?.value} {app.durationDetails?.type}
                    </p>
                    {app.paymentReceiptNumber && (
                      <p style={{ margin: "5px 0", fontSize: "14px", background: "#fff3cd", padding: "5px", display: "inline-block", borderRadius: "4px" }}>
                        <strong>Receipt / Ref No:</strong> {app.paymentReceiptNumber}
                      </p>
                    )}
                  </div>

                  {/* Payment Actions / View */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end", minWidth: "200px" }}>
                    
                    {/* View Receipt Link */}
                    {app.paymentReceiptURL ? (
                      <a 
                        href={app.paymentReceiptURL} 
                        target="_blank" 
                        rel="noreferrer"
                        style={styles.linkBtn}
                      >
                        📄 View Receipt Image
                      </a>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#999" }}>No Receipt Image Uploaded</span>
                    )}

                    {/* Action Buttons (Only if submitted) */}
                    {hasPayment && (
                      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button 
                          onClick={() => handleRejectPayment(app)}
                          disabled={working}
                          style={styles.rejectBtn}
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleVerifyPayment(app)}
                          disabled={working}
                          style={styles.verifyBtn}
                        >
                          Verify & Proceed
                        </button>
                      </div>
                    )}

                    {!hasPayment && !isRejected && (
                      <div style={{ fontSize: "13px", color: "#e65100", fontStyle: "italic" }}>
                        Waiting for student to upload payment details...
                      </div>
                    )}
                    
                    {isRejected && (
                      <div style={{ fontSize: "13px", color: "#dc3545", fontWeight: "bold" }}>
                        Returned for Correction
                      </div>
                    )}

                  </div>
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
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    borderLeft: "5px solid #0d6efd" // Blue accent for Verification
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
    marginBottom: "15px"
  },
  body: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: "20px"
  },
  badge: (status) => {
    let bg = "#eee", col = "#555";
    if (status === "verification_pending") { bg = "#fff3cd"; col = "#856404"; }
    else if (status === "verified") { bg = "#d4edda"; col = "#155724"; }
    else if (status === "rejected") { bg = "#f8d7da"; col = "#721c24"; }
    
    return {
      background: bg,
      color: col,
      padding: "4px 10px",
      borderRadius: "12px",
      fontSize: "11px",
      fontWeight: "bold",
      letterSpacing: "0.5px"
    };
  },
  linkBtn: {
    textDecoration: "none",
    color: "#0d6efd",
    fontWeight: "600",
    fontSize: "14px",
    border: "1px solid #0d6efd",
    padding: "6px 12px",
    borderRadius: "4px",
    transition: "0.2s"
  },
  verifyBtn: {
    padding: "8px 16px",
    background: "#198754", // Green
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px"
  },
  rejectBtn: {
    padding: "8px 16px",
    background: "#dc3545", // Red
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px"
  }
};