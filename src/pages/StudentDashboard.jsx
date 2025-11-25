// src/pages/StudentDashboard.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut, sendPasswordResetEmail } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import logo from "../assets/transparent-logo.png";

import BasicInfoForm from "../components/StudentBasicDetailsForm.jsx";
import ApplyForm from "../components/StudentApplyForm.jsx";

import StudentUploadCoverLetterModal from "../components/StudentUploadCoverLetterModal.jsx";
import StudentEditProfile from "../components/StudentEditProfile.jsx";
import StudentInProgressApplicationCard from "../components/StudentInProgressApplicationCard.jsx";
import StudentApplicationList from "../components/StudentApplicationList.jsx";

// -------------------- Local styles --------------------
const wrap = {
  position: "fixed",
  inset: 0,
  display: "flex",
  width: "100vw",
  height: "100vh",
  overflow: "hidden",
};

const leftPane = {
  flex: "0 0 20%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  paddingTop: 20,
  background: "linear-gradient(180deg, #b7e4b7, #d3f0c2)",
};

const leftHeading = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#006400",
  textAlign: "center",
  marginTop: 10,
  lineHeight: "1.3",
};

const rightPane = {
  flex: "0 0 80%",
  background: "#ffffff",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  overflowY: "auto",
  overflowX: "hidden",
  height: "100vh",
};

const profileCard = {
  background: "#fff",
  width: "85%",
  marginTop: 30,
  padding: 15,
  borderRadius: 10,
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  textAlign: "center",
};

const sideBtn = {
  display: "block",
  width: "100%",
  padding: "10px 0",
  marginTop: 10,
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  color: "white",
  fontWeight: 600,
  transition: "0.2s",
};

