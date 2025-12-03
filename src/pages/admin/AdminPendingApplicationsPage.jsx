import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import ApplicationsView from "../../components/admin/ApplicationsView";
import ActualDatesConfirmationModal from "../../components/supervisor/ActualDatesConfirmationModal";
import { useApplicationActions } from "../../hooks/useApplicationActions";

export default function AdminPendingApplicationsPage() {
  const { user } = useAuth();
  // Using the new shared logic hook
  const { approveApplication, rejectApplication, working } = useApplicationActions(user);
  
  const [applications, setApplications] = useState([]);
  const [slotsList, setSlotsList] = useState([]);
  const [slotsMap, setSlotsMap] = useState({});
  const [loading, setLoading] = useState(true);
  
  // State to control the Approval Modal
  const [appToApprove, setAppToApprove] = useState(null);

  useEffect(() => {
    // 1. Fetch Pending Apps
    const q = query(collection(db, "applications"), where("status", "==", "pending"));
    const unsubApps = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort by newest
      list.sort((a, b) => {
         const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
         const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
         return tB - tA;
      });

      setApplications(list);
      setLoading(false);
    });

    // 2. Fetch Slots (Needed for Modal drop-downs)
    const unsubSlots = onSnapshot(collection(db, "trainingSlots"), (snap) => {
      const list = [];
      const map = {};
      snap.forEach(d => {
        const data = { id: d.id, ...d.data() };
        list.push(data);
        map[d.id] = data.label;
      });
      setSlotsList(list);
      setSlotsMap(map);
    });

    return () => { unsubApps(); unsubSlots(); };
  }, []);

  const handleApproveClick = (app) => {
    setAppToApprove(app); // Opens the modal
  };

  const handleConfirmApprove = async (app, finalData) => {
    // Call the hook logic
    await approveApplication(app, finalData);
    setAppToApprove(null); // Close modal
  };

  const handleRejectClick = (app) => {
    const reason = prompt("Enter Rejection Reason:");
    if(reason) rejectApplication(app.id, reason);
  };

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{ marginBottom: 20, color: "#333" }}>Pending Applications (Admin)</h2>
      
      <ApplicationsView
        applications={applications}
        slotsMap={slotsMap}
        onApprove={handleApproveClick} 
        onReject={handleRejectClick}
        working={working}
        styles={{
          card: { background: "#fff", padding: 20, marginBottom: 15, borderRadius: 8, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" },
          applyBtn: { padding: "8px 16px", borderRadius: 4, border: "none", cursor: "pointer", color: "#fff", background: "#006400", fontWeight: "600", fontSize: "14px" }
        }}
      />

      {/* Confirmation Modal - Shared with Supervisor logic */}
      {appToApprove && (
        <ActualDatesConfirmationModal
          app={appToApprove}
          slotsList={slotsList}
          slotsMap={slotsMap}
          onClose={() => setAppToApprove(null)}
          onApprove={handleConfirmApprove}
        />
      )}
    </div>
  );
}