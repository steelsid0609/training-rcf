import React from "react";
import ProfileSummarySection from "../components/student/ProfileSummarySection.jsx";
import ApplicationsSection from "../components/student/ApplicationsSection.jsx";
import ChangePasswordSection from "../components/student/ChangePasswordSection.jsx";

export default function StudentDashboard() {
  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>Student Dashboard</h1>

      {/* Top row: profile summary + quick change password */}
      <div
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "2.2fr 1.3fr",
          alignItems: "flex-start",
        }}
      >
        <div>
          <ProfileSummarySection />
        </div>

        <div>
          <div
            style={{
              background: "#fff",
              padding: 18,
              borderRadius: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            <ChangePasswordSection compact />
          </div>
        </div>
      </div>

      {/* Bottom: recent applications */}
      <div style={{ marginTop: 32 }}>
        <ApplicationsSection compact mode="all" />
      </div>
    </div>
  );
}
