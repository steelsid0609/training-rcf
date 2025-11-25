// src/components/student/ProfileSummarySection.jsx
import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ProfileSummarySection() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Failed to load profile summary:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  if (!user) {
    return <p>No user logged in.</p>;
  }

  if (loading) {
    return <p>Loading profile...</p>;
  }

  const card = {
    background: "#fff",
    padding: 18,
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  };

  if (!profile) {
    return (
      <div style={card}>
        <h2>Welcome, {user.email}</h2>
        <p style={{ marginBottom: 12 }}>
          Your basic details are not completed yet.
        </p>
        <button
          onClick={() => navigate("/student/basic-details")}
          style={{
            background: "#006400",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 14px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Complete Basic Details
        </button>
      </div>
    );
  }

  return (
    <div style={card}>
      <h2 style={{ marginBottom: 4 }}>{profile.fullname || "Student"}</h2>
      <div style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
        {profile.discipline && <span>{profile.discipline}</span>}
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>Email:</strong> {profile.email || user.email}
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>Mobile:</strong> {profile.phone || "Not provided"}
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>Address:</strong>{" "}
        {profile.addressLine
          ? `${profile.addressLine}, `
          : ""}
        {profile.city || ""} {profile.state || ""}{" "}
        {profile.pincode ? `(${profile.pincode})` : ""}
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => navigate("/student/basic-details")}
          style={{
            background: "#006400",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "6px 12px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Edit Basic Details
        </button>
      </div>
    </div>
  );
}
