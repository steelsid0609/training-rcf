import React from "react";
import { useApplicationActions } from "../../hooks/useApplicationActions";

export default function PaymentVerificationCard({ app, user }) {
  const { verifyPayment, rejectApplication, working } = useApplicationActions(user);

  const handleReject = () => {
    const reason = prompt("Enter payment rejection reason:");
    if (reason) rejectApplication(app.id, reason); // Or handle specific payment rejection logic
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: 15, borderRadius: 8, background: "#fff", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h4>{app.studentName}</h4>
          <p style={{ margin: 0, fontSize: 13, color: "#666" }}>{app.email}</p>
          <div style={{ marginTop: 5 }}>
            Receipt: <strong>{app.paymentReceiptNumber || "N/A"}</strong>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          {app.paymentReceiptURL && (
            <a href={app.paymentReceiptURL} target="_blank" style={{ display: "block", marginBottom: 10, color: "#007bff" }}>View Receipt</a>
          )}
          <div style={{ display: "flex", gap: 5 }}>
            <button 
              onClick={handleReject} 
              disabled={working}
              style={{ background: "#dc3545", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 4, cursor: "pointer" }}
            >
              Reject
            </button>
            <button 
              onClick={() => verifyPayment(app.id)} 
              disabled={working}
              style={{ background: "#198754", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 4, cursor: "pointer" }}
            >
              Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}