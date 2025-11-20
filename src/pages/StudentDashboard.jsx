// src/pages/StudentDashboard.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut, sendPasswordResetEmail } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import logo from "../assets/transparent-logo.png";
import BasicInfoForm from "../components/StudentBasicDetailsForm.jsx";
import ApplyForm from "../components/StudentApplyForm.jsx";

// Cloudinary Config
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function StudentDashboard() { 
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applications, setApplications] = useState([]);
  // showBasicForm = true when required fields (name, phone, pincode) are missing
  const [showBasicForm, setShowBasicForm] = useState(false); 
  const [uploadModalApp, setUploadModalApp] = useState(null);
  const nav = useNavigate();

  // ... (useEffect to load user and profile remains the same)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      try {
        if (!u) {
          nav("/");
          return;
        }
        setUser(u);

        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setProfile(data);

          // Check if essential fields are missing
          if (!data.fullName || !data.phone || !data.pincode) {
            setShowBasicForm(true); // <--- Flag to show basic + apply forms
          } else {
            setShowBasicForm(false);
          }
        } else {
          setProfile(null);
          setShowBasicForm(true); // <--- First time login
        }

        await loadApplications(u.uid);
      } catch (err) {
        console.error("Error in dashboard bootstrap:", err);
        toast.error("Error loading dashboard: " + (err.message || err.code || err));
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [nav]);

  // ... (useEffect for cover letter, loadApplications, handleLogout, handleChangePassword remain the same)

  if (loading) return <div>Loading dashboard...</div>;

  const activeApp = applications.find(
    (app) =>
      app.status?.toLowerCase() === "pending" ||
      app.status?.toLowerCase() === "approved" ||
      app.status?.toLowerCase() === "accepted" ||
      app.status?.toLowerCase() === "pending_confirmation"
  );
  const hasActiveApp = !!activeApp;

  const inactiveApplications = applications.filter((app) => {
    const isActive =
      app.status?.toLowerCase() === "pending" ||
      app.status?.toLowerCase() === "approved" ||
      app.status?.toLowerCase() === "accepted" ||
      app.status?.toLowerCase() === "pending_confirmation";
    if (!isActive) return true;
    if (app.coverLetterRequested && !app.coverLetterURL) return true;
    return false;
  });
return (
    <div style={wrap}>
      {/* LEFT SIDEBAR (No changes) */}
      <div style={leftPane}>
        {/* ... (Left pane content remains the same) ... */}
        <div style={{ textAlign: "center", padding: "20px 10px" }}>
          <img src={logo} alt="RCF Logo" style={{ width: 80, height: 80 }} />
          <h2 style={leftHeading}>Rashtriya Chemical and Fertilizer Limited</h2>
        </div>
        <div style={profileCard}>
          <div style={{ fontWeight: "bold", fontSize: "20px", marginBottom: 5 }}>
            {profile?.fullName || "Student"}
          </div>
          <div style={{ fontSize: 14, color: "#333" }}>{user?.email}</div>
          {profile?.discipline && (
            <div style={{ fontSize: 14, color: "#444", marginTop: 6, fontWeight: "bold" }}>
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
          <hr style={{ marginTop: 30 }} />
          <button onClick={() => setShowEdit(true)} style={{ ...sideBtn, background: "#198754" }}>
            ✏️ Edit Profile
          </button>
          <button onClick={handleChangePassword} style={{ ...sideBtn, background: "#0d6efd" }}>
            🔒 Change Password
          </button>
          <button onClick={handleLogout} style={{ ...sideBtn, background: "#dc3545" }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* RIGHT CONTENT (NEW RENDER LOGIC) */}
      <div style={rightPane}>
        <div style={{ padding: "30px 50px" }}>

          {showBasicForm ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {/* Basic Details Form (Left Card) */}
                <BasicInfoForm
                  user={user}
                  existingProfile={profile}
                  onCompleted={async () => {
                    // Reload profile data after saving basic info
                    const snap = await getDoc(doc(db, "users", user.uid));
                    if (snap.exists()) setProfile(snap.data());
                    setShowBasicForm(false); // Hide the combined setup view
                  }}
                />

                {/* Apply Form (Right Card) */}
                <ApplyForm
                  user={user}
                  profile={profile}
                  setShowApplyForm={() => { /* Apply form should not control state here */ }}
                  reload={loadApplications}
                />
            </div>
          ) : showEdit ? (
            <EditProfile
              user={user}
              profile={profile}
              setShowEdit={setShowEdit}
              onSaved={async () => {
                const snap = await getDoc(doc(db, "users", user.uid));
                if (snap.exists()) setProfile(snap.data());
              }}
            />
          ) : hasActiveApp ? (
            <InProgressApplicationCard
              app={activeApp}
              user={user}
              reloadApplications={() => loadApplications(user.uid)}
              setUploadModalApp={setUploadModalApp}
            />
          ) : (
            <>
              <h2 style={{ color: "#333" }}>
                Hey, <span style={{ color: "#006400" }}>{profile?.fullName}</span>
              </h2>
              <p>Welcome to Dashboard</p>

              <button onClick={() => setShowApplyForm(true)} style={applyBtn}>
                ➕ Apply
              </button>
              
              {/* This is redundant, but keeps the original code structure */}
              {showApplyForm && (
                <ApplyForm
                  user={user}
                  profile={profile}
                  setShowApplyForm={setShowApplyForm}
                  reload={loadApplications}
                />
              )}
              
              <ApplicationList
                applications={inactiveApplications}
                setUploadModalApp={setUploadModalApp}
              />
            </>
          )}
        </div>
      </div>

      {/* --- Render the upload modal if an app is selected (No Change) --- */}
      {uploadModalApp && (
        <UploadCoverLetterModal
          app={uploadModalApp}
          user={user}
          onClose={() => setUploadModalApp(null)}
          onComplete={() => {
            setUploadModalApp(null);
            loadApplications(user.uid);
          }}
        />
      )}
    </div>
  );
}