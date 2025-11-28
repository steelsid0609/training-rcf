import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function SupervisorDashboardPage() {
  const nav = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingApprovals: 0,
    paymentVerification: 0, 
    currentTrainees: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        // 1. Total Student Users (role == "student")
        const usersColl = collection(db, "users");
        const studentSnap = await getCountFromServer(query(usersColl, where("role", "==", "student")));
        
        // 2. Applications Collection Queries
        const appColl = collection(db, "applications");

        // 3. Pending Approvals (Status 'pending')
        const pendingSnap = await getCountFromServer(query(appColl, where("status", "==", "pending")));
        
        // 4. Payment Verification (Status is 'approved' AND paymentStatus is 'verification_pending')
        // Note: Using a single query to count 'approved' applications, as most of them will be pending payment/verification.
        // For simplicity and Firestore index considerations, we'll count all 'approved' and rely on the linked page to filter.
        const paymentSnap = await getCountFromServer(query(appColl, where("status", "==", "approved")));

        // 5. Current Trainees (Status 'in_progress')
        const currentTraineesSnap = await getCountFromServer(query(appColl, where("status", "==", "in_progress")));

        setStats({
          totalStudents: studentSnap.data().count,
          pendingApprovals: pendingSnap.data().count,
          paymentVerification: paymentSnap.data().count, // Represents applications awaiting payment or verification
          currentTrainees: currentTraineesSnap.data().count,
        });
      } catch (err) {
        console.error("Error loading stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading Dashboard...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Supervisor Dashboard</h2>
      <p style={{ color: "#666", marginBottom: 20 }}>Overview of student applications and users.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
        
        {/* Card 1: Pending Approvals */}
        <div 
          onClick={() => nav("/supervisor/applications/pending")}
          style={{ ...styles.card, borderLeft: "5px solid #ff9800", cursor: "pointer" }}
        >
          <div style={styles.title}>Pending Approvals</div>
          <div style={styles.count}>{stats.pendingApprovals}</div>
          <div style={styles.sub}>Applications awaiting initial review</div>
        </div>

        {/* Card 2: Payment Verification (Approved, waiting for action) */}
        <div 
          onClick={() => nav("/supervisor/applications/all")}
          style={{ ...styles.card, borderLeft: "5px solid #0d6efd", cursor: "pointer" }}
        >
          <div style={styles.title}>Payment Verification</div>
          <div style={styles.count}>{stats.paymentVerification}</div>
          <div style={styles.sub}>Applications awaiting payment status check</div>
        </div>

        {/* Card 3: Current Trainees */}
        <div 
          onClick={() => nav("/supervisor/current-trainees")}
          style={{ ...styles.card, borderLeft: "5px solid #198754", cursor: "pointer" }}
        >
          <div style={styles.title}>Current Trainees</div>
          <div style={styles.count}>{stats.currentTrainees}</div>
          <div style={styles.sub}>Students currently undergoing training</div>
        </div>

        {/* Card 4: Total Student Users */}
        <div 
          onClick={() => nav("/supervisor/users")}
          style={{ ...styles.card, borderLeft: "5px solid #6c757d", cursor: "pointer" }}
        >
          <div style={styles.title}>Total Student Users</div>
          <div style={styles.count}>{stats.totalStudents}</div>
          <div style={styles.sub}>Total registered student accounts</div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 8,
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    transition: "0.2s",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 10,
  },
  count: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#111",
  },
  sub: {
    fontSize: 13,
    color: "#888",
    marginTop: 5,
  }
};