import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js"; // Fixed import extension
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

// --- STYLES ---
const inputStyle = { padding: "10px", margin: "5px 0 15px 0", border: "1px solid #ccc", borderRadius: "4px", width: "100%", fontSize: "14px" };
const labelStyle = { fontWeight: "600", fontSize: "13px", color: "#333", display: "block", marginBottom: "4px" };
const card = { padding: "30px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", maxWidth: "650px", margin: "20px auto", background: "#fff" };
const applyBtn = { padding: "12px 24px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", background: "#006400", color: "white", fontSize: "15px", transition: "0.2s" };

export default function StudentApplyForm({ user, profile, setShowApplyForm, reload }) {
  const [form, setForm] = useState({
    fullname: profile?.fullname || "",
    phone: profile?.phone || "",
    email: user?.email || "",
    discipline: profile?.discipline || "",
    collegeSearch: "",
    collegeSelected: "",
    college: { name: "", address: "", pincode: "", contact: "" },
    internshipType: "",
    slotId: "",
    durationType: "months",
    durationValue: "",
    preferredStartDate: "",
    preferredEndDate: "",
    receivedConfirmation: "No",
    confirmationNumber: "",
  });

  const [coverLetterFile, setCoverLetterFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showOtherCollege, setShowOtherCollege] = useState(false);
  
  // Real-time Data
  const [masterCollegeList, setMasterCollegeList] = useState([]);
  const [slots, setSlots] = useState([]); 
  const [loadingData, setLoadingData] = useState(true);

  // 1. Load Data (Real-time)
  useEffect(() => {
    // A. Listen to Colleges
    const unsubColleges = onSnapshot(collection(db, "colleges_master"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, name: d.data().name || "" }));
      setMasterCollegeList(list);
    }, (err) => {
      console.error("Colleges sync error", err);
      // Silent error or toast if critical
    });

    // B. Listen to Slots
    const todayStr = new Date().toISOString().split('T')[0];
    const slotQuery = query(collection(db, "trainingSlots"), where("isActive", "==", true));
    
    const unsubSlots = onSnapshot(slotQuery, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const validSlots = list.filter(s => s.startDate >= todayStr);
      validSlots.sort((a, b) => a.startDate.localeCompare(b.startDate));
      
      setSlots(validSlots);
      setLoadingData(false);
    }, (err) => {
      console.error("Slots sync error", err);
    });

    return () => {
      unsubColleges();
      unsubSlots();
    };
  }, []);

  // 2. Toggle College Fields
  useEffect(() => {
    setShowOtherCollege(form.collegeSelected === "Other");
  }, [form.collegeSelected]);

  // 3. Calculate Dates Logic
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

    if (form.durationType === "months") end.setMonth(end.getMonth() + val);
    else if (form.durationType === "weeks") end.setDate(end.getDate() + (val * 7));
    else if (form.durationType === "days") end.setDate(end.getDate() + val);

    setForm(f => ({ 
      ...f, 
      preferredStartDate: start.toISOString().split('T')[0], 
      preferredEndDate: end.toISOString().split('T')[0] 
    }));
  }, [form.slotId, form.durationType, form.durationValue, slots]);

  const filteredColleges = masterCollegeList
    .filter((c) => c.name.toLowerCase().includes(form.collegeSearch.toLowerCase()))
    .slice(0, 8);

  function handleCollegeSelect(name) {
    setForm((f) => ({
      ...f,
      collegeSearch: name,
      collegeSelected: name,
      college: name === "Other" ? f.college : { ...f.college, name },
    }));
  }

  function validate() {
    if (!form.fullname.trim()) return "Profile incomplete: Full Name missing.";
    if (!form.phone) return "Profile incomplete: Phone missing.";
    if (!form.collegeSelected) return "Please select a college.";
    
    if (form.collegeSelected === "Other") {
      if (!form.college.name.trim()) return "Enter college name.";
      if (!form.college.pincode) return "Enter college pincode.";
    }

    if (!form.internshipType) return "Select Internship Type.";
    if (!form.slotId) return "Select a Training Slot.";
    if (!form.durationValue) return "Enter duration value.";
    
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) return toast.warn(err);

    setSubmitting(true);
    const toastId = toast.loading("Submitting application...");

    try {
      // 1. Upload Cover Letter
      let coverUrl = "";
      if (coverLetterFile) {
        coverUrl = await uploadToCloudinary(coverLetterFile);
      }

      // 2. Handle Temp College
      let tempCollegeRef = null;
      if (form.collegeSelected === "Other") {
        const colPayload = {
          name: form.college.name.trim(),
          address: form.college.address.trim(),
          pincode: form.college.pincode,
          contact: form.college.contact,
          submittedBy: user.uid,
          submittedByEmail: user.email,
          submittedAt: serverTimestamp(),
          status: "pending",
        };
        const docRef = await addDoc(collection(db, "colleges_temp"), colPayload);
        tempCollegeRef = { id: docRef.id, path: `colleges_temp/${docRef.id}` };
      }

      // 3. Submit Application
      const collegeInfo = form.collegeSelected === "Other"
          ? { name: form.college.name.trim(), tempCollegeRef }
          : { name: form.collegeSelected };

      const payload = {
        createdBy: user.uid,
        uid: user.uid,
        studentName: form.fullname,
        email: form.email,
        phone: form.phone,
        discipline: form.discipline,
        collegeName: collegeInfo.name, 
        college: collegeInfo, 
        internshipType: form.internshipType,
        preferredStartDate: form.preferredStartDate,
        preferredEndDate: form.preferredEndDate,
        durationDetails: {
            slotId: form.slotId,
            type: form.durationType,
            value: form.durationValue
        },
        receivedConfirmation: form.receivedConfirmation === "Yes",
        confirmationNumber: form.receivedConfirmation === "Yes" ? form.confirmationNumber.trim() : "",
        coverLetterURL: coverUrl || "", 
        status: "pending",
        paymentStatus: "pending",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "applications"), payload);
      
      toast.update(toastId, { render: "Application Submitted Successfully! 🚀", type: "success", isLoading: false, autoClose: 3000 });
      setShowApplyForm(false);
      // Reload handled by parent listener
    } catch (err) {
      console.error(err);
      toast.update(toastId, { render: "Submission Failed: " + err.message, type: "error", isLoading: false, autoClose: 4000 });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={card}>
      <h2 style={{ margin: "0 0 20px 0", color: "#006400", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>
        New Application
      </h2>
      
      <form onSubmit={handleSubmit}>
        {/* Personal Details */}
        <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#555" }}>Personal Details</h4>
            <label style={labelStyle}>Full Name</label>
            <input style={{...inputStyle, background: "#e9ecef"}} value={form.fullname} readOnly />
            <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Phone</label>
                    <input style={{...inputStyle, background: "#e9ecef"}} value={form.phone} readOnly />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Discipline</label>
                    <input style={{...inputStyle, background: "#e9ecef"}} value={form.discipline} readOnly />
                </div>
            </div>
        </div>

        {/* College Selection */}
        <label style={labelStyle}>Select College</label>
        <input
          style={inputStyle}
          placeholder={loadingData ? "Loading colleges..." : "Search college..."}
          value={form.collegeSearch}
          onChange={(e) => setForm((f) => ({ ...f, collegeSearch: e.target.value }))}
        />
        
        {form.collegeSearch && (
          <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #eee", marginBottom: "15px", borderRadius: "4px" }}>
            {filteredColleges.map((c) => (
              <div
                key={c.id}
                onClick={() => handleCollegeSelect(c.name)}
                style={{ padding: "8px", cursor: "pointer", borderBottom: "1px solid #f0f0f0", background: form.collegeSelected === c.name ? "#e8f5e9" : "#fff" }}
              >
                {c.name}
              </div>
            ))}
            <div onClick={() => handleCollegeSelect("Other")} style={{ padding: "8px", cursor: "pointer", fontWeight: "bold", color: "#006400" }}>
              + My college is not listed (Select Other)
            </div>
          </div>
        )}

        {showOtherCollege && (
          <div style={{ border: "1px dashed #ccc", padding: "15px", borderRadius: "6px", marginBottom: "20px", background: "#fff8e1" }}>
            <label style={labelStyle}>College Name *</label>
            <input style={inputStyle} value={form.college.name} onChange={e => setForm({...form, college: {...form.college, name: e.target.value}})} />
            <label style={labelStyle}>Pincode *</label>
            <input style={inputStyle} value={form.college.pincode} onChange={e => setForm({...form, college: {...form.college, pincode: e.target.value}})} />
            <label style={labelStyle}>Address</label>
            <input style={inputStyle} value={form.college.address} onChange={e => setForm({...form, college: {...form.college, address: e.target.value}})} />
          </div>
        )}

        {/* Training Details */}
        <label style={labelStyle}>Internship Type</label>
        <select style={inputStyle} value={form.internshipType} onChange={e => setForm({...form, internshipType: e.target.value})}>
            <option value="">-- Select --</option>
            <option>Industrial Training</option>
            <option>Summer Internship</option>
            <option>Project Work</option>
        </select>

        <div style={{ background: "#e8f5e9", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #c8e6c9" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#006400" }}>Training Duration & Slot</h4>
            
            <label style={labelStyle}>Select Start Date Slot</label>
            <select style={inputStyle} value={form.slotId} onChange={e => setForm({...form, slotId: e.target.value})}>
                <option value="">-- Available Slots --</option>
                {loadingData ? <option>Loading...</option> : 
                    slots.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.label} (Starts: {formatDateDisplay(s.startDate)})
                        </option>
                    ))
                }
            </select>

            <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Duration Unit</label>
                    <select style={inputStyle} value={form.durationType} onChange={e => setForm({...form, durationType: e.target.value})}>
                        <option value="months">Months</option>
                        <option value="weeks">Weeks</option>
                        <option value="days">Days</option>
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Duration Value</label>
                    <input type="number" min="1" style={inputStyle} value={form.durationValue} onChange={e => setForm({...form, durationValue: e.target.value})} placeholder="e.g. 2" />
                </div>
            </div>

            <div style={{ display: "flex", gap: "15px", marginTop: "5px" }}>
                <div style={{ flex: 1 }}>
                    <label style={{...labelStyle, color: "#555"}}>Start Date</label>
                    <input type="text" style={{...inputStyle, background: "#fff", fontWeight: "bold"}} value={formatDateDisplay(form.preferredStartDate)} readOnly placeholder="--" />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{...labelStyle, color: "#555"}}>End Date</label>
                    <input type="text" style={{...inputStyle, background: "#fff", fontWeight: "bold", color: "#006400"}} value={formatDateDisplay(form.preferredEndDate)} readOnly placeholder="--" />
                </div>
            </div>
        </div>

        {/* Documents */}
        <label style={labelStyle}>Cover Letter (Optional, JPG/JPEG, Max 2MB)</label>
        <input type="file" accept="image/jpeg, image/jpg" style={inputStyle} onChange={(e) => setCoverLetterFile(e.target.files[0])} />

        {/* Actions */}
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" onClick={() => setShowApplyForm(false)} style={{ ...applyBtn, background: "#6c757d" }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ ...applyBtn, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Submitting..." : "Submit Application"}
            </button>
        </div>
      </form>
    </div>
  );
}