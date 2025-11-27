// src/pages/student/StudentApplicationsPage.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

import StudentApplicationList from "../../components/StudentApplicationList";
import StudentUploadCoverLetterModal from "../../components/StudentUploadCoverLetterModal";
import StudentUpdatePaymentModal from "../../components/StudentUpdatePaymentModal"; 
import StudentApplyForm from "../../components/StudentApplyForm";

export default function StudentApplicationsPage() {
  const { user } = useAuth();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  
  // --- MODAL STATES ---
  const [uploadModalApp, setUploadModalApp] = useState(null);
  const [paymentModalApp, setPaymentModalApp] = useState(null); // Must be defined!

  useEffect(() => {
    if (user) {
      loadData(user.uid);
    }
  }, [user]);

  async function loadData(uid) {
    setLoading(true);
    try {
      const pSnap = await getDoc(doc(db, "users", uid));
      setProfile(pSnap.exists() ? pSnap.data() : null);

      const q = query(collection(db, "applications"), where("createdBy", "==", uid));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      list.sort((a, b) => {
         const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
         const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
         return tB - tA;
      });

      setApplications(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{padding: 20}}>Loading...</div>;

  const hasActiveApplication = applications.some(app => {
    const s = (app.status || "").toLowerCase();
    return !["rejected", "completed", "cancelled"].includes(s);
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>My Applications</h2>

      {!showApplyForm && (
        <div style={{ marginBottom: 20 }}>
          {!hasActiveApplication ? (
            <button 
              onClick={() => setShowApplyForm(true)}
              style={styles.applyBtn}
            >
              Apply for Internship / Training
            </button>
          ) : (
            <div style={styles.warningBox}>
              You have an active application in progress.
            </div>
          )}
        </div>
      )}

      {showApplyForm ? (
        <StudentApplyForm 
          user={user}
          profile={profile}
          setShowApplyForm={setShowApplyForm}
          reload={loadData}
        />
      ) : (
        <>
          {applications.length === 0 ? (
            <p>No previous applications.</p>
          ) : (
            <StudentApplicationList 
              applications={applications} 
              setUploadModalApp={setUploadModalApp}
              setPaymentModalApp={setPaymentModalApp} // <--- CRITICAL: Pass the function
            />
          )}
        </>
      )}

      {/* --- MODALS --- */}
      {uploadModalApp && (
        <StudentUploadCoverLetterModal 
          app={uploadModalApp}
          user={user}
          onClose={() => setUploadModalApp(null)}
          onComplete={() => {
            setUploadModalApp(null);
            loadData(user.uid);
          }}
        />
      )}

      {paymentModalApp && (
        <StudentUpdatePaymentModal
          app={paymentModalApp}
          user={user}
          onClose={() => setPaymentModalApp(null)}
          onComplete={() => {
            setPaymentModalApp(null);
            loadData(user.uid);
          }}
        />
      )}
    </div>
  );
}

const styles = {
  applyBtn: {
    padding: "10px 20px",
    background: "#006400",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px"
  },
  warningBox: {
    padding: "10px 15px",
    background: "#fff3cd",
    border: "1px solid #ffeeba",
    color: "#856404",
    borderRadius: "6px"
  }
};