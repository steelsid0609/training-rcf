// src/pages/admin/AdminPendingApplicationsPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { 
  collection, query, where, getDocs, doc, updateDoc, serverTimestamp 
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import ApplicationsView from "../../components/admin/ApplicationsView";

export default function AdminPendingApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [slotsMap, setSlotsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Fetch Pending Applications
      const appQuery = query(
        collection(db, "applications"),
        where("status", "==", "pending") 
      );
      
      // 2. Fetch Training Slots
      const slotQuery = query(collection(db, "trainingSlots"));

      const [appSnap, slotSnap] = await Promise.all([
        getDocs(appQuery),
        getDocs(slotQuery)
      ]);

      const apps = appSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // Sort: Newest First
      apps.sort((a, b) => {
         const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
         const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
         return tB - tA;
      });

      const sMap = {};
      slotSnap.forEach(doc => {
        sMap[doc.id] = doc.data().label;
      });

      setApplications(apps);
      setSlotsMap(sMap);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // --- ACTIONS ---

  async function handleApprove(app) {
    if (!window.confirm(`Approve application for ${app.studentName}?`)) return;
    setWorking(true);
    try {
      const ref = doc(db, "applications", app.id);
      await updateDoc(ref, {
        status: "approved",
        approvedBy: user.uid,
        approvedAt: serverTimestamp(),
      });
      toast.success("Application Approved");
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve");
    } finally {
      setWorking(false);
    }
  }

  async function handleReject(app) {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    setWorking(true);
    try {
      const ref = doc(db, "applications", app.id);
      await updateDoc(ref, {
        status: "rejected",
        rejectedBy: user.uid,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason
      });
      toast.info("Application Rejected");
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject");
    } finally {
      setWorking(false);
    }
  }

  const styles = {
    card: { background: "#fff", padding: "20px", marginBottom: "16px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.08)" },
    applyBtn: { padding: "8px 16px", border: "none", borderRadius: "4px", background: "#28a745", color: "#fff", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  };

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{ marginBottom: 20, color: "#333" }}>Pending Applications</h2>
      <ApplicationsView
        applications={applications}
        slotsMap={slotsMap}
        onApprove={handleApprove}
        onReject={handleReject}
        working={working}
        styles={styles}
      />
    </div>
  );
}