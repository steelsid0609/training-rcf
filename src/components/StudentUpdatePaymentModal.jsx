// src/components/StudentUpdatePaymentModal.jsx
import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import Modal from "./common/UI/Modal"; // Use reusable modal
import { UI_STYLES } from "../utils/constants";

export default function StudentUpdatePaymentModal({
  app,
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
    }
  }

  return (
    <Modal title="Update Payment Details" onClose={onClose} maxWidth={450}>
      <p style={{ fontSize: 14, color: "#555", marginBottom: 20 }}>
        Please enter the transaction ID or Receipt Number for your <strong>{app.internshipType}</strong> application payment.
      </p>
      
      <div style={{ marginBottom: 25 }}>
        <label style={formStyles.label}>
          Receipt Number / Transaction ID:
        </label>
        <input
          type="text"
          value={receiptNumber}
          onChange={(e) => setReceiptNumber(e.target.value)}
          placeholder="e.g. UPI-123456789 or REF-98765"
          style={formStyles.input}
        />
      </div>

      <div style={formStyles.footer}>
        <button
          onClick={onClose}
          disabled={submitting}
          style={formStyles.cancelBtn}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={formStyles.submitBtn}
        >
          {submitting ? "Saving..." : "Submit Details"}
        </button>
      </div>
    </Modal>
  );
}

// --- Styles for Form Consistency ---
const formStyles = {
  label: { 
    display: "block", 
    marginBottom: 8, 
    fontWeight: 600, 
    fontSize: 14 
  },
  input: { 
    width: "100%", 
    padding: "12px", 
    border: "1px solid #ccc", 
    borderRadius: 4,
    fontSize: "15px"
  },
  footer: { 
    textAlign: "right", 
    display: 'flex', 
    justifyContent: 'flex-end', 
    gap: 12 
  },
  cancelBtn: { 
    padding: "10px 20px", 
    background: UI_STYLES.SECONDARY_GRAY, 
    color: "#fff", 
    border: "none", 
    borderRadius: 6, 
    cursor: "pointer",
    fontSize: "14px"
  },
  submitBtn: { 
    padding: "10px 20px", 
    background: UI_STYLES.PRIMARY_BLUE, 
    color: "#fff", 
    border: "none", 
    borderRadius: 6, 
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold"
  }
}