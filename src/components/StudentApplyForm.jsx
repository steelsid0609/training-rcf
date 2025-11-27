// src/components/StudentApplyForm.jsx
import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

// Environment variables
const CLOUDINARY_UPLOAD_URL = import.meta.env.VITE_CLOUDINARY_UPLOAD_URL;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// --- HELPER: FORMAT DATE (YYYY-MM-DD -> DD/MM/YYYY) ---
function formatDateDisplay(isoString) {
  if (!isoString) return "";
  const parts = isoString.split("-"); // [YYYY, MM, DD]
  if (parts.length !== 3) return isoString;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const inputStyle = {
  padding: "8px",
  margin: "5px 0 10px 0",
  border: "1px solid #ccc",
  borderRadius: "4px",
  boxSizing: "border-box",
  display: "block",
};

const card = {
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  maxWidth: "600px",
  margin: "20px auto",
  background: "#fff",
};

const applyBtn = {
  padding: "10px 20px",
  borderRadius: "4px",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
  background: "#007bff",
  color: "white",
  transition: "background 0.3s",
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
    
    // SLOTS
    slotId: "",
    durationType: "months",
    durationValue: "",
    
    // CALCULATED (Stored as YYYY-MM-DD for logic, formatted for display)
    preferredStartDate: "",
    preferredEndDate: "",
    
    receivedConfirmation: "No",
    confirmationNumber: "",
  });

  const [coverLetterFile, setCoverLetterFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showOtherCollege, setShowOtherCollege] = useState(false);
  
  // Data Lists
  const [masterCollegeList, setMasterCollegeList] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [slots, setSlots] = useState([]); 
  const [loadingSlots, setLoadingSlots] = useState(true);

  // 1. Refresh basic fields
  useEffect(() => {
    setForm((f) => ({
      ...f,
      fullname: profile?.fullname || "",
      phone: profile?.phone || "",
      discipline: profile?.discipline || "",
      email: user?.email || "",
    }));
  }, [profile, user]);

  // 2. Load Colleges AND Filtered Slots
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoadingColleges(true);
      setLoadingSlots(true);
      try {
        // Fetch Colleges
        const colSnap = await getDocs(collection(db, "colleges_master"));
        const cols = [];
        colSnap.forEach((d) => {
          const data = d.data();
          cols.push({ id: d.id, name: data.name || data.collegeName || "" });
        });

        // Fetch Slots
        const slotRef = collection(db, "trainingSlots");
        const slotSnap = await getDocs(slotRef);
        let slotList = slotSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // --- FILTERING LOGIC ---
        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        slotList = slotList.filter(s => {
            const isActive = s.isActive !== false;
            if (!isActive) return false;

            const start = new Date(s.startDate);
            const year = start.getFullYear();
            const month = start.getMonth();
            const day = start.getDate();

            let end = new Date(year, month, 1); 
            if (day <= 15) {
                end = new Date(year, month, 15);
            } else {
                end = new Date(year, month + 1, 0); 
            }
            end.setHours(23, 59, 59, 999);
            return today <= end;
        });

        // Sort by startDate
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

  // 3. Toggle "Other" college fields
  useEffect(() => {
    setShowOtherCollege(form.collegeSelected === "Other");
  }, [form.collegeSelected]);

  // 4. Calculate Dates
  useEffect(() => {
    calculateDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.slotId, form.durationType, form.durationValue, slots]);

  function calculateDates() {
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

    const startStr = start.toISOString().split('T')[0]; // Keep logic as YYYY-MM-DD
    const endStr = end.toISOString().split('T')[0];

    setForm(f => ({ ...f, preferredStartDate: startStr, preferredEndDate: endStr }));
  }

  const filteredColleges = masterCollegeList
    .filter((c) =>
      c.name.toLowerCase().includes(form.collegeSearch.toLowerCase())
    )
    .slice(0, 10);

  function handleCollegeSelect(name) {
    setForm((f) => ({
      ...f,
      collegeSearch: name,
      collegeSelected: name,
      college: name === "Other" ? f.college : { ...f.college, name },
    }));
  }

  function validate() {
    if (!form.fullname.trim()) return "Full name is required.";
    if (!/^\d{10}$/.test(form.phone)) return "Enter a valid 10-digit mobile number.";
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email address.";
    if (!form.discipline.trim()) return "Please provide your discipline/branch.";
    
    if (!form.collegeSelected) return "Please select or provide your college.";

    if (form.collegeSelected === "Other") {
      if (!form.college.name.trim()) return "Please enter your college name.";
      if (!form.college.address.trim()) return "Please enter your college address.";
      if (!/^\d{6}$/.test(form.college.pincode)) return "Enter a valid 6-digit college pincode.";
      if (!/^\d{7,15}$/.test(form.college.contact.replace(/\D/g, ""))) return "Enter a valid college contact number.";
    }

    if (!form.internshipType) return "Please select the internship type.";
    
    // Slot Validation
    if (!form.slotId) return "Please select a Training Slot.";
    if (!form.durationValue) return "Please enter the training duration.";
    if (!form.preferredStartDate || !form.preferredEndDate) return "Invalid date calculation.";

    if (!form.receivedConfirmation) return "Please indicate if you've received confirmation.";
    if (form.receivedConfirmation === "Yes") {
      if (!/^[A-Za-z0-9\-]{4,40}$/.test(form.confirmationNumber.trim()))
        return "Please enter a valid confirmation number.";
    }

    if (coverLetterFile) {
      if (coverLetterFile.size > 2 * 1024 * 1024) return "Cover letter file must be under 2MB.";
      const allowedTypes = ["image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(coverLetterFile.type)) return "Invalid file type. Please upload a JPG or JPEG.";
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) return toast.warn(err);

    setSubmitting(true);
    try {
      let coverLetterURL = "";

      if (coverLetterFile) {
        toast.info("Uploading cover letter...");
        const formData = new FormData();
        formData.append("file", coverLetterFile);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(CLOUDINARY_UPLOAD_URL, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error("Cover letter upload failed: " + text);
        }
        const data = await res.json();
        coverLetterURL = data.secure_url;
        toast.info("Upload successful.");
      }

      let tempCollegeRef = null;
      if (form.collegeSelected === "Other") {
        const sanitizedContact = (form.college.contact || "").replace(/\D/g, "");
        const collegePayload = {
          name: form.college.name.trim(),
          address: form.college.address.trim(),
          pincode: form.college.pincode,
          contact: sanitizedContact,
          submittedBy: user.uid,
          submittedByEmail: user?.email || "",
          submittedAt: serverTimestamp(),
          status: "pending",
        };
        const colDoc = await addDoc(collection(db, "colleges_temp"), collegePayload);
        tempCollegeRef = {
          id: colDoc.id,
          path: `colleges_temp/${colDoc.id}`,
        };
      }

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
        
        // We save dates as YYYY-MM-DD (easier for backend/sorting)
        // If you specifically need DD/MM/YYYY in database, change here, 
        // but typically database uses ISO and frontend formats it.
        preferredStartDate: form.preferredStartDate,
        preferredEndDate: form.preferredEndDate,
        
        durationDetails: {
            slotId: form.slotId,
            type: form.durationType,
            value: form.durationValue
        },

        receivedConfirmation: form.receivedConfirmation === "Yes",
        confirmationNumber: form.receivedConfirmation === "Yes" ? form.confirmationNumber.trim() : "",
        coverLetterURL,
        createdAt: serverTimestamp(),
        status: "pending",
        paymentStatus: "pending"
      };

      await addDoc(collection(db, "applications"), payload);
      toast.success("Application submitted successfully.");
      setShowApplyForm(false);

      if (reload) {
        await reload(user.uid);
      }
    } catch (err) {
      console.error("Failed to Submit Application:", err);
      toast.error("Failed to Submit: " + (err.message || err.code));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={card}>
      <h3>Apply for Internship / OJT / VT</h3>
      <form onSubmit={handleSubmit}>
        <label>Full Name</label>
        <input style={{ ...inputStyle, width: "100%" }} value={form.fullname} readOnly />

        <label>Discipline / Branch</label>
        <input style={{ ...inputStyle, width: "100%" }} value={form.discipline} readOnly />

        <div style={{display: 'flex', gap: 10}}>
            <div style={{flex: 1}}>
                <label>Mobile number</label>
                <input style={{ ...inputStyle, width: "100%" }} value={form.phone} readOnly />
            </div>
            <div style={{flex: 2}}>
                <label>Email</label>
                <input style={{ ...inputStyle, width: "100%" }} value={form.email} readOnly />
            </div>
        </div>

        {/* --- COLLEGE SEARCH SECTION --- */}
        <label>College (search & select)</label>
        <input
          style={{ ...inputStyle, width: "100%" }}
          placeholder={loadingColleges ? "Loading colleges..." : "Search your college..."}
          value={form.collegeSearch}
          onChange={(e) => setForm((f) => ({ ...f, collegeSearch: e.target.value }))}
        />

        {form.collegeSearch && (
          <div style={{ maxHeight: 140, overflowY: "auto", border: "1px solid #eee", padding: 6, marginBottom: 8 }}>
            {!loadingColleges && filteredColleges.map((c) => (
              <div
                key={c.id}
                onClick={() => handleCollegeSelect(c.name)}
                style={{
                  padding: "6px 8px", cursor: "pointer", borderRadius: 4, marginBottom: 4,
                  background: form.collegeSelected === c.name ? "#f0f8ff" : "transparent",
                }}
              >
                {c.name}
              </div>
            ))}
            <div
              onClick={() => handleCollegeSelect("Other")}
              style={{
                padding: "6px 8px", cursor: "pointer", borderRadius: 4, fontWeight: 600,
                background: form.collegeSelected === "Other" ? "#f0f8ff" : "transparent",
              }}
            >
              Other
            </div>
          </div>
        )}

        {showOtherCollege && (
          <div style={{border: '1px solid #eee', padding: 10, borderRadius: 6, marginBottom: 10}}>
            <h4 style={{ margin: "0 0 10px 0" }}>College details (Other)</h4>
            <input
              style={{ ...inputStyle, width: "100%" }}
              value={form.college.name}
              onChange={(e) => setForm((f) => ({ ...f, college: { ...f.college, name: e.target.value } }))}
              placeholder="College name"
            />
            <input
              style={{ ...inputStyle, width: "100%" }}
              value={form.college.address}
              onChange={(e) => setForm((f) => ({ ...f, college: { ...f.college, address: e.target.value } }))}
              placeholder="Address"
            />
            <div style={{display: 'flex', gap: 10}}>
                <input
                  style={{ ...inputStyle, width: "100%" }}
                  value={form.college.pincode}
                  onChange={(e) => setForm((f) => ({ ...f, college: { ...f.college, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) } }))}
                  placeholder="Pincode"
                />
                <input
                  style={{ ...inputStyle, width: "100%" }}
                  value={form.college.contact}
                  onChange={(e) => setForm((f) => ({ ...f, college: { ...f.college, contact: e.target.value } }))}
                  placeholder="Contact"
                />
            </div>
          </div>
        )}

        <label style={{ marginTop: 8 }}>Apply for</label>
        <select
          style={{ ...inputStyle, width: "100%" }}
          value={form.internshipType}
          onChange={(e) => setForm((f) => ({ ...f, internshipType: e.target.value }))}
        >
          <option value="">Select</option>
          <option>Industrial Training</option>
          <option>Summer Internship</option>
          <option>Project Work</option>
        </select>

        {/* --- SLOT & DURATION SECTION --- */}
        <div style={{background: '#f9f9f9', padding: 15, borderRadius: 8, margin: '15px 0'}}>
            <label>Select Training Slot (Future & Active Only)</label>
            <select
                style={{...inputStyle, width: '100%'}}
                value={form.slotId}
                onChange={e => setForm(f => ({...f, slotId: e.target.value}))}
            >
                <option value="">-- Choose Start Date --</option>
                {loadingSlots ? <option>Loading...</option> : 
                    slots.map(s => (
                        // CHANGED: Format slot display date here
                        <option key={s.id} value={s.id}>
                            {s.label} (Starts: {formatDateDisplay(s.startDate)})
                        </option>
                    ))
                }
            </select>

            <div style={{display: 'flex', gap: 10, marginTop: 10}}>
                <div style={{flex: 1}}>
                    <label>Duration Unit</label>
                    <select
                        style={{...inputStyle, width: '100%'}}
                        value={form.durationType}
                        onChange={e => setForm(f => ({...f, durationType: e.target.value}))}
                    >
                        <option value="months">Months</option>
                        <option value="weeks">Weeks</option>
                        <option value="days">Days</option>
                    </select>
                </div>
                <div style={{flex: 1}}>
                    <label>Duration Value</label>
                    <input 
                        type="number"
                        min="1"
                        style={{...inputStyle, width: '100%'}}
                        value={form.durationValue}
                        onChange={e => setForm(f => ({...f, durationValue: e.target.value}))}
                        placeholder="e.g. 2"
                    />
                </div>
            </div>

            <div style={{display: 'flex', gap: 10, marginTop: 10}}>
                <div style={{flex: 1}}>
                    <label>Start Date</label>
                    <input 
                        // CHANGED: Type="text" and formatted value
                        type="text"
                        style={{...inputStyle, width: '100%', background: '#eee'}}
                        value={formatDateDisplay(form.preferredStartDate)}
                        readOnly
                        placeholder="Auto-calculated"
                    />
                </div>
                <div style={{flex: 1}}>
                    <label>End Date</label>
                    <input 
                        // CHANGED: Type="text" and formatted value
                        type="text"
                        style={{...inputStyle, width: '100%', background: '#eee'}}
                        value={formatDateDisplay(form.preferredEndDate)}
                        readOnly
                        placeholder="Auto-calculated"
                    />
                </div>
            </div>
        </div>

        <label>Recommendation Letter (JPG/JPEG, max 2MB)</label>
        <input
          type="file"
          style={{ ...inputStyle, width: "100%", padding: 5 }}
          accept="image/jpeg"
          onChange={(e) => setCoverLetterFile(e.target.files[0] || null)}
        />

        <label>Already received confirmation?</label>
        <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="radio"
              checked={form.receivedConfirmation === "Yes"}
              onChange={() => setForm((f) => ({ ...f, receivedConfirmation: "Yes" }))}
            /> Yes
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="radio"
              checked={form.receivedConfirmation === "No"}
              onChange={() => setForm((f) => ({ ...f, receivedConfirmation: "No", confirmationNumber: "" }))}
            /> No
          </label>
        </div>

        {form.receivedConfirmation === "Yes" && (
          <>
            <label>Confirmation number</label>
            <input
              style={inputStyle}
              value={form.confirmationNumber}
              onChange={(e) => setForm((f) => ({ ...f, confirmationNumber: e.target.value }))}
              placeholder="Confirmation number"
              required
            />
          </>
        )}

        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <button type="submit" disabled={submitting} style={applyBtn}>
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
          <button
            type="button"
            onClick={() => setShowApplyForm(false)}
            style={{ ...applyBtn, background: "#6c757d", marginLeft: 10 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}