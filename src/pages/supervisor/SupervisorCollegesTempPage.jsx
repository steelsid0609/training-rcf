import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-toastify";
import CollegesTempView from "../../components/CollegesTempView";

export default function SupervisorCollegesTempPage() {
  const [temps, setTemps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    loadTemps();
  }, []);

  async function loadTemps() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "colleges_temp"));
      setTemps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error("Failed to load temp colleges");
    } finally {
      setLoading(false);
    }
  }

  async function handlePromote(tempCollege) {
    if(!window.confirm(`Add "${tempCollege.name}" to Master List?`)) return;
    setWorking(true);
    try {
      // 1. Add to Master
      await addDoc(collection(db, "colleges_master"), {
        name: tempCollege.name,
        name_lower: tempCollege.name.toLowerCase(),
        address: tempCollege.address,
        contact: tempCollege.contact,
        createdAt: serverTimestamp()
      });

      // 2. Delete from Temp
      await deleteDoc(doc(db, "colleges_temp", tempCollege.id));
      
      toast.success("College promoted to Master List!");
      await loadTemps();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  }

  async function handleDelete(tempCollege) {
    if(!window.confirm("Delete this request?")) return;
    setWorking(true);
    try {
      await deleteDoc(doc(db, "colleges_temp", tempCollege.id));
      toast.success("Request deleted");
      await loadTemps();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  }

  // Styles object based on your other files
  const styles = {
    card: { background: "#fff", padding: 18, marginBottom: 12, borderRadius: 8, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" },
    inputStyle: { width: "100%", marginBottom: 8, padding: 8, border: "1px solid #ccc", borderRadius: 4 },
    applyBtn: { padding: "6px 12px", borderRadius: 4, border: "none", color: "#fff", cursor: "pointer", fontSize: 13 }
  };

  if(loading) return <div style={{padding: 20}}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>College Temp Requests</h2>
      <CollegesTempView 
        temps={temps}
        setTemps={setTemps}
        showResolved={showResolved}
        setShowResolved={setShowResolved}
        onPromote={handlePromote}
        onDelete={handleDelete}
        working={working}
        styles={styles}
      />
    </div>
  );
}