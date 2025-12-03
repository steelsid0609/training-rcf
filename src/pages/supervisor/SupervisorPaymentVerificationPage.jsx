// src/pages/supervisor/SupervisorPaymentVerificationPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { useApplicationActions } from "../../hooks/useApplicationActions";
import DataCard from "../../components/common/UI/DataCard"; // Use reusable card
import { UI_STYLES } from "../../utils/constants";

export default function SupervisorPaymentVerificationPage() {
  const { user } = useAuth();
  const { verifyPayment, rejectPayment, working } = useApplicationActions(user);
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch ONLY applications that are "approved"
    const q = query(
      collection(db, "applications"),
      where("status", "==", "approved")
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Sort: Prioritize those who have submitted payment ("verification_pending")
      list.sort((a, b) => {
        const pA = a.paymentStatus === "verification_pending" ? 1 : 0;
        const pB = b.paymentStatus === "verification_pending" ? 1 : 0;
        if (pA !== pB) return pB - pA; // Show pending verifications first
        
        // Secondary sort by date
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA; // Newest first
      });

      setApplications(list);
      setLoading(false);
    }, (err) => {
        console.error("Error loading data:", err);
        toast.error("Failed to load applications.");
        setLoading(false);
    });

    return () => unsub();
  }, []);

  // --- ACTIONS ---

  async function handleVerify(appId) {
    if (!window.confirm("Confirm payment verification? This will move the application to the Final Confirmation stage.")) return;
    await verifyPayment(appId);
  }

  async function handleReject(appId) {
    const reason = prompt("Enter reason for payment rejection (Student will be asked to re-upload):");
    if (!reason) return;
    await rejectPayment(appId, reason);
  }

  if (loading) return <div style={{ padding: 30 }}>Loading payment data...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{ marginBottom: 20, color: UI_STYLES.TEXT_MAIN }}>Payment Verification</h2>
      <p style={{ marginBottom: 25, color: UI_STYLES.TEXT_MUTED }}>
        Review applications that have been initially approved and are awaiting payment verification.
      </p>
      
      {applications.length === 0 ? (
        <div style={styles.emptyBox}>
          No applications pending payment verification.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {applications.map((app) => {
            const hasPayment = app.paymentStatus === "verification_pending";
            const isRejected = app.paymentStatus === "rejected";
            
            // Customize the DataCard for this view
            return (
              <DataCard 
                key={app.id} 
                app={app} 
                showPaymentStatus={true} 
                borderStyle={`5px solid ${UI_STYLES.PRIMARY_BLUE}`}
              >
                <div style={styles.paymentDetails}>
                    {app.paymentReceiptNumber && (
                        <p style={styles.receiptNo}>
                            <strong>Receipt / Ref No:</strong> {app.paymentReceiptNumber}
                        </p>
                    )}
                    
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
                        <span style={styles.noReceiptText}>No Receipt Image Uploaded</span>
                    )}

                    {/* Action Buttons (Only if submitted) */}
                    {hasPayment && (
                        <div style={styles.actionButtons}>
                            <button 
                              onClick={() => handleReject(app.id)}
                              disabled={working}
                              style={styles.rejectBtn}
                            >
                                Reject
                            </button>
                            <button 
                              onClick={() => handleVerify(app.id)}
                              disabled={working}
                              style={styles.verifyBtn}
                            >
                                Verify & Proceed
                            </button>
                        </div>
                    )}

                    {!hasPayment && !isRejected && (
                      <div style={styles.waitingText}>
                        Waiting for student to upload payment details...
                      </div>
                    )}
                    
                    {isRejected && (
                      <div style={styles.rejectedText}>
                        Returned for Correction
                      </div>
                    )}
                </div>
              </DataCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const styles = {
  emptyBox: { 
    padding: 20, 
    background: "#f8f9fa", 
    borderRadius: UI_STYLES.BORDER_RADIUS, 
    color: UI_STYLES.TEXT_MUTED 
  },
  paymentDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minWidth: 200,
  },
  receiptNo: { 
    margin: "5px 0", 
    fontSize: "14px", 
    background: "#fff3cd", 
    padding: "5px", 
    display: "inline-block", 
    borderRadius: "4px" 
  },
  linkBtn: {
    textDecoration: "none",
    color: UI_STYLES.PRIMARY_BLUE,
    fontWeight: "600",
    fontSize: "14px",
    border: `1px solid ${UI_STYLES.PRIMARY_BLUE}`,
    padding: "6px 12px",
    borderRadius: "4px",
    textAlign: 'center'
  },
  noReceiptText: { 
    fontSize: "12px", 
    color: "#999" 
  },
  actionButtons: { 
    display: "flex", 
    gap: "10px", 
    marginTop: "10px" 
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
    background: UI_STYLES.DANGER_RED, // Red
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px"
  },
  waitingText: { 
    fontSize: "13px", 
    color: "#e65100", 
    fontStyle: "italic" 
  },
  rejectedText: { 
    fontSize: "13px", 
    color: UI_STYLES.DANGER_RED, 
    fontWeight: "bold" 
  }
};