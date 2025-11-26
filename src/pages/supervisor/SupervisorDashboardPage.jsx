import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function SupervisorDashboardPage() {
  const nav = useNavigate();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0, // Waiting for payment
    confirmation: 0, // Waiting for final confirmation
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const coll = collection(db, "applications");

        // 1. Pending Approvals
        const pendingSnap = await getCountFromServer(query(coll, where("status", "==", "pending")));
        
        // 2. Pending Payment (Status is 'approved' or 'accepted' but usually we check approved for payment pending)
        // Adjust logic based on your exact workflow. usually 'approved' means waiting for payment.
        const paymentSnap = await getCountFromServer(query(coll, where("status", "==", "approved")));

        // 3. Pending Confirmation (Status 'pending_confirmation')
        const confirmSnap = await getCountFromServer(query(coll, where("status", "==", "pending_confirmation")));

        setStats({
          pending: pendingSnap.data().count,
          approved: paymentSnap.data().count,
          confirmation: confirmSnap.data().count,
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
      <p style={{ color: "#666", marginBottom: 20 }}>Overview of student applications.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
        
        {/* Card 1: Pending Approvals */}
        <div 
          onClick={() => nav("/supervisor/applications/pending")}
          style={{ ...styles.card, borderLeft: "5px solid #ff9800", cursor: "pointer" }}
        >
          <div style={styles.title}>Pending Approvals</div>
          <div style={styles.count}>{stats.pending}</div>
          <div style={styles.sub}>Students waiting for initial review</div>
        </div>

        {/* Card 2: Payment Verification */}
        <div 
          onClick={() => nav("/supervisor/applications/all")}
          style={{ ...styles.card, borderLeft: "5px solid #0d6efd", cursor: "pointer" }}
        >
          <div style={styles.title}>Payment Verification</div>
          <div style={styles.count}>{stats.approved}</div>
          <div style={styles.sub}>Students waiting for payment check</div>
        </div>

        {/* Card 3: Final Confirmation */}
        <div 
          onClick={() => nav("/supervisor/applications/completed")}
          style={{ ...styles.card, borderLeft: "5px solid #198754", cursor: "pointer" }}
        >
          <div style={styles.title}>Final Confirmation</div>
          <div style={styles.count}>{stats.confirmation}</div>
          <div style={styles.sub}>Waiting for appointment letter</div>
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