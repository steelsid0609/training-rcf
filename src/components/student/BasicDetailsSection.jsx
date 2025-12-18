// src/components/student/BasicDetailsSection.jsx
import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import StudentBasicDetailsForm from "../StudentBasicDetailsForm.jsx";

export default function BasicDetailsSection({ compact = false }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setProfile(snap.data());
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  if (!user) return <p>No user logged in.</p>;
  if (loading) return <p>Loading basic details...</p>;

  return (
    <div>
      {compact && <h3>Basic Details</h3>}
      <StudentBasicDetailsForm
        user={user}
        existingProfile={profile}
        onCompleted={async () => {
          try {
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists()) setProfile(snap.data());
          } catch (err) {
            console.error("Error refreshing profile:", err);
          }
        }}
      />
    </div>
  );
}
