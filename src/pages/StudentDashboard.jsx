import React from "react";
import ProfileSummarySection from "../components/student/ProfileSummarySection.jsx";
import ApplicationsSection from "../components/student/ApplicationsSection.jsx";

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
      </div>
    </div>
  );
}
