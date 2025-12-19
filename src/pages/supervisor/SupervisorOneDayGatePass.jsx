// src/pages/supervisor/SupervisorOneDayGatePass.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { formatDateDisplay } from "../../utils/helpers";
import { toast } from "react-toastify";

export default function SupervisorGatePassBulkPage() {
    const [students, setStudents] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [filterDate, setFilterDate] = useState(""); // State for date filter

    useEffect(() => {
        // Fetch students verified but not yet physically joined
        const q = query(collection(db, "applications"), where("status", "==", "pending_confirmation"));
        return onSnapshot(q, (snap) => {
            setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    }, []);

    // Logic to filter students based on the selected date
    const filteredStudents = students.filter(app => {
        if (!filterDate) return true;
        // Assuming actualStartDate is stored as YYYY-MM-DD string
        return app.actualStartDate === filterDate;
    });

    const toggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            // Only select IDs of students currently visible in the filtered list
            setSelectedIds(filteredStudents.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleBulkPrint = () => {
        if (selectedIds.length === 0) return toast.warn("Please select at least one student.");
        window.print();
    };

    return (
        <div style={{ padding: 30 }}>
            <div style={styles.headerRow}>
                <h2>🎟️ 1-Day Gate Pass Generation</h2>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {/* --- DATE FILTER INPUT --- */}
                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Filter by Start Date:</label>
                        <input 
                            type="date" 
                            value={filterDate} 
                            onChange={(e) => {
                                setFilterDate(e.target.value);
                                setSelectedIds([]); // Reset selection when filter changes
                            }} 
                            style={styles.dateInput}
                        />
                        {filterDate && (
                            <button 
                                onClick={() => setFilterDate("")} 
                                style={styles.btnClear}
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <button onClick={handleBulkPrint} style={styles.btnBulk}>
                        Print Pass for ({selectedIds.length}) Selected
                    </button>
                </div>
            </div>
            
            <p style={{ color: "#666", marginBottom: 20 }}>
                Generate temporary entry passes for new joinees. {filterDate ? `Showing students starting on ${formatDateDisplay(filterDate)}.` : "Showing all verified students."}
            </p>

            <table style={styles.table} className="no-print">
                <thead>
                    <tr style={styles.thRow}>
                        <th style={styles.th}><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === filteredStudents.length} /></th>
                        <th style={styles.th}>Student Name</th>
                        <th style={styles.th}>College</th>
                        <th style={styles.th}>Scheduled Start</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map(app => (
                            <tr key={app.id} style={styles.tr}>
                                <td style={styles.td}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(app.id)} 
                                        onChange={() => toggleSelect(app.id)} 
                                    />
                                </td>
                                <td style={{...styles.td, fontWeight: '600'}}>
                                    {app.fullname || app.studentName || app.studentBasicDetails?.fullname || "Unknown"}
                                </td>
                                <td style={styles.td}>{app.collegeName}</td>
                                <td style={styles.td}>{formatDateDisplay(app.actualStartDate)}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" style={{ padding: "30px", textAlign: "center", color: "#999" }}>
                                No students found for the selected criteria.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

const styles = {
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: '15px' },
    filterGroup: { display: 'flex', alignItems: 'center', gap: '10px', background: '#f0f0f0', padding: '8px 15px', borderRadius: '8px' },
    filterLabel: { fontSize: '14px', fontWeight: '600', color: '#444' },
    dateInput: { padding: '6px', borderRadius: '4px', border: '1px solid #ccc' },
    btnClear: { background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' },
    btnBulk: { padding: "10px 20px", background: "#006400", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
    table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" },
    thRow: { background: "#e8f5e9", textAlign: "left" },
    th: { padding: "12px 15px", color: "#2e7d32" },
    td: { padding: "12px 15px" },
    tr: { borderBottom: "1px solid #eee" },
    passCard: { 
        border: '2px solid #000', 
        padding: '25px', 
        marginBottom: '20px', 
        width: '350px', 
        pageBreakInside: 'avoid',
        fontFamily: 'sans-serif' 
    }
};