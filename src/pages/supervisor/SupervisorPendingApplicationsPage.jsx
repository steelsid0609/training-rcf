// src/pages/supervisor/SupervisorPendingApplicationsPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase.js";
import { 
  collection, query, where, doc, updateDoc, serverTimestamp, onSnapshot, increment 
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import ApplicationsView from "../../components/common/ApplicationListView.jsx";
// Import the new modal
import ActualDatesConfirmationModal from "../../components/supervisor/ActualDatesConfirmationModal.jsx"; 


export default function SupervisorPendingApplicationsPage() {
  const { user } = useAuth();
  
  const [applications, setApplications] = useState([]);
  const [slotsList, setSlotsList] = useState([]);
  const [slotsMap, setSlotsMap] = useState({});
  const [slotCounts, setSlotCounts] = useState({});
  const [selectedSlot, setSelectedSlot] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for modal control - holds the app being finalized
  const [appToFinalize, setAppToFinalize] = useState(null); 
  
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    // 1. Listener for Pending Applications
    const pendingQuery = query(collection(db, "applications"), where("status", "==", "pending"));
    const unsubPending = onSnapshot(pendingQuery, (snap) => {
      const pendingApps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      pendingApps.sort((a, b) => {
         const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
         const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
         return tB - tA; // Newest first
      });
      setApplications(pendingApps);
      setLoading(false);
    }, (err) => {
      console.error(err);
      toast.error("Error syncing pending applications");
    });

    // 2. Listener for Training Slots (Reads applicationCount)
    const unsubSlots = onSnapshot(collection(db, "trainingSlots"), (snap) => {
      const sMap = {};
      const counts = {}; 
      let allSlots = [];
      
      snap.forEach(doc => {
        const d = doc.data();
        sMap[doc.id] = d.label;
        // Read the persisted applicationCount
        counts[doc.id] = d.applicationCount || 0; 
        allSlots.push({ id: doc.id, ...d });
      });

      const today = new Date().toISOString().split('T')[0];
      
      const pastSlots = allSlots
        .filter(s => s.startDate < today)
        .sort((a, b) => b.startDate.localeCompare(a.startDate))
        .slice(0, 2);

      const futureSlots = allSlots
        .filter(s => s.startDate >= today && s.isActive !== false)
        .sort((a, b) => a.startDate.localeCompare(b.startDate));

      setSlotsMap(sMap);
      setSlotCounts(counts); 
      setSlotsList([...pastSlots.reverse(), ...futureSlots]);
    });

    return () => {
      unsubPending();
      unsubSlots();
    };
  }, []);

  /**
   * UPDATED: Handler to link application slot clicks to the occupancy monitor
   */
  const handleSlotClick = (slotId) => {
    if (slotId) {
      setSelectedSlot(slotId);
      // Optional: Scroll back to top so user sees the updated occupancy bar
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // handleApprove: Accepts final form data from modal
  async function handleApprove(app, finalFormData) {
    const newSlotId = finalFormData.slotId;

    setWorking(true);
    try {
      const appRef = doc(db, "applications", app.id);
      
      // 1. Update Application Status, Actual Dates, and Slot ID
      await updateDoc(appRef, {
        status: "approved",
        approvedBy: user.uid,
        approvedAt: serverTimestamp(),
        actualStartDate: finalFormData.actualStartDate,
        actualEndDate: finalFormData.actualEndDate,
        durationDetails: {
            ...app.durationDetails,
            slotId: newSlotId
        },
      });
      
      // 2. Update Slot Count
      if (newSlotId) {
        const newSlotRef = doc(db, "trainingSlots", newSlotId);
        await updateDoc(newSlotRef, {
          applicationCount: increment(1)
        });
      }
      
      toast.success("Application Approved & Dates Finalized ✅");
      
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve: " + err.message);
    } finally {
      setWorking(false);
      setAppToFinalize(null);
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
      toast.info("Application Rejected ❌");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject");
    } finally {
      setWorking(false);
    }
  }
  
  const openFinalizeModal = (app) => {
      setAppToFinalize(app);
  };

  // --- STYLES ---
  const styles = {
    card: { background: "#fff", padding: "20px", marginBottom: "16px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.08)" },
    applyBtn: { padding: "8px 16px", border: "none", borderRadius: "4px", background: "#28a745", color: "#fff", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
    monitorBar: { background: "#e3f2fd", border: "1px solid #90caf9", padding: "15px", borderRadius: "8px", marginBottom: "25px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" },
    selectInput: { padding: "8px", borderRadius: "4px", border: "1px solid #ccc", minWidth: "250px" },
    countDisplay: { padding: "8px 15px", background: "#fff", border: "1px solid #ccc", borderRadius: "4px", fontWeight: "bold", width: "80px", textAlign: "center", color: "#006400" }
  };

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{ marginBottom: 20, color: "#333" }}>Pending Applications</h2>
      
      {/* --- SLOT MONITOR SECTION --- */}
      <div style={styles.monitorBar}>
        <div>
          <strong style={{marginRight: 10, color: "#0d47a1"}}>Check Slot Occupancy:</strong>
          <select value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)} style={styles.selectInput}>
            <option value="">-- Select a Slot --</option>
            {slotsList.map(s => (
              <option key={s.id} value={s.id}>{s.label} (Starts: {s.startDate})</option>
            ))}
          </select>
        </div>
        <div style={{display: "flex", alignItems: "center", gap: 10}}>
          <span style={{fontSize: "14px", color: "#555"}}>Approved Count:</span>
          <input readOnly value={selectedSlot ? (slotCounts[selectedSlot] || 0) : "-"} style={styles.countDisplay} />
        </div>
      </div>

      <ApplicationsView
        applications={applications}
        slotsMap={slotsMap} 
        onApprove={openFinalizeModal}
        onReject={handleReject}
        // ADDED PROP HERE: Links the click in the list to the state above
        onSlotClick={handleSlotClick}
        working={working}
        styles={styles}
      />
      
      {/* --- RENDER MODAL --- */}
      {appToFinalize && (
          <ActualDatesConfirmationModal
              app={appToFinalize}
              slotsList={slotsList}
              slotsMap={slotsMap}
              onClose={() => setAppToFinalize(null)}
              onApprove={handleApprove}
          />
      )}
    </div>
  );
}