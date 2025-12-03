import React from "react";
import { useApplicationActions } from "../../hooks/useApplicationActions";

export default function PaymentActionCard({ app, user }) {
  const { verifyPayment, rejectPayment, working } = useApplicationActions(user);

  const handleReject = () => {
    const reason = prompt("Enter payment rejection reason:");
    if (reason) rejectPayment(app.id, reason);
  };

  const statusColor = app.paymentStatus === "verification_pending" ? "#e65100" : "#28a745";

  return (
    <div style={{ background: "#fff", padding: 20, borderRadius: 8, boxShadow: "0 2px 5px rgba(0,0,0,0.1)", borderLeft: `5px solid ${statusColor}`, marginBottom: 15 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h4 style={{ margin: "0 0 5px 0" }}>{app.studentName}</h4>
          <div style={{ fontSize: 13, color: "#666" }}>{app.internshipType} | {app.email}</div>
          
          <div style={{ marginTop: 10, fontSize: 14 }}>
            <strong>Receipt No:</strong> {app.paymentReceiptNumber || "N/A"}
          </div>
        </div>

        <div style={{ textAlign: "right", minWidth: 200 }}>
          {/* View Receipt */}
          {app.paymentReceiptURL ? (
            <a href={app.paymentReceiptURL} target="_blank" rel="noreferrer" style={{ display: "block", marginBottom: 10, color: "#007bff", textDecoration: "none", fontWeight: "600" }}>
              📄 View Receipt
            </a>
          ) : <div style={{ marginBottom: 10, color: "#999" }}>No Receipt Image</div>}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button 
              onClick={handleReject} 
              disabled={working}
              style={{ padding: "6px 12px", background: "#dc3545", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
            >
              Reject
            </button>
            <button 
              onClick={() => verifyPayment(app.id)} 
              disabled={working}
              style={{ padding: "6px 12px", background: "#198754", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
            >
              Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}