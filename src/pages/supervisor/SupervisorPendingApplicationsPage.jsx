import React, { useEffect, useState } from "react";
import { db } from "../../firebase.js"; // Fixed import
import { 
  collection, query, where, doc, updateDoc, serverTimestamp, onSnapshot 
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx"; // Fixed import
import ApplicationsView from "../../components/admin/ApplicationsView.jsx"; // Fixed import

export default function SupervisorPendingApplicationsPage() {
  const { user } = useAuth();
  
  const [applications, setApplications] = useState([]);
  const [slotsList, setSlotsList] = useState([]);
  const [slotsMap, setSlotsMap] = useState({});
  const [slotCounts, setSlotCounts] = useState({});
  const [selectedSlot, setSelectedSlot] = useState("");
  
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

    // 2. Listener for Approved Applications (for Slot Counts)
    const approvedQuery = query(collection(db, "applications"), where("status", "==", "approved"));
    const unsubApproved = onSnapshot(approvedQuery, (snap) => {
      const counts = {};
      snap.forEach(doc => {
        const d = doc.data();
        if (d.durationDetails && d.durationDetails.slotId) {
          const sid = d.durationDetails.slotId;
          counts[sid] = (counts[sid] || 0) + 1;
        }
      });
      setSlotCounts(counts);
    });

    // 3. Listener for Training Slots
    const unsubSlots = onSnapshot(collection(db, "trainingSlots"), (snap) => {
      const sMap = {};
      let allSlots = [];
      snap.forEach(doc => {
        const d = doc.data();
        sMap[doc.id] = d.label;
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
      setSlotsList([...pastSlots.reverse(), ...futureSlots]);
    });

    return () => {
      unsubPending();
      unsubApproved();
      unsubSlots();
    };
  }, []);

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
      toast.success("Application Approved ✅");
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
      toast.info("Application Rejected ❌");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject");
    } finally {
      setWorking(false);
    }
  }

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
        onApprove={handleApprove}
        onReject={handleReject}
        working={working}
        styles={styles}
      />
    </div>
  );
}