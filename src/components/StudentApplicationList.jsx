// src/components/StudentApplicationList.jsx
import React, { useState } from "react";
import StudentApplicationDetailsModal from "./StudentApplicationDetailsModal";
import DataCard from "./common/UI/DataCard"; // Use reusable card
import { UI_STYLES } from "../utils/constants";

export default function StudentApplicationList({
  applications,
  setUploadModalApp,
  setPaymentModalApp
}) {
  const [viewDetailsApp, setViewDetailsApp] = useState(null);

  if (!applications || applications.length === 0) {
    return <div style={{ color: UI_STYLES.TEXT_MUTED }}>No applications found.</div>;
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {applications.map((app) => {
          const status = (app.status || "pending").toLowerCase();
          const payStatus = (app.paymentStatus || "pending").toLowerCase();

          const hasCoverLetter = !!app.coverLetterURL;
          // Show Payment Button if Approved AND (Payment Pending OR Rejected)
          const showPayBtn = status === "approved" && (payStatus === "pending" || payStatus === "rejected");

          return (
            <DataCard key={app.id} app={app} showPaymentStatus={true}>
              {/* Actions */}

              {/* 1. View Details */}
              <button
                onClick={() => setViewDetailsApp(app)}
                style={viewBtn}
              >
                👁️ View Full Details
              </button>

              {/* 2. Upload Cover Letter */}
              <button
                onClick={() => !hasCoverLetter && setUploadModalApp(app)}
                disabled={hasCoverLetter}
                style={hasCoverLetter ? disabledBtn : secondaryBtn}
              >
                {hasCoverLetter ? "Cover Letter Submitted" : "Upload Letter"}
              </button>

              {/* 3. Update Payment */}
              {showPayBtn && (
                <button
                  onClick={() => setPaymentModalApp(app)}
                  style={primaryBtn}
                >
                  {payStatus === "rejected" ? "Re-Upload Payment" : "Update Payment"}
                </button>
              )}
            </DataCard>
          );
        })}
      </div>

      {/* --- DETAILS MODAL --- */}
      {viewDetailsApp && (
        <StudentApplicationDetailsModal
          app={viewDetailsApp}
          onClose={() => setViewDetailsApp(null)}
        />
      )}
    </>
  );
}

// --- Button Styles (replicated from original for look) ---
const viewBtn = {
  padding: "8px 12px", background: "#e2e6ea", color: UI_STYLES.TEXT_MAIN, border: "1px solid #dae0e5", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: "600"
};

const secondaryBtn = {
  padding: "8px 12px", background: "#fff", color: UI_STYLES.SECONDARY_GRAY, border: `1px solid ${UI_STYLES.SECONDARY_GRAY}`, borderRadius: "4px", cursor: "pointer", fontSize: "13px"
};

const disabledBtn = {
  padding: "8px 12px", background: "#f2f2f2", color: "#aaa", border: "1px solid #ddd", borderRadius: "4px", cursor: "not-allowed", fontSize: "13px"
};

const primaryBtn = {
  padding: "8px 12px", background: UI_STYLES.PRIMARY_BLUE, color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: "bold"
};