// src/pages/student/StudentCoverLetterPage.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import StudentInProgressApplicationCard from "../../components/StudentInProgressApplicationCard";
import StudentUploadCoverLetterModal from "../../components/StudentUploadCoverLetterModal";

export default function StudentCoverLetterPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalApp, setUploadModalApp] = useState(null);

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  async function loadApplications() {
    setLoading(true);
    try {
      // Fetch applications created by this user
      const q = query(
        collection(db, "applications"),
        where("createdBy", "==", user.uid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Sort by newest first
      list.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });

      setApplications(list);
    } catch (err) {
      console.error("Error loading applications:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Upload Recommendation Letters</h2>
      <p style={{ color: "#666", marginBottom: 20, marginTop: 10 }}>
        Upload or view the recommendation letters for your active applications.
      </p>

      {applications.length === 0 ? (
        <p>No applications found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {applications.map((app) => (
            <StudentInProgressApplicationCard
              key={app.id}
              app={app}
              setUploadModalApp={setUploadModalApp}
            />
          ))}
        </div>
      )}

      {/* --- UPLOAD MODAL --- */}
      {uploadModalApp && (
        <StudentUploadCoverLetterModal
          app={uploadModalApp}
          user={user}
          onClose={() => setUploadModalApp(null)}
          onComplete={() => {
            setUploadModalApp(null);
            loadApplications(); // Refresh list to show "View Letter" button
          }}
        />
      )}
    </div>
  );
}