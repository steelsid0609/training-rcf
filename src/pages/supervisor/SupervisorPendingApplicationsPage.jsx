// src/pages/supervisor/SupervisorPendingApplicationsPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import ApplicationsView from "../../components/admin/ApplicationsView";

export default function SupervisorPendingApplicationsPage() {
  const { user } = useAuth();
  
  // App Data
  const [applications, setApplications] = useState([]);
  
  // Slot & Count Data
  const [slotsList, setSlotsList] = useState([]); // Filtered list for dropdown
  const [slotsMap, setSlotsMap] = useState({});   // Map: id -> label (for the view)
  const [slotCounts, setSlotCounts] = useState({}); // Map: slotId -> approved count
  const [selectedSlot, setSelectedSlot] = useState(""); // ID of slot selected in dropdown

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Fetch Pending Applications (for the main list)
      const pendingQuery = query(
        collection(db, "applications"),
        where("status", "==", "pending") 
      );
      
      // 2. Fetch Training Slots (for dropdown and labels)
      const slotQuery = query(collection(db, "trainingSlots"));

      // 3. Fetch Approved Applications (to calculate current occupancy)
      const approvedQuery = query(
        collection(db, "applications"),
        where("status", "==", "approved")
      );

      // Execute all queries in parallel
      const [pendingSnap, slotSnap, approvedSnap] = await Promise.all([
        getDocs(pendingQuery),
        getDocs(slotQuery),
        getDocs(approvedQuery)
      ]);

      // --- Process Pending Apps ---
      const pendingApps = pendingSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Sort by newest first
      pendingApps.sort((a, b) => {
         const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
         const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
         return tB - tA;
      });

      // --- Process Slots & Filter ---
      const sMap = {};
      let allSlots = [];
      slotSnap.forEach(doc => {
        const d = doc.data();
        sMap[doc.id] = d.label;
        allSlots.push({ id: doc.id, ...d });
      });

      // Filter Logic: Last 2 past slots + Active future slots
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // A. Past Slots (StartDate < Today) -> Sort descending (newest first) -> Take 2
      const pastSlots = allSlots
        .filter(s => s.startDate < today)
        .sort((a, b) => b.startDate.localeCompare(a.startDate))
        .slice(0, 2);

      // B. Future Slots (StartDate >= Today) -> Must be Active -> Sort ascending
      const futureSlots = allSlots
        .filter(s => s.startDate >= today && s.isActive !== false) // Default true if missing
        .sort((a, b) => a.startDate.localeCompare(b.startDate));

      // Combine: Reverse past slots back to chronological order (Older -> Newer) + Future
      const filteredSlotsList = [...pastSlots.reverse(), ...futureSlots];

      // --- Process Counts (Group approved apps by slotId) ---
      const counts = {};
      approvedSnap.forEach(doc => {
        const d = doc.data();
        // Check if application has a slotId
        if (d.durationDetails && d.durationDetails.slotId) {
          const sid = d.durationDetails.slotId;
          counts[sid] = (counts[sid] || 0) + 1;
        }
      });

      setApplications(pendingApps);
      setSlotsMap(sMap);
      setSlotsList(filteredSlotsList);
      setSlotCounts(counts);

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
      
      // 1. Remove from Pending List
      setApplications((prev) => prev.filter((a) => a.id !== app.id));

      // 2. Increment Slot Count Locally (Dynamic Update)
      const approvedSlotId = app.durationDetails?.slotId;
      if (approvedSlotId) {
        setSlotCounts(prev => ({
          ...prev,
          [approvedSlotId]: (prev[approvedSlotId] || 0) + 1
        }));
      }

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

  // --- STYLES ---
  const styles = {
    card: {
      background: "#fff",
      padding: "20px",
      marginBottom: "16px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
    },
    applyBtn: {
      padding: "8px 16px",
      border: "none",
      borderRadius: "4px",
      background: "#28a745",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "14px",
    },
    // Monitor Bar Styles
    monitorBar: {
      background: "#e3f2fd",
      border: "1px solid #90caf9",
      padding: "15px",
      borderRadius: "8px",
      marginBottom: "25px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
      flexWrap: "wrap"
    },
    selectInput: {
      padding: "8px",
      borderRadius: "4px",
      border: "1px solid #ccc",
      minWidth: "250px"
    },
    countDisplay: {
      padding: "8px 15px",
      background: "#fff",
      border: "1px solid #ccc",
      borderRadius: "4px",
      fontWeight: "bold",
      width: "80px",
      textAlign: "center",
      color: "#006400"
    }
  };

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{ marginBottom: 20, color: "#333" }}>Pending Applications</h2>
      
      {/* --- SLOT MONITOR SECTION --- */}
      <div style={styles.monitorBar}>
        <div>
          <strong style={{marginRight: 10, color: "#0d47a1"}}>Check Slot Availability:</strong>
          <select 
            value={selectedSlot} 
            onChange={(e) => setSelectedSlot(e.target.value)}
            style={styles.selectInput}
          >
            <option value="">-- Select a Slot --</option>
            {slotsList.map(s => (
              <option key={s.id} value={s.id}>
                {s.label} (Starts: {s.startDate})
              </option>
            ))}
          </select>
        </div>

        <div style={{display: "flex", alignItems: "center", gap: 10}}>
          <span style={{fontSize: "14px", color: "#555"}}>Approved Count:</span>
          <input 
            readOnly 
            value={selectedSlot ? (slotCounts[selectedSlot] || 0) : "-"} 
            style={styles.countDisplay} 
          />
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