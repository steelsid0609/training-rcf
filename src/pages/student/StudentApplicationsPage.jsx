import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase.js"; // Fixed import
import { useAuth } from "../../context/AuthContext.jsx"; // Fixed import

import StudentApplicationList from "../../components/StudentApplicationList.jsx";
import StudentUploadCoverLetterModal from "../../components/StudentUploadCoverLetterModal.jsx";
import StudentUpdatePaymentModal from "../../components/StudentUpdatePaymentModal.jsx"; 
import StudentApplyForm from "../../components/StudentApplyForm.jsx";

export default function StudentApplicationsPage() {
  const { user } = useAuth();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  
  // --- MODAL STATES ---
  const [uploadModalApp, setUploadModalApp] = useState(null);
  const [paymentModalApp, setPaymentModalApp] = useState(null);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch Profile (Once is usually enough, but real-time is safer)
    getDoc(doc(db, "users", user.uid)).then(snap => {
      setProfile(snap.exists() ? snap.data() : null);
    });

    // 2. Real-time Listen to Applications
    const q = query(collection(db, "applications"), where("createdBy", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      list.sort((a, b) => {
         const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
         const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
         return tB - tA; // Newest first
      });

      setApplications(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to applications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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
          // Reload is handled automatically by onSnapshot now
        />
      ) : (
        <>
          {applications.length === 0 ? (
            <p>No previous applications.</p>
          ) : (
            <StudentApplicationList 
              applications={applications} 
              setUploadModalApp={setUploadModalApp}
              setPaymentModalApp={setPaymentModalApp} 
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
          onComplete={() => setUploadModalApp(null)}
        />
      )}

      {paymentModalApp && (
        <StudentUpdatePaymentModal
          app={paymentModalApp}
          user={user}
          onClose={() => setPaymentModalApp(null)}
          onComplete={() => setPaymentModalApp(null)}
        />
      )}
    </div>
  );
}

const styles = {
  applyBtn: { padding: "10px 20px", background: "#006400", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" },
  warningBox: { padding: "10px 15px", background: "#fff3cd", border: "1px solid #ffeeba", color: "#856404", borderRadius: "6px" }
};