import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import TraineeActionCard from "../../components/common/TraineeActionCard";

export default function AdminTraineesPage() {
  const { user } = useAuth();
  const [trainees, setTrainees] = useState([]);

  useEffect(() => {
    // Fetch 'pending_confirmation' (Ready to Start) and 'in_progress' (Active)
    const q = query(
      collection(db, "applications"), 
      where("status", "in", ["pending_confirmation", "in_progress"])
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setTrainees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div style={{ padding: 30 }}>
      <h2>Active Trainees & Letters</h2>
      {trainees.length === 0 ? <p>No active trainees.</p> : (
        trainees.map(app => <TraineeActionCard key={app.id} app={app} user={user} />)
      )}
    </div>
  );
}