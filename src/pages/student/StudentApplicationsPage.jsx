// src/pages/student/StudentApplicationsPage.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

import StudentApplicationList from "../../components/StudentApplicationList.jsx";
import StudentUploadCoverLetterModal from "../../components/StudentUploadCoverLetterModal.jsx";
import StudentApplyForm from "../../components/StudentApplyForm.jsx";

export default function StudentApplicationsPage() {
  const { user } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [uploadModalApp, setUploadModalApp] = useState(null);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [showApplyForm, setShowApplyForm] = useState(false);

  // ---------- Load applications for this student ----------
  async function loadApplications(uid) {
    if (!uid) {
      setApplications([]);
      return;
    }
    setLoading(true);
    try {
      const q = query(
        collection(db, "applications"),
        where("createdBy", "==", uid)
      );
      const snap = await getDocs(q);
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));

      items.sort((a, b) => {
        const ta = a.createdAt
          ? a.createdAt.toMillis
            ? a.createdAt.toMillis()
            : new Date(a.createdAt).getTime()
          : 0;
        const tb = b.createdAt
          ? b.createdAt.toMillis
            ? b.createdAt.toMillis()
            : new Date(b.createdAt).getTime()
          : 0;
        return tb - ta;
      });

      setApplications(items);
    } catch (err) {
      console.error("Failed to load applications:", err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  // ---------- Load student's basic profile ----------
  async function loadProfile(uid) {
    if (!uid) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        setProfile(snap.data());
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Failed to load profile for applications page:", err);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    loadApplications(user.uid);
    loadProfile(user.uid);
  }, [user]);

  if (!user) {
    return <div style={{ padding: 20 }}>No user logged in.</div>;
  }

  if (loading || profileLoading) {
    return <div style={{ padding: 20 }}>Loading applications...</div>;
  }

  // ----- Determine if student already has active or rejected application -----
  const hasActiveOrRejected = applications.some((app) => {
    const status = (app.status || "").toLowerCase();
    return [
      "pending",
      "pending_confirmation",
      "in_progress",
      "rejected",
    ].includes(status);
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>My Applications</h2>
      <p style={{ marginBottom: 16 }}>
        View your applications and upload cover letters. You can apply only if
        you have no active or rejected applications.
      </p>

      {/* APPLY BUTTON – only when no active/rejected app AND form not opened */}
      {!hasActiveOrRejected && !showApplyForm && (
        <div style={{ margin: "16px 0" }}>
          <button
            type="button"
            onClick={() => setShowApplyForm(true)}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: "#006400",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Apply for Internship / Training
          </button>
        </div>
      )}

      {/* If apply form is open, show it instead of application list */}
      {showApplyForm ? (
        <StudentApplyForm
          user={user}
          profile={profile}
          setShowApplyForm={setShowApplyForm}
          reload={loadApplications}
        />
      ) : (
        <>
          <StudentApplicationList
            applications={applications}
            setUploadModalApp={setUploadModalApp}
          />

          {uploadModalApp && (
            <StudentUploadCoverLetterModal
              app={uploadModalApp}
              user={user}
              onClose={() => setUploadModalApp(null)}
              onComplete={async () => {
                setUploadModalApp(null);
                if (user) await loadApplications(user.uid);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
