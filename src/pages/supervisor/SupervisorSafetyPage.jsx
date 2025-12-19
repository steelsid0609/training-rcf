// src/pages/supervisor/SupervisorSafetyPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";

export default function SupervisorSafetyPage() {
    const [trainees, setTrainees] = useState([]);
    const [safetyData, setSafetyData] = useState({});

    useEffect(() => {
        const q = query(collection(db, "applications"), where("onboardingStep", "==", "safety_pending"));
        return onSnapshot(q, (snap) => {
            setTrainees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    }, []);

    const handleComplete = async (appId) => {
        const data = safetyData[appId];
        if (!data?.trained || !data?.helmet || !data?.shoes) {
            return toast.warn("Please confirm all safety requirements.");
        }

        try {
            await updateDoc(doc(db, "applications", appId), {
                status: "in_progress", // Moves to Active Trainees page
                onboardingStep: "completed",
                safetyTrainingDate: serverTimestamp(),
                instrumentsIssued: ["Helmet", "Safety Shoes"],
                updatedAt: serverTimestamp()
            });
            toast.success("Onboarding complete! Trainee is now Active.");
        } catch (err) { toast.error(err.message); }
    };

    return (
        <div style={{ padding: 30 }}>
            <h2>Safety Training & PPE</h2>
            {trainees.map(app => (
                <div key={app.id} style={{ padding: 20, marginBottom: 15, background: "#fff9c4", borderRadius: 8 }}>
                    <h3>{app.fullname || app.studentName || app.studentBasicDetails?.fullname} (Final Start: {app.finalStartDate})</h3>
                    <div style={{ display: "flex", gap: 20, margin: "10px 0" }}>
                        <label><input type="checkbox" onChange={e => setSafetyData({...safetyData, [app.id]: {...safetyData[app.id], trained: e.target.checked}})} /> Safety Training Provided</label>
                        <label><input type="checkbox" onChange={e => setSafetyData({...safetyData, [app.id]: {...safetyData[app.id], helmet: e.target.checked}})} /> Helmet Issued</label>
                        <label><input type="checkbox" onChange={e => setSafetyData({...safetyData, [app.id]: {...safetyData[app.id], shoes: e.target.checked}})} /> Shoes Issued</label>
                    </div>
                    <button onClick={() => handleComplete(app.id)} style={{ padding: "10px 20px", background: "#006400", color: "#fff", border: "none", borderRadius: 5 }}>
                        🏁 Finalize & Issue Posting Letter
                    </button>
                </div>
            ))}
        </div>
    );
}