const applyBtn = {
  background: "#006400",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "10px 18px",
  cursor: "pointer",
  fontWeight: 600,
};
// ------------------------------------------------------

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applications, setApplications] = useState([]);
  const [showBasicForm, setShowBasicForm] = useState(false);
  const [uploadModalApp, setUploadModalApp] = useState(null);

  const nav = useNavigate();

  // ---------- loadApplications ----------
  async function loadApplications(uid) {
    if (!uid) {
      setApplications([]);
      return;
    }
    try {
      const q = query(
        collection(db, "applications"),
        where("createdBy", "==", uid)
      );
      const snap = await getDocs(q);
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));

      // sort by createdAt desc if available
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
      toast.error(
        "Failed to load your applications. See console for details."
      );
      setApplications([]);
    }
  }

  // ---------- handleLogout ----------
  async function handleLogout() {
    try {
      await signOut(auth);
      localStorage.removeItem("rcf_id_token");
      localStorage.removeItem("rcf_user_role");
      nav("/login");
    } catch (err) {
      console.error("Sign out failed:", err);
      toast.error("Sign out failed");
    }
  }

  // ---------- handleChangePassword ----------
  async function handleChangePassword() {
    try {
      const u = auth.currentUser;
      if (!u || !u.email) {
        toast.error("No email available for this account.");
        return;
      }
      await sendPasswordResetEmail(auth, u.email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      });
      toast.success("Password reset email sent. Check inbox/spam.");
    } catch (err) {
      console.error("Failed sending password reset:", err);
      toast.error("Failed to send password reset email.");
    }
  }

  // ---------- bootstrap: load user and profile ----------
  useEffect(() => {
    let mounted = true;

    const unsub = auth.onAuthStateChanged(async (u) => {
      try {
        if (!u) {
          nav("/login");
          return;
        }
        if (!mounted) return;

        setUser(u);

        // load user profile
        try {
          const userRef = doc(db, "users", u.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            setProfile(data);

            if (!data.fullName || !data.phone || !data.pincode) {
              setShowBasicForm(true);
            } else {
              setShowBasicForm(false);
            }
          } else {
            setProfile(null);
            setShowBasicForm(true);
          }
        } catch (err) {
          console.error("Failed to read user profile:", err);
          setProfile(null);
          setShowBasicForm(true);
        }

        await loadApplications(u.uid);
      } catch (err) {
        console.error("Error in dashboard bootstrap:", err);
        toast.error(
          "Error loading dashboard: " + (err.message || err.code || err)
        );
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  if (loading) return <div style={{ padding: 20 }}>Loading dashboard...</div>;

  const activeApp = applications.find((app) => {
    const s = app.status?.toLowerCase();
    return (
      s === "pending" ||
      s === "approved" ||
      s === "accepted" ||
      s === "pending_confirmation"
    );
  });

  const hasActiveApp = !!activeApp;

  const inactiveApplications = applications.filter((app) => {
    const s = app.status?.toLowerCase();
    const isActive =
      s === "pending" ||
      s === "approved" ||
      s === "accepted" ||
      s === "pending_confirmation";

    return !isActive || (app.coverLetterRequested && !app.coverLetterURL);
  });

  return (
    <div style={wrap}>
      {/* LEFT SIDEBAR */}
      <div style={leftPane}>
        <div style={{ textAlign: "center", padding: "20px 10px" }}>
          <img src={logo} alt="RCF Logo" style={{ width: 80, height: 80 }} />
          <h2 style={leftHeading}>
            Rashtriya Chemical and Fertilizer Limited
          </h2>
        </div>
        <div style={profileCard}>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "20px",
              marginBottom: 5,
            }}
          >
            {profile?.fullName || "Student"}
          </div>
          <div style={{ fontSize: 14, color: "#333" }}>{user?.email}</div>
          {profile?.discipline && (
            <div
              style={{
                fontSize: 14,
                color: "#444",
                marginTop: 6,
                fontWeight: "bold",
              }}
            >
              🎓 {profile.discipline}
            </div>
          )}
          {profile?.phone && (
            <div style={{ fontSize: 14, color: "#555", marginTop: 4 }}>
              📞 {profile.phone}
            </div>
          )}
          {profile?.state && (
            <div style={{ fontSize: 13, color: "#777", marginTop: 4 }}>
              {profile.state}
            </div>
          )}
          <hr style={{ marginTop: 16 }} />
          <button
            onClick={() => setShowEdit(true)}
            style={{ ...sideBtn, background: "#198754" }}
          >
            ✏️ Edit Profile
          </button>
          <button
            onClick={handleChangePassword}
            style={{ ...sideBtn, background: "#0d6efd" }}
          >
            🔒 Change Password
          </button>
          <button
            onClick={handleLogout}
            style={{ ...sideBtn, background: "#dc3545" }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* RIGHT CONTENT */}
      <div style={rightPane}>
        <div style={{ padding: "30px 50px" }}>
          {showBasicForm ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "30px",
              }}
            >
              {/* Basic Details Form (Left Card) */}
              <BasicInfoForm
                user={user}
                existingProfile={profile}
                onCompleted={async () => {
                  try {
                    const snap = await getDoc(doc(db, "users", user.uid));
                    if (snap.exists()) setProfile(snap.data());
                    setShowBasicForm(false);
                    await loadApplications(user.uid);
                  } catch (err) {
                    console.error(
                      "Failed reloading profile after basic form:",
                      err
                    );
                  }
                }}
              />

              {/* Apply Form (Right Card) */}
              <ApplyForm
                user={user}
                profile={profile}
                setShowApplyForm={() => {}}
                reload={loadApplications}
              />
            </div>
          ) : showEdit ? (
            <StudentEditProfile
              user={user}
              profile={profile}
              setShowEdit={setShowEdit}
              onSaved={async () => {
                try {
                  const snap = await getDoc(doc(db, "users", user.uid));
                  if (snap.exists()) setProfile(snap.data());
                } catch (err) {
                  console.error("Error refreshing profile after save:", err);
                }
              }}
            />
          ) : hasActiveApp ? (
            <StudentInProgressApplicationCard
              app={activeApp}
              user={user}
              reloadApplications={() => loadApplications(user.uid)}
              setUploadModalApp={setUploadModalApp}
            />
          ) : (
            <>
              <h2 style={{ color: "#333" }}>
                Hey,{" "}
                <span style={{ color: "#006400" }}>
                  {profile?.fullName || "Student"}
                </span>
              </h2>
              <p>Welcome to Dashboard</p>

              <button
                onClick={() => setShowApplyForm(true)}
                style={applyBtn}
              >
                ➕ Apply
              </button>

              {showApplyForm && (
                <ApplyForm
                  user={user}
                  profile={profile}
                  setShowApplyForm={setShowApplyForm}
                  reload={loadApplications}
                />
              )}

              <StudentApplicationList
                applications={inactiveApplications}
                setUploadModalApp={setUploadModalApp}
              />
            </>
          )}
        </div>
      </div>

      {/* Upload modal */}
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
    </div>
  );
}
