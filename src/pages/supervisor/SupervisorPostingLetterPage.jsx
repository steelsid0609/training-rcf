// src/pages/supervisor/SupervisorPostingLetterPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import TraineeActionCard from "../../components/supervisor/TraineeActionCard";
import { useAuth } from "../../context/AuthContext";

export default function SupervisorPostingLetterPage() {
    const { user } = useAuth();
    const [trainees, setTrainees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Query trainees who finished safety training but are ready for departmental posting
        const q = query(
            collection(db, "applications"), 
            where("onboardingStep", "==", "completed"),
            where("status", "==", "in_progress")
        );
        
        return onSnapshot(q, (snap) => {
            setTrainees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
    }, []);

    if (loading) return <div style={{ padding: 30 }}>Loading Trainees...</div>;

    return (
        <div style={{ padding: 30 }}>
            <h2 style={{ marginBottom: 10 }}>Departmental Posting Letters</h2>
            <p style={{ color: "#666", marginBottom: 30 }}>
                Issue posting letters for trainees who have completed physical joining and safety training.
            </p>

            {trainees.length === 0 ? (
                <div style={styles.empty}>No trainees currently waiting for posting letters.</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {trainees.map(app => (
                        <TraineeActionCard key={app.id} app={app} user={user} />
                    ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    empty: { padding: 40, textAlign: "center", background: "#f9f9f9", borderRadius: 10, color: "#888", border: "1px dashed #ccc" }
};