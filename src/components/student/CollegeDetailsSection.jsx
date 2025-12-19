import React, { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

export default function CollegeDetailsSection() {
  const { user } = useAuth();
  const [masterColleges, setMasterColleges] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    collegeName: "",
    address: "",
    emails: [""],
    contacts: [""],
    principal: { name: "", emails: [""], contacts: [""] },
    faculties: [{ name: "", emails: [""], contacts: [""] }]
  });

  useEffect(() => {
    return onSnapshot(collection(db, "colleges_master"), (snap) => {
      setMasterColleges(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Helper to update nested arrays
  const updateList = (path, index, value, isRemove = false) => {
    const newForm = { ...form };
    let target = path === "college" ? newForm : path.split('.').reduce((o, i) => o[i], newForm);
    
    if (isRemove) target.splice(index, 1);
    else if (index === -1) target.push(""); // Add new empty string
    else target[index] = value;
    
    setForm(newForm);
  };

  const handleFacultyChange = (fIndex, field, value, listIndex = -1, isRemove = false) => {
    const newForm = { ...form };
    if (field === "name") {
      newForm.faculties[fIndex].name = value;
    } else {
      if (isRemove) newForm.faculties[fIndex][field].splice(listIndex, 1);
      else if (listIndex === -1) newForm.faculties[fIndex][field].push("");
      else newForm.faculties[fIndex][field][listIndex] = value;
    }
    setForm(newForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "tempCollegeDetails"), {
        ...form,
        uid: user.uid,
        studentEmail: user.email,
        createdAt: serverTimestamp(),
        status: "pending"
      });
      toast.success("College details submitted successfully!");
    } catch (err) {
      toast.error("Error saving details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = masterColleges.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  return (
    <div style={styles.card}>
      <h3 style={{ marginBottom: 15, color: "#006400" }}>College Details</h3>
      <form onSubmit={handleSubmit}>
        
        <label style={styles.label}>Search Master List / College Name *</label>
        <input 
          style={styles.input} 
          value={searchTerm} 
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setForm({...form, collegeName: e.target.value});
          }}
          placeholder="Type college name..."
          required
        />
        {searchTerm && form.collegeName !== searchTerm && (
          <div style={styles.dropdown}>
            {filtered.map(c => (
              <div key={c.id} style={styles.dropItem} onClick={() => {
                setForm({...form, collegeName: c.name, address: c.address || ""});
                setSearchTerm(c.name);
              }}>{c.name}</div>
            ))}
          </div>
        )}

        <label style={styles.label}>College Address *</label>
        <textarea style={styles.input} required value={form.address} onChange={e => setForm({...form, address: e.target.value})} />

        {/* College Emails */}
        <div style={styles.section}>
          <label style={styles.label}>College Emails *</label>
          {form.emails.map((em, i) => (
            <div key={i} style={styles.row}>
              <input style={styles.input} type="email" required value={em} onChange={e => updateList("emails", i, e.target.value)} />
              {i > 0 && <button type="button" onClick={() => updateList("emails", i, "", true)}>x</button>}
            </div>
          ))}
          <button type="button" style={styles.addBtn} onClick={() => updateList("emails", -1)}>+ Add Email</button>
        </div>

        {/* Principal Details */}
        <div style={styles.group}>
          <h4 style={styles.subTitle}>Principal Details</h4>
          <input style={styles.input} placeholder="Principal Name *" required value={form.principal.name} onChange={e => setForm({...form, principal: {...form.principal, name: e.target.value}})} />
          
          <label style={styles.label}>Principal Emails *</label>
          {form.principal.emails.map((em, i) => (
            <div key={i} style={styles.row}>
              <input style={styles.input} type="email" required value={em} onChange={e => {
                const f = {...form}; f.principal.emails[i] = e.target.value; setForm(f);
              }} />
            </div>
          ))}
          <button type="button" style={styles.addBtn} onClick={() => { const f = {...form}; f.principal.emails.push(""); setForm(f); }}>+ Add Email</button>
        </div>

        {/* Faculty Details */}
        <div style={styles.group}>
          <h4 style={styles.subTitle}>Faculty Details</h4>
          {form.faculties.map((fac, fi) => (
            <div key={fi} style={{ marginBottom: 20, borderBottom: "1px solid #eee", pb: 10 }}>
              <input style={styles.input} placeholder="Faculty Name *" required value={fac.name} onChange={e => handleFacultyChange(fi, "name", e.target.value)} />
              
              <label style={styles.label}>Faculty Emails *</label>
              {fac.emails.map((em, ei) => (
                <input key={ei} style={styles.input} type="email" required value={em} onChange={e => handleFacultyChange(fi, "emails", e.target.value, ei)} />
              ))}
              <button type="button" style={styles.addBtn} onClick={() => handleFacultyChange(fi, "emails", "", -1)}>+ Add Email</button>
            </div>
          ))}
          <button type="button" style={styles.addBtn} onClick={() => setForm({...form, faculties: [...form.faculties, {name:"", emails:[""], contacts:[""]}]})}>+ Add More Faculty</button>
        </div>

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? "Saving..." : "Save College Details"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: { background: "#fff", padding: 20, borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginTop: 20 },
  label: { display: "block", fontSize: 12, fontWeight: "bold", marginBottom: 5, marginTop: 10 },
  input: { width: "100%", padding: "10px", marginBottom: 10, borderRadius: 5, border: "1px solid #ddd" },
  row: { display: "flex", gap: 10, alignItems: "center" },
  addBtn: { background: "none", border: "none", color: "#006400", cursor: "pointer", fontSize: 12, fontWeight: "bold", marginBottom: 10 },
  submitBtn: { width: "100%", background: "#006400", color: "#fff", padding: 12, border: "none", borderRadius: 5, cursor: "pointer", fontWeight: "bold" },
  dropdown: { border: "1px solid #eee", position: "absolute", background: "#fff", width: "300px", zIndex: 10 },
  dropItem: { padding: 10, cursor: "pointer", borderBottom: "1px solid #eee" },
  subTitle: { borderBottom: "2px solid #006400", display: "inline-block", marginBottom: 10, fontSize: 14 }
};