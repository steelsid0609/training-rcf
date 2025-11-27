import React, { useEffect, useState } from "react";
import { db } from "../../firebase"; 
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { toast } from "react-toastify";
import ApplicationsView from "../../components/admin/ApplicationsView"; 

export default function SupervisorRejectedApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [slotsMap, setSlotsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Fetch Rejected Applications
      const appQuery = query(
        collection(db, "applications"),
        where("status", "==", "rejected")
      );

      // 2. Fetch Slots for labels
      const slotQuery = query(collection(db, "trainingSlots"));

      const [appSnap, slotSnap] = await Promise.all([
        getDocs(appQuery),
        getDocs(slotQuery),
      ]);

      // Process Applications
      const apps = appSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // Sort by Rejection Date (newest first) or Created Date
      apps.sort((a, b) => {
        const tA = a.rejectedAt?.toMillis ? a.rejectedAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
        const tB = b.rejectedAt?.toMillis ? b.rejectedAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
        return tB - tA;
      });

      // Process Slots Map
      const sMap = {};
      slotSnap.forEach((d) => {
        sMap[d.id] = d.data().label;
      });

      setApplications(apps);
      setSlotsMap(sMap);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load rejected applications");
    } finally {
      setLoading(false);
    }
  }

  // Styles specifically for Rejected View
  const styles = {
    card: {
      background: "#fff",
      padding: "20px",
      marginBottom: "16px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
      borderLeft: "5px solid #dc3545" // Red accent for rejected
    },
    applyBtn: {
      display: "none", // No actions available on this page
    },
  };

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{ marginBottom: 20, color: "#dc3545" }}>Rejected Applications Archive</h2>
      <ApplicationsView
        applications={applications}
        slotsMap={slotsMap}
        styles={styles}
        // No onApprove/onReject passed, so buttons won't render
      />
    </div>
  );
}