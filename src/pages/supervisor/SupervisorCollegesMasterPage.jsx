// src/pages/supervisor/SupervisorCollegesMasterPage.jsx
import React, { useState, useEffect } from "react";
import CollegeMasterView from "../../components/admin/CollegeMasterView"; 
import { db } from "../../firebase";
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  limit, 
  startAt, 
  endAt,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp 
} from "firebase/firestore";
import { toast } from "react-toastify";

export default function SupervisorCollegesMasterPage() {
  const [collegeMasterList, setCollegeMasterList] = useState([]);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);

  // New Record State
  const [showCollegeForm, setShowCollegeForm] = useState(false);
  const [newCollege, setNewCollege] = useState({ name: "", address: "", email: "", contact: "" });

  useEffect(() => {
    loadCollegeMaster();
  }, []);

  // --- READ ---
  async function loadCollegeMaster(term = "") {
    setLoading(true);
    try {
      const base = collection(db, "colleges_master");
      const t = (term || "").trim().toLowerCase();
      let qy;
      if (t) {
        qy = query(base, orderBy("name_lower"), startAt(t), endAt(t + "\uf8ff"), limit(50));
      } else {
        qy = query(base, orderBy("name_lower"), limit(50));
      }
      const snap = await getDocs(qy);
      setCollegeMasterList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // --- CREATE ---
  async function handleCreate(collegeData) {
    if (!collegeData.name) return toast.warning("College name is required");
    setWorking(true);
    try {
      await addDoc(collection(db, "colleges_master"), {
        ...collegeData,
        name_lower: collegeData.name.toLowerCase(),
        createdAt: serverTimestamp(),
        createdBy: "supervisor" 
      });
      toast.success("College added successfully!");
      setShowCollegeForm(false);
      setNewCollege({ name: "", address: "", email: "", contact: "" });
      await loadCollegeMaster(collegeSearch);
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setWorking(false);
    }
  }

  // --- UPDATE (Inline Edit) ---
  async function handleUpdate(updatedCollege) {
    if (!updatedCollege.name) return toast.warning("Name is required");

    setWorking(true);
    try {
      // We perform the update in Firestore
      await updateDoc(doc(db, "colleges_master", updatedCollege.id), {
        name: updatedCollege.name,
        name_lower: updatedCollege.name.toLowerCase(),
        address: updatedCollege.address || "",
        email: updatedCollege.email || "",
        contact: updatedCollege.contact || "",
        updatedAt: serverTimestamp()
      });
      toast.success("College updated.");
      // Refresh list to show changes
      await loadCollegeMaster(collegeSearch);
    } catch (err) {
      toast.error("Update failed: " + err.message);
    } finally {
      setWorking(false);
    }
  }

  // --- DELETE ---
  async function handleDelete(college) {
    if (!window.confirm(`Delete "${college.name}"?`)) return;
    setWorking(true);
    try {
      await deleteDoc(doc(db, "colleges_master", college.id));
      toast.success("Deleted.");
      await loadCollegeMaster(collegeSearch);
    } catch (err) {
      toast.error("Delete failed: " + err.message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>College Master List</h2>
      <CollegeMasterView 
        collegeMasterList={collegeMasterList}
        collegeSearch={collegeSearch}
        setCollegeSearch={setCollegeSearch}
        onSearch={() => loadCollegeMaster(collegeSearch)}
        
        showCollegeForm={showCollegeForm}
        setShowCollegeForm={setShowCollegeForm}
        newCollege={newCollege}
        setNewCollege={setNewCollege}
        
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        
        working={working || loading}
      />
    </div>
  );
}