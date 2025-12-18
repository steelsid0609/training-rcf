// src/components/StudentApplyForm.jsx
import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js"; 
import { toast } from "react-toastify";

// --- CLOUDINARY CONFIGURATION ---
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

// --- HELPERS ---
function formatDateDisplay(isoString) {
  if (!isoString) return "";
  const parts = isoString.split("-");
  if (parts.length !== 3) return isoString;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

async function uploadToCloudinary(file) {
  if (!file) return null;
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("System Error: Cloudinary keys missing.");
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: formData });
  if (!res.ok) throw new Error("File upload failed. Please check internet connection.");
  const data = await res.json();
  return data.secure_url;
}

export default function StudentApplyForm({ user, profile, setShowApplyForm }) {
  const [form, setForm] = useState({
    fullname: profile?.fullname || "",
    phone: profile?.phone || "",
    email: user?.email || "",
    discipline: profile?.discipline || "",
    photoURL: profile?.photoURL || "", 
    collegeSearch: "",
    collegeSelected: "",
    college: { name: "", address: "", pincode: "", contact: "" },
    internshipType: "",
    slotId: "",
    durationType: "months",
    durationValue: "",
    preferredStartDate: "",
    preferredEndDate: "",
  });

  const [coverLetterFile, setCoverLetterFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [masterCollegeList, setMasterCollegeList] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // 1. Load Data
  useEffect(() => {
    const unsubColleges = onSnapshot(collection(db, "colleges_master"), (snap) => {
      setMasterCollegeList(snap.docs.map(d => ({ id: d.id, name: d.data().name || "" })));
    });

    const slotQuery = query(collection(db, "trainingSlots"), where("isActive", "==", true));
    const unsubSlots = onSnapshot(slotQuery, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => a.startDate.localeCompare(b.startDate));
      setSlots(list);
      setLoadingData(false);
    });

    return () => { unsubColleges(); unsubSlots(); };
  }, []);

  // 2. Refactored Date Calculation Logic (Inclusive Dates)
  useEffect(() => {
    if (!form.slotId || !form.durationValue) {
      setForm(f => ({ ...f, preferredStartDate: "", preferredEndDate: "" }));
      return;
    }
    const selectedSlot = slots.find(s => s.id === form.slotId);
    if (!selectedSlot) return;

    const start = new Date(selectedSlot.startDate);
    const end = new Date(start);
    const val = parseInt(form.durationValue);
    if (isNaN(val) || val <= 0) return;

    // Apply duration
    if (form.durationType === "months") end.setMonth(end.getMonth() + val);
    else if (form.durationType === "weeks") end.setDate(end.getDate() + (val * 7));
    else end.setDate(end.getDate() + val);

    // Subtract 1 day to make the duration inclusive 
    // (e.g., Jan 1 + 6 days = Jan 7, minus 1 day = Jan 6)
    end.setDate(end.getDate() - 1);

    setForm(f => ({ 
      ...f, 
      preferredStartDate: selectedSlot.startDate, 
      preferredEndDate: end.toISOString().split('T')[0] 
    }));
  }, [form.slotId, form.durationType, form.durationValue, slots]);

  // College Filtering logic
  const filteredColleges = masterCollegeList
    .filter(c => 
      c.name.toLowerCase().includes(form.collegeSearch.toLowerCase()) && 
      form.collegeSelected !== c.name
    )
    .slice(0, 5);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading("Processing your application...");
    try {
      const coverUrl = await uploadToCloudinary(coverLetterFile);
      let collegeInfo = { name: form.collegeSelected };
      
      if (form.collegeSelected === "Other") {
        const colRef = await addDoc(collection(db, "colleges_temp"), {
          ...form.college,
          submittedBy: user.uid,
          status: "pending",
          submittedAt: serverTimestamp()
        });
        collegeInfo = { name: form.college.name, tempCollegeRef: { id: colRef.id, path: `colleges_temp/${colRef.id}` } };
      }

      await addDoc(collection(db, "applications"), {
        ...form,
        photoURL: profile?.photoURL || "", 
        collegeName: collegeInfo.name,
        college: collegeInfo,
        coverLetterURL: coverUrl || "",
        status: "pending",
        paymentStatus: "pending",
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        uid: user.uid,
      });

      toast.update(toastId, { render: "Application Submitted! 🚀", type: "success", isLoading: false, autoClose: 3000 });
      setShowApplyForm(false);
    } catch (err) {
      toast.update(toastId, { render: err.message, type: "error", isLoading: false, autoClose: 3000 });
    } finally { setSubmitting(false); }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Apply for Training</h2>
          <button onClick={() => setShowApplyForm(false)} style={styles.closeBtn}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.scrollArea}>
          {/* Section 1: Personal Info */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>1. Personal Information</h4>
            <div style={{ display: "flex", gap: "25px", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ textAlign: "center" }}>
                    <img 
                        src={profile?.photoURL || "https://via.placeholder.com/80"} 
                        alt="Profile" 
                        style={styles.fixedProfileImg} 
                    />
                    <p style={{ fontSize: "10px", color: "#999", marginTop: "5px" }}>Locked from Profile</p>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={styles.grid}>
                        <div style={styles.field}>
                            <label style={styles.label}>Full Name</label>
                            <input style={styles.readOnlyInput} value={form.fullname} readOnly />
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Discipline</label>
                            <input style={styles.readOnlyInput} value={form.discipline} readOnly />
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Section 2: College */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>2. Educational Institution</h4>
            <label style={styles.label}>Select College</label>
            <input
              style={styles.input}
              placeholder="Start typing your college name..."
              value={form.collegeSearch}
              autoComplete="off"
              onChange={(e) => setForm({ ...form, collegeSearch: e.target.value, collegeSelected: "" })}
            />
            {form.collegeSearch && form.collegeSelected !== form.collegeSearch && (
              <div style={styles.dropdown}>
                {filteredColleges.map(c => (
                  <div key={c.id} onClick={() => setForm({ ...form, collegeSelected: c.name, collegeSearch: c.name })} style={styles.dropItem}>{c.name}</div>
                ))}
                <div onClick={() => setForm({ ...form, collegeSelected: "Other", collegeSearch: "Other" })} style={styles.dropItemOther}>Other</div>
              </div>
            )}
            {form.collegeSelected === "Other" && (
              <div style={styles.manualEntry}>
                <input style={styles.input} placeholder="College Name" onChange={e => setForm({...form, college: {...form.college, name: e.target.value}})} />
                <div style={styles.grid}>
                  <input style={styles.input} placeholder="Pincode" onChange={e => setForm({...form, college: {...form.college, pincode: e.target.value}})} />
                  <input style={styles.input} placeholder="Address/Contact" onChange={e => setForm({...form, college: {...form.college, address: e.target.value}})} />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Training */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>3. Training Preferences</h4>
            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>Internship Type</label>
                <select style={styles.input} value={form.internshipType} onChange={e => setForm({...form, internshipType: e.target.value})}>
                  <option value="">Select Type</option>
                  <option>Industrial Training</option>
                  <option>Summer Internship</option>
                  <option>Project Work</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Preferred Slot</label>
                <select style={styles.input} value={form.slotId} onChange={e => setForm({...form, slotId: e.target.value})}>
                  <option value="">Select Slot</option>
                  {slots.map(s => <option key={s.id} value={s.id}>{s.label} ({formatDateDisplay(s.startDate)})</option>)}
                </select>
              </div>
            </div>

            <div style={styles.durationBox}>
              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>Duration</label>
                  <input type="number" style={styles.input} placeholder="Value" value={form.durationValue} onChange={e => setForm({...form, durationValue: e.target.value})} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Unit</label>
                  <select style={styles.input} value={form.durationType} onChange={e => setForm({...form, durationType: e.target.value})}>
                    <option value="months">Months</option>
                    <option value="weeks">Weeks</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>
              <div style={styles.datePreview}>
                <span><strong>Timeline:</strong> {formatDateDisplay(form.preferredStartDate) || "--"} to {formatDateDisplay(form.preferredEndDate) || "--"}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Document */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>4. Documents</h4>
            <div style={styles.fileUpload}>
              <label style={styles.label}>Recommendation Letter (Optional)</label>
              <input type="file" accept="image/*" onChange={e => setCoverLetterFile(e.target.files[0])} />
              <p style={styles.hint}>JPG/PNG only, max 2MB</p>
            </div>
          </div>
        </form>

        <div style={styles.footer}>
          <button onClick={() => setShowApplyForm(false)} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} style={styles.submitBtn}>
            {submitting ? "Processing..." : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modal: { width: "95%", maxWidth: "700px", maxHeight: "90vh", background: "#fff", borderRadius: "16px", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", overflow: "hidden" },
  header: { padding: "20px 30px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fcfcfc" },
  title: { margin: 0, color: "#006400", fontSize: "1.5rem", fontWeight: "700" },
  closeBtn: { border: "none", background: "none", fontSize: "28px", cursor: "pointer", color: "#999" },
  scrollArea: { padding: "30px", overflowY: "auto", flex: 1 },
  section: { marginBottom: "30px" },
  sectionTitle: { margin: "0 0 15px 0", color: "#666", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700", borderBottom: "1px solid #f0f0f0", paddingBottom: "5px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  field: { display: "flex", flexDirection: "column" },
  label: { fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "#444" },
  input: { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none" },
  readOnlyInput: { padding: "12px", borderRadius: "8px", border: "1px solid #eee", background: "#f8f9fa", color: "#777", fontSize: "14px" },
  dropdown: { border: "1px solid #ddd", borderRadius: "8px", marginTop: "5px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", background: "#fff" },
  dropItem: { padding: "10px 15px", cursor: "pointer", borderBottom: "1px solid #f9f9f9" },
  dropItemOther: { padding: "10px 15px", cursor: "pointer", color: "#006400", fontWeight: "600" },
  manualEntry: { marginTop: "15px", padding: "15px", background: "#fffbeb", borderRadius: "8px", border: "1px solid #fef3c7", display: "flex", flexDirection: "column", gap: "10px" },
  fixedProfileImg: { width: "80px", height: "80px", borderRadius: "10px", objectFit: "cover", border: "2px solid #eee" },
  durationBox: { marginTop: "20px", padding: "15px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #dcfce7" },
  datePreview: { marginTop: "12px", fontSize: "13px", color: "#166534" },
  fileUpload: { padding: "15px", border: "2px dashed #eee", borderRadius: "12px", textAlign: "center" },
  hint: { fontSize: "11px", color: "#999", margin: "8px 0 0 0" },
  footer: { padding: "20px 30px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: "12px", background: "#fcfcfc" },
  cancelBtn: { padding: "12px 24px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: "600" },
  submitBtn: { padding: "12px 24px", borderRadius: "8px", border: "none", background: "#006400", color: "#fff", cursor: "pointer", fontWeight: "600" },
};