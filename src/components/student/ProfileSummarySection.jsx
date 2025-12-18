// src/components/student/ProfileSummarySection.jsx
import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ProfileSummarySection() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const loadProfile = async () => {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setProfile(snap.data());
      };
      loadProfile();
    }
  }, [user]);

  const handleImageClick = () => {
    if (profile?.photoURL) {
      window.open(profile.photoURL, "_blank");
    }
  };

  return (
    <div style={{ background: "#fff", padding: 20, borderRadius: 8, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        {/* Profile Image */}
        <img
          src={profile?.photoURL || "https://via.placeholder.com/100"}
          alt="Profile"
          onClick={handleImageClick}
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "cover",
            cursor: "pointer",
            border: "2px solid #006400"
          }}
        />
        <div>
          <h2 style={{ margin: 0 }}>{profile?.fullname || "Student Name"}</h2>
          <p style={{ color: "#666", margin: "4px 0" }}>{user?.email}</p>
          <button 
            onClick={() => navigate("/student/basic-details")}
            style={{ marginTop: 10, padding: "5px 12px", background: "#006400", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}