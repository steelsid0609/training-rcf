import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

// --- CLOUDINARY CONFIGURATION ---
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Construct the correct API URL
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

// --- HELPER: FORMAT DATE FOR DISPLAY (YYYY-MM-DD -> DD/MM/YYYY) ---
function formatDateDisplay(isoString) {
  if (!isoString) return "";
  const parts = isoString.split("-"); // Expects [YYYY, MM, DD]
  if (parts.length !== 3) return isoString;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// --- HELPER: UPLOAD TO CLOUDINARY ---
async function uploadToCloudinary(file) {
  if (!file) return null; // Optional file not provided
  
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Missing Cloudinary configuration in .env file");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  
  // Log for debugging
  console.log("Uploading to:", CLOUDINARY_UPLOAD_URL);

  const res = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Cloudinary Error:", text);
    throw new Error(`Upload failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.secure_url;
}

// --- STYLES ---
const inputStyle = {
  padding: "10px",
  margin: "5px 0 15px 0",
  border: "1px solid #ccc",
  borderRadius: "4px",
  boxSizing: "border-box",
  display: "block",
  width: "100%",
  fontSize: "14px"
};

const labelStyle = {
  fontWeight: "600",
  fontSize: "13px",
  color: "#333",
  display: "block",
  marginBottom: "4px"
};

const card = {
  padding: "30px",
  borderRadius: "10px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  maxWidth: "650px",
  margin: "20px auto",
  background: "#fff",
};

const applyBtn = {
  padding: "12px 24px",
  borderRadius: "6px",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
  background: "#006400",
  color: "white",
  fontSize: "15px",
  transition: "background 0.2s",
};

export default function StudentApplyForm({
  user,
  profile,
  setShowApplyForm,
  reload,
}) {
  const [form, setForm] = useState({
    fullname: profile?.fullname || "",
    phone: profile?.phone || "",
    email: user?.email || "",
    discipline: profile?.discipline || "",
    collegeSearch: "",
    collegeSelected: "",
    college: { name: "", address: "", pincode: "", contact: "" },
    internshipType: "",
    
    // SLOTS & DURATION
    slotId: "",
    durationType: "months",
    durationValue: "",
    
    // CALCULATED DATES
    preferredStartDate: "",
    preferredEndDate: "",
    
    receivedConfirmation: "No",
    confirmationNumber: "",
  });

  // FILES
  const [coverLetterFile, setCoverLetterFile] = useState(null); // Optional

  const [submitting, setSubmitting] = useState(false);
  const [showOtherCollege, setShowOtherCollege] = useState(false);
  
  // DATA
  const [masterCollegeList, setMasterCollegeList] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [slots, setSlots] = useState([]); 
  const [loadingSlots, setLoadingSlots] = useState(true);

  // 1. Sync Profile Data
  useEffect(() => {
    setForm((f) => ({
      ...f,
      fullname: profile?.fullname || "",
      phone: profile?.phone || "",
      discipline: profile?.discipline || "",
      email: user?.email || "",
    }));
  }, [profile, user]);

  // 2. Load Data & Filter Slots
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoadingColleges(true);
      setLoadingSlots(true);
      try {
        // A. Fetch Colleges
        const colSnap = await getDocs(collection(db, "colleges_master"));
        const cols = [];
        colSnap.forEach((d) => {
          const data = d.data();
          cols.push({ id: d.id, name: data.name || data.collegeName || "" });
        });

        // B. Fetch Slots
        const slotRef = collection(db, "trainingSlots");
        const slotSnap = await getDocs(slotRef);
        let slotList = slotSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // C. Filter Slots
        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        slotList = slotList.filter(s => {
            if (s.isActive === false) return false;

            const start = new Date(s.startDate);
            const year = start.getFullYear();
            const month = start.getMonth();
            const day = start.getDate();

            let slotEnd = new Date(year, month, 1); 
            if (day <= 15) {
                slotEnd = new Date(year, month, 15);
            } else {
                slotEnd = new Date(year, month + 1, 0); 
            }
            slotEnd.setHours(23, 59, 59, 999);

            return today <= slotEnd;
        });

        slotList.sort((a, b) => a.startDate.localeCompare(b.startDate));

        if (!cancelled) {
          setMasterCollegeList(cols);
          setSlots(slotList);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        if (!cancelled) {
          setLoadingColleges(false);
          setLoadingSlots(false);
        }
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  // 3. Toggle College Fields
  useEffect(() => {
    setShowOtherCollege(form.collegeSelected === "Other");
  }, [form.collegeSelected]);

  // 4. Calculate Dates Logic
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

    if (form.durationType === "months") {
      end.setMonth(end.getMonth() + val);
    } else if (form.durationType === "weeks") {
      end.setDate(end.getDate() + (val * 7));
    } else if (form.durationType === "days") {
      end.setDate(end.getDate() + val);
    }

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    setForm(f => ({ ...f, preferredStartDate: startStr, preferredEndDate: endStr }));
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

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) {
      setCoverLetterFile(null);
      return;
    }
    // Validations
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds 2MB limit.");
      e.target.value = "";
      return;
    }
    const validTypes = ["image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPG/JPEG allowed.");
      e.target.value = "";
      return;
    }
    setCoverLetterFile(file);
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
    
    if (form.receivedConfirmation === "Yes" && !form.confirmationNumber.trim()) {
        return "Enter Confirmation Number.";
    }

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) return toast.warn(err);

    setSubmitting(true);
    try {
      toast.info("Submitting application...");
      
      // Upload Cover Letter if exists (Optional)
      let coverUrl = "";
      if (coverLetterFile) {
        coverUrl = await uploadToCloudinary(coverLetterFile);
      }

      // Handle College
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

      const collegeInfo = form.collegeSelected === "Other"
          ? { name: form.college.name.trim(), tempCollegeRef }
          : { name: form.collegeSelected };

      // Prepare Application Data
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
        
        // Dates (YYYY-MM-DD)
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
      
      toast.success("Application Submitted Successfully! 🚀");
      setShowApplyForm(false);
      if (reload) await reload(user.uid);

    } catch (err) {
      console.error(err);
      toast.error("Submission Failed: " + err.message);
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
        {/* 1. Personal Details */}
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

        {/* 2. College Selection */}
        <label style={labelStyle}>Select College</label>
        <input
          style={inputStyle}
          placeholder={loadingColleges ? "Loading..." : "Type to search college..."}
          value={form.collegeSearch}
          onChange={(e) => setForm((f) => ({ ...f, collegeSearch: e.target.value }))}
        />
        
        {form.collegeSearch && (
          <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #eee", marginBottom: "15px", borderRadius: "4px" }}>
            {!loadingColleges && filteredColleges.map((c) => (
              <div
                key={c.id}
                onClick={() => handleCollegeSelect(c.name)}
                style={{
                  padding: "8px", cursor: "pointer", borderBottom: "1px solid #f0f0f0",
                  background: form.collegeSelected === c.name ? "#e8f5e9" : "#fff"
                }}
              >
                {c.name}
              </div>
            ))}
            <div
              onClick={() => handleCollegeSelect("Other")}
              style={{ padding: "8px", cursor: "pointer", fontWeight: "bold", color: "#006400" }}
            >
              + My college is not listed (Select Other)
            </div>
          </div>
        )}

        {showOtherCollege && (
          <div style={{ border: "1px dashed #ccc", padding: "15px", borderRadius: "6px", marginBottom: "20px", background: "#fff8e1" }}>
            <label style={labelStyle}>College Name</label>
            <input style={inputStyle} value={form.college.name} onChange={e => setForm({...form, college: {...form.college, name: e.target.value}})} />
            
            <label style={labelStyle}>Pincode</label>
            <input style={inputStyle} value={form.college.pincode} onChange={e => setForm({...form, college: {...form.college, pincode: e.target.value}})} />
            
            <label style={labelStyle}>Address</label>
            <input style={inputStyle} value={form.college.address} onChange={e => setForm({...form, college: {...form.college, address: e.target.value}})} />
          </div>
        )}

        {/* 3. Training Details */}
        <label style={labelStyle}>Internship Type</label>
        <select style={inputStyle} value={form.internshipType} onChange={e => setForm({...form, internshipType: e.target.value})}>
            <option value="">-- Select --</option>
            <option>Industrial Training</option>
            <option>Summer Internship</option>
            <option>Project Work</option>
        </select>

        <div style={{ background: "#e8f5e9", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #c8e6c9" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#006400" }}>Training Duration & Slot</h4>
            
            <label style={labelStyle}>Select Start Date Slot (Available Slots)</label>
            <select style={inputStyle} value={form.slotId} onChange={e => setForm({...form, slotId: e.target.value})}>
                <option value="">-- Select Start Date --</option>
                {loadingSlots ? <option>Loading slots...</option> : 
                    slots.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.label} (Starts: {formatDateDisplay(s.startDate)})
                        </option>
                    ))
                }
            </select>

            <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Select: Months / Weeks / Days</label>
                    <select style={inputStyle} value={form.durationType} onChange={e => setForm({...form, durationType: e.target.value})}>
                        <option value="months">Months</option>
                        <option value="weeks">Weeks</option>
                        <option value="days">Days</option>
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Duration</label>
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

        {/* 4. Documents */}
        <label style={labelStyle}>Cover Letter (Optional, JPG/JPEG only, Max 2MB)</label>
        <input 
            type="file" 
            accept="image/jpeg, image/jpg" 
            style={inputStyle} 
            onChange={handleFileChange} 
        />

        {/* 5. Confirmation */}
        <label style={labelStyle}>Do you already have a Confirmation Number?</label>
        <div style={{ marginBottom: "15px", display: "flex", gap: "20px" }}>
            <label><input type="radio" checked={form.receivedConfirmation === "Yes"} onChange={() => setForm({...form, receivedConfirmation: "Yes"})} /> Yes</label>
            <label><input type="radio" checked={form.receivedConfirmation === "No"} onChange={() => setForm({...form, receivedConfirmation: "No", confirmationNumber: ""})} /> No</label>
        </div>

        {form.receivedConfirmation === "Yes" && (
            <>
                <label style={labelStyle}>Enter Confirmation Number</label>
                <input style={inputStyle} value={form.confirmationNumber} onChange={e => setForm({...form, confirmationNumber: e.target.value})} />
            </>
        )}

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