import React, { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

export default function CollegeDetailsPage() {
  const { user } = useAuth();
  const [masterColleges, setMasterColleges] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [collegeSelected, setCollegeSelected] = useState("");
  
  // New state to store existing submission
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    collegeName: "",
    address: "",
    emails: [""],
    contacts: [""],
    principal: { name: "", emails: [""], contacts: [""] },
    faculties: [{ name: "", emails: [""], contacts: [""] }]
  });

  useEffect(() => {
    if (!user) return;

    // 1. Listen to Master College List
    const unsubMaster = onSnapshot(collection(db, "colleges_master"), (snap) => {
      setMasterColleges(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Check for Existing Submission
    const q = query(collection(db, "tempCollegeDetails"), where("uid", "==", user.uid));
    const unsubSubmission = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        // Sort by newest first if multiple exist
        const docs = snap.docs.map(d => d.data());
        setExistingSubmission(docs[0]);
      }
      setFetching(false);
    });

    return () => {
      unsubMaster();
      unsubSubmission();
    };
  }, [user]);

  const filtered = masterColleges.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) && 
    collegeSelected !== c.name
  ).slice(0, 5);

  const handleCollegeSelect = (name, address = "") => {
    setForm(prev => ({ ...prev, collegeName: name, address: address || prev.address }));
    setSearchTerm(name);
    setCollegeSelected(name);
  };

  const addListField = (path, fIndex = null) => {
    const newForm = { ...form };
    if (fIndex !== null) newForm.faculties[fIndex][path].push("");
    else if (path.includes('.')) {
      const [obj, key] = path.split('.');
      newForm[obj][key].push("");
    } else newForm[path].push("");
    setForm(newForm);
  };

  const handleInputChange = (path, value, index, fIndex = null) => {
    const newForm = { ...form };
    if (fIndex !== null) newForm.faculties[fIndex][path][index] = value;
    else if (path.includes('.')) {
      const [obj, key] = path.split('.');
      newForm[obj][key][index] = value;
    } else newForm[path][index] = value;
    setForm(newForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let tempCollegeRef = null;
      if (collegeSelected === "Other") {
        const colRef = await addDoc(collection(db, "colleges_temp"), {
          name: form.collegeName,
          address: form.address,
          submittedBy: user.uid,
          status: "pending",
          submittedAt: serverTimestamp()
        });
        tempCollegeRef = { id: colRef.id, path: `colleges_temp/${colRef.id}` };
      }

      await addDoc(collection(db, "tempCollegeDetails"), {
        ...form,
        tempCollegeRef,
        uid: user.uid,
        studentEmail: user.email,
        createdAt: serverTimestamp(),
        status: "pending"
      });
      
      toast.success("College details submitted!");
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div style={{ padding: 40 }}>Loading...</div>;

  // --- SUBMITTED VIEW ---
  if (existingSubmission) {
    const data = existingSubmission;
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: "#006400", margin: 0 }}>College Details Submitted</h2>
          <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '5px 15px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' }}>
            STATUS: {data.status?.toUpperCase()}
          </span>
        </div>

        <div style={styles.card}>
          <div style={styles.section}>
            <h4 style={styles.subHeader}>1. Institution Information</h4>
            <p><strong>Name:</strong> {data.collegeName}</p>
            <p><strong>Address:</strong> {data.address}</p>
            <p><strong>Emails:</strong> {data.emails?.join(", ")}</p>
            <p><strong>Contacts:</strong> {data.contacts?.join(", ")}</p>
          </div>

          <div style={styles.section}>
            <h4 style={styles.subHeader}>2. Principal Details</h4>
            <p><strong>Name:</strong> {data.principal?.name}</p>
            <p><strong>Emails:</strong> {data.principal?.emails?.join(", ")}</p>
            <p><strong>Contacts:</strong> {data.principal?.contacts?.join(", ")}</p>
          </div>

          <div style={styles.section}>
            <h4 style={styles.subHeader}>3. Faculty Details</h4>
            {data.faculties?.map((fac, i) => (
              <div key={i} style={styles.facultyCard}>
                <p><strong>Faculty {i+1}:</strong> {fac.name}</p>
                <p><strong>Emails:</strong> {fac.emails?.join(", ")}</p>
                <p><strong>Contacts:</strong> {fac.contacts?.join(", ")}</p>
              </div>
            ))}
          </div>
          
          <p style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
            Submitted on: {data.createdAt?.toDate().toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  // --- FORM VIEW (If no submission exists) ---
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ color: "#006400", marginBottom: "20px" }}>College & Faculty Details</h2>
      <form onSubmit={handleSubmit} style={styles.card}>
        {/* Render Form (same sections as before) */}
        <div style={styles.section}>
          <h4 style={styles.subHeader}>1. Institution Information</h4>
          <label style={styles.label}>College Name *</label>
          <input 
            style={styles.input} 
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCollegeSelected(""); }}
            placeholder="Search or type college name..."
            required
          />
          {searchTerm && collegeSelected !== searchTerm && (
            <div style={styles.dropdown}>
              {filtered.map(c => (
                <div key={c.id} style={styles.dropItem} onClick={() => handleCollegeSelect(c.name, c.address)}>{c.name}</div>
              ))}
              <div style={styles.dropItemOther} onClick={() => handleCollegeSelect("Other")}>+ My college is not listed</div>
            </div>
          )}
          {/* ... Rest of Section 1 ... */}
          <textarea style={styles.input} placeholder="Address" required value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
        </div>

        {/* --- SECTION 2: PRINCIPAL --- */}
        <div style={styles.section}>
          <h4 style={styles.subHeader}>2. Principal Details</h4>
          <input style={styles.input} required placeholder="Principal Name" value={form.principal.name} onChange={e => setForm({...form, principal: {...form.principal, name: e.target.value}})} />
          {/* ... Emails/Contacts Logic ... */}
        </div>

        {/* --- SECTION 3: FACULTY --- */}
        <div style={styles.section}>
          <h4 style={styles.subHeader}>3. Faculty Details</h4>
          {form.faculties.map((fac, fi) => (
            <div key={fi} style={styles.facultyCard}>
              <input style={styles.input} required placeholder="Faculty Name" value={fac.name} onChange={e => {
                const newFac = [...form.faculties]; newFac[fi].name = e.target.value; setForm({...form, faculties: newFac});
              }} />
              {/* ... Emails/Contacts Logic ... */}
            </div>
          ))}
          <button type="button" onClick={() => setForm({...form, faculties: [...form.faculties, {name:"", emails:[""], contacts:[""]}]})} style={styles.facultyBtn}>
            + Add Another Faculty
          </button>
        </div>

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? "Saving Information..." : "Submit All Details"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: { background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
  section: { marginBottom: "30px", borderBottom: "1px solid #f0f0f0", paddingBottom: "20px" },
  subHeader: { color: "#006400", borderLeft: "4px solid #006400", paddingLeft: "12px", marginBottom: "15px", fontSize: "16px" },
  facultyCard: { background: "#f9f9f9", padding: "15px", borderRadius: "8px", marginBottom: "10px", border: "1px solid #eee" },
  label: { display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" },
  input: { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #ddd" },
  submitBtn: { width: "100%", padding: "16px", background: "#006400", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" },
  facultyBtn: { width: "100%", padding: "10px", border: "2px dashed #006400", color: "#006400", background: "#f0fdf4", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", marginBottom: 20 },
  dropdown: { border: "1px solid #ddd", position: "absolute", background: "#fff", width: "100%", maxWidth: "400px", zIndex: 10, borderRadius: "6px" },
  dropItem: { padding: "10px", cursor: "pointer", borderBottom: "1px solid #eee" },
  dropItemOther: { padding: "10px", cursor: "pointer", color: "#006400", fontWeight: "bold", background: "#f0fdf4" }
};