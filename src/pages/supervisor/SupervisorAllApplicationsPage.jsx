import React, { useEffect, useState } from "react";
import { db } from "../../firebase"; // Removed .js extension to fix resolution
import { collection, getDocs, query } from "firebase/firestore";
import { toast } from "react-toastify";

export default function SupervisorAllApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [slotsMap, setSlotsMap] = useState({});
  const [loading, setLoading] = useState(true);

  // --- FILTER STATES ---
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Fetch All Applications
      const appQuery = query(collection(db, "applications"));
      
      // 2. Fetch Slots for mapping
      const slotQuery = query(collection(db, "trainingSlots"));

      const [appSnap, slotSnap] = await Promise.all([
        getDocs(appQuery),
        getDocs(slotQuery)
      ]);

      // Process Slots into Map {id: label}
      const sMap = {};
      slotSnap.forEach((doc) => {
        sMap[doc.id] = doc.data().label;
      });
      setSlotsMap(sMap);

      // Process Applications
      const apps = appSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Sort by Created Date (Newest First)
      apps.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });

      setApplications(apps);
    } catch (err) {
      console.error("Error loading data:", err);
      toast.error("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }

  // --- FILTER LOGIC ---
  const filteredApplications = applications.filter((app) => {
    // 1. Search Filter (Name or Email)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const name = (app.studentName || "").toLowerCase();
      const email = (app.email || "").toLowerCase();
      if (!name.includes(term) && !email.includes(term)) {
        return false;
      }
    }

    // 2. Type Filter
    if (typeFilter !== "All" && app.internshipType !== typeFilter) {
      return false;
    }

    // 3. Status Filter
    if (statusFilter !== "All") {
      const appStatus = (app.status || "pending").toLowerCase();
      if (appStatus !== statusFilter.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  // Helper: Format Date
  function formatDate(isoString) {
    if (!isoString) return "-";
    const parts = isoString.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoString;
  }

  // Helper: Status Badge Style
  function getStatusStyle(status) {
    const s = (status || "pending").toLowerCase();
    const base = { padding: "4px 8px", borderRadius: "4px", fontWeight: "bold", fontSize: "12px", textTransform: "uppercase" };
    
    if (s === "approved") return { ...base, background: "#d4edda", color: "#155724" };
    if (s === "rejected") return { ...base, background: "#f8d7da", color: "#721c24" };
    if (s === "completed") return { ...base, background: "#cce5ff", color: "#004085" };
    if (s === "verification_pending") return { ...base, background: "#fff3cd", color: "#856404" };
    
    return { ...base, background: "#eee", color: "#555" }; 
  }

  if (loading) return <div style={{ padding: 30 }}>Loading all applications...</div>;

  return (
    <div style={{ padding: 30 }}>
      {/* HEADER WITH FILTERS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 15 }}>
        <h2 style={{ margin: 0, color: "#333" }}>All Applications List</h2>
        
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
           {/* Search Input */}
           <input 
             placeholder="Search Name or Email..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             style={filterInput}
           />

           {/* Type Filter */}
           <select 
             value={typeFilter} 
             onChange={(e) => setTypeFilter(e.target.value)} 
             style={filterSelect}
           >
             <option value="All">All Types</option>
             <option value="Industrial Training">Industrial Training</option>
             <option value="Summer Internship">Summer Internship</option>
             <option value="Project Work">Project Work</option>
           </select>

           {/* Status Filter */}
           <select 
             value={statusFilter} 
             onChange={(e) => setStatusFilter(e.target.value)} 
             style={filterSelect}
           >
             <option value="All">All Status</option>
             <option value="pending">Pending</option>
             <option value="approved">Approved</option>
             <option value="rejected">Rejected</option>
             <option value="completed">Completed</option>
             <option value="verification_pending">Payment Verification</option>
           </select>
        </div>
      </div>
      
      <div style={{ overflowX: "auto", background: "#fff", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
          <thead>
            <tr style={{ background: "#f4f4f4", borderBottom: "2px solid #ddd", textAlign: "left" }}>
              <th style={thStyle}>Student</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>College</th>
              <th style={thStyle}>Slot & Duration</th>
              <th style={thStyle}>Dates</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Payment</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "30px", textAlign: "center", color: "#666" }}>
                  No applications match your filters.
                </td>
              </tr>
            ) : (
              filteredApplications.map((app) => {
                const slotLabel = (app.durationDetails?.slotId && slotsMap[app.durationDetails.slotId]) 
                  ? slotsMap[app.durationDetails.slotId] 
                  : "Custom";
                
                const durationTxt = app.durationDetails 
                  ? `${app.durationDetails.value} ${app.durationDetails.type}` 
                  : "-";

                return (
                  <tr key={app.id} style={{ borderBottom: "1px solid #eee", fontSize: "14px" }}>
                    {/* Student */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: "bold", color: "#333" }}>{app.studentName}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>{app.email}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>{app.phone}</div>
                    </td>

                    {/* Type */}
                    <td style={tdStyle}>{app.internshipType}</td>

                    {/* College */}
                    <td style={tdStyle}>
                      {app.collegeName || (app.college && app.college.name) || "-"}
                    </td>

                    {/* Slot & Duration */}
                    <td style={tdStyle}>
                      <div style={{ color: "#0056b3", fontWeight: "500" }}>{slotLabel}</div>
                      <div style={{ fontSize: "12px", color: "#555" }}>({durationTxt})</div>
                    </td>

                    {/* Dates */}
                    <td style={tdStyle}>
                      {formatDate(app.preferredStartDate)} <br/> 
                      <span style={{color:"#777"}}>to</span> <br/> 
                      {formatDate(app.preferredEndDate)}
                    </td>

                    {/* Status */}
                    <td style={tdStyle}>
                      <span style={getStatusStyle(app.status)}>
                        {app.status || "Pending"}
                      </span>
                    </td>

                    {/* Payment */}
                    <td style={tdStyle}>
                      {app.paymentStatus ? (
                        <span style={{ 
                          fontWeight: "bold", 
                          color: app.paymentStatus === "paid" || app.paymentStatus === "verified" ? "green" : "orange" 
                        }}>
                          {app.paymentStatus.replace("_", " ").toUpperCase()}
                        </span>
                      ) : (
                        <span style={{ color: "#999" }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Styles ---
const thStyle = {
  padding: "12px 15px",
  color: "#444",
  fontSize: "13px",
  fontWeight: "bold"
};

const tdStyle = {
  padding: "12px 15px",
  verticalAlign: "top",
  color: "#333"
};

const filterInput = {
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  minWidth: "200px"
};

const filterSelect = {
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  cursor: "pointer",
  minWidth: "150px"
};