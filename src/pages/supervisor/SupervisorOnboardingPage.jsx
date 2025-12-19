// src/pages/supervisor/SupervisorOnboardingPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { formatDateDisplay } from "../../utils/helpers"; 

export default function SupervisorOnboardingPage() {
    const [students, setStudents] = useState([]);

    useEffect(() => {
        // Fetch students who are payment verified but haven't physically joined yet
        const q = query(collection(db, "applications"), where("status", "==", "pending_confirmation"));
        return onSnapshot(q, (snap) => {
            setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    }, []);

    const handleMarkJoined = async (app) => {
        // Fallbacks for Name display based on your Firestore structure
        const studentName = app.fullname || app.studentName || app.studentBasicDetails?.fullname || "Unknown Student";
        
        if (!confirm(`Mark ${studentName} as physically joined today?`)) return;
        
        try {
            const today = new Date().toISOString().split('T')[0];
            const start = new Date(today);
            const end = new Date(start);
            
            // Duration logic from durationDetails object
            const val = parseInt(app.durationDetails?.value || 0);
            const type = app.durationDetails?.type;

            if (type === "months") end.setMonth(end.getMonth() + val);
            else if (type === "weeks") end.setDate(end.getDate() + (val * 7));
            else end.setDate(end.getDate() + val);
            
            // Recalculate Final End Date: Duration minus 1 day
            end.setDate(end.getDate() - 1); 
            const finalEndDate = end.toISOString().split('T')[0];

            await updateDoc(doc(db, "applications", app.id), {
                status: "physically_joined", // Updated status strictly
                finalStartDate: today,
                finalEndDate: finalEndDate,
                physicallyJoinedAt: serverTimestamp(),
                onboardingStep: "safety_pending",
                updatedAt: serverTimestamp()
            });
            
            toast.success(`${studentName} marked as Joined! Proceed to Safety Training.`);
        } catch (err) {
            toast.error("Error updating status: " + err.message);
        }
    };

    return (
        <div style={{ padding: 30 }}>
            <h2 style={{ marginBottom: 10 }}>Physical Joining Confirmation</h2>
            <p style={{ color: "#666", marginBottom: 30 }}>
                Confirm the physical arrival of trainees to finalize their actual internship start dates.
            </p>

            <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))" }}>
                {students.length === 0 ? (
                    <div style={styles.emptyState}>No students currently waiting to join.</div>
                ) : (
                    students.map(app => (
                        <div key={app.id} style={styles.card}>
                            {/* FIX: Using fallbacks for name display */}
                            <h4 style={styles.studentName}>
                                {app.fullname || app.studentName || app.studentBasicDetails?.fullname || "Name Missing"}
                            </h4>
                            
                            <div style={styles.infoRow}>
                                <strong>Date:</strong> 
                                <span> {formatDateDisplay(app.actualStartDate)} to {formatDateDisplay(app.actualEndDate)}</span>
                            </div>

                            <div style={styles.infoRow}>
                                <strong>College: </strong> 
                                <span> {app.collegeName || "N/A"}</span>
                            </div>

                            <button onClick={() => handleMarkJoined(app)} style={styles.btnConfirm}>
                                ✅ Confirm Physical Join
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const styles = {
    card: {
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
    },
    studentName: {
        margin: "0 0 12px 0",
        color: "#004d40",
        fontSize: "18px",
        fontWeight: "700"
    },
    infoRow: {
        fontSize: "14px",
        color: "#555",
        marginBottom: "6px",
        display: "flex",
        justifyContent: "space-between"
    },
    btnConfirm: {
        marginTop: "15px",
        padding: "12px",
        background: "#006400",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px",
        transition: "background 0.2s"
    },
    emptyState: {
        padding: "40px",
        textAlign: "center",
        background: "#f9f9f9",
        borderRadius: "10px",
        color: "#888",
        gridColumn: "1 / -1",
        border: "1px dashed #ccc"
    }
};