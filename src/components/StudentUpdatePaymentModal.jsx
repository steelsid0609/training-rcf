// src/components/StudentUpdatePaymentModal.jsx
import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

export default function StudentUpdatePaymentModal({
  app,
  user,
  onClose,
  onComplete,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState("");

  async function handleSubmit() {
    // 1. Basic Validation
    if (!receiptNumber.trim()) {
      return toast.warn("Please enter the Receipt Number / Transaction ID.");
    }

    setSubmitting(true);

    try {
      // 2. Update Firestore
      const ref = doc(db, "applications", app.id);
      await updateDoc(ref, {
        paymentReceiptNumber: receiptNumber.trim(),
        paymentStatus: "verification_pending", // Supervisor will see this
        paymentSubmittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Payment details updated successfully!");
      if (onComplete) await onComplete();
      
    } catch (err) {
      console.error(err);
      toast.error("Error: " + err.message);
    } finally {
      setSubmitting(false);
      if (onClose) onClose();
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        left: 0, top: 0, right: 0, bottom: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
      }}
    >
      <div style={{ width: 450, background: "#fff", padding: 30, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
        <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>Update Payment Details</h3>
        
        <p style={{ fontSize: 14, color: "#555", marginBottom: 20 }}>
          Please enter the transaction ID or Receipt Number for your <strong>{app.internshipType}</strong> application payment.
        </p>
        
        <div style={{ marginBottom: 25 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
            Receipt Number / Transaction ID:
          </label>
          <input
            type="text"
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.target.value)}
            placeholder="e.g. UPI-123456789 or REF-98765"
            style={{ 
              width: "100%", 
              padding: "12px", 
              border: "1px solid #ccc", 
              borderRadius: 4,
              fontSize: "15px"
            }}
          />
        </div>

        <div style={{ textAlign: "right", display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{ 
              padding: "10px 20px", 
              background: "#6c757d", 
              color: "#fff", 
              border: "none", 
              borderRadius: 6, 
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ 
              padding: "10px 20px", 
              background: "#007bff", 
              color: "#fff", 
              border: "none", 
              borderRadius: 6, 
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          >
            {submitting ? "Saving..." : "Submit Details"}
          </button>
        </div>
      </div>
    </div>
  );
}