// src/components/StudentBasicDetailsForm.jsx
import { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; 
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function BasicDetailsForm({ user, existingProfile, onCompleted }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: user?.email || existingProfile?.email || "",
    fullname: existingProfile?.fullname || "",
    phone: existingProfile?.phone || "",
    discipline: existingProfile?.discipline || "",
    addressLine: existingProfile?.addressLine || "",
    pincode: existingProfile?.pincode || "",
    city: existingProfile?.city || "",
    state: existingProfile?.state || "",
    photoURL: existingProfile?.photoURL || "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // --- Logic for Pincode Lookup ---
  async function lookupPincode(pin) {
    if (!/^\d{6}$/.test(pin)) {
      setForm((f) => ({ ...f, city: "", state: "" }));
      return;
    }
    setPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      const result = Array.isArray(data) ? data[0] : null;

      if (result?.Status === "Success" && result.PostOffice?.length > 0) {
        const po = result.PostOffice[0];
        setForm((f) => ({ ...f, city: po.District, state: po.State }));
      } else {
        setForm((f) => ({ ...f, city: "", state: "" }));
        toast.warn("Pincode not found");
      }
    } catch (err) {
      toast.error("Failed to auto-fill city/state.");
    } finally {
      setPincodeLoading(false);
    }
  }

  // --- Submit Handler ---
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.fullname.trim()) return toast.warn("Please enter Full Name");
    if (!form.photoURL && !imageFile) return toast.warn("Please upload a profile photo");
    
    setLoading(true);
    try {
      let finalPhotoURL = form.photoURL;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("folder", "student_profiles");
        formData.append("public_id", `profile_${user.uid}_${Date.now()}`);

        const response = await fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: formData });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Upload failed");
        finalPhotoURL = data.secure_url;
      }

      const userRef = doc(db, "users", user.uid);
      const payload = {
        ...form,
        photoURL: finalPhotoURL,
        profileComplete: true,
        updatedAt: serverTimestamp(),
      };

      await setDoc(userRef, payload, { merge: true });
      toast.success("Profile updated successfully!");
      if (onCompleted) await onCompleted();
      navigate("/student/dashboard");
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <div style={styles.header}>
          <h2 style={styles.title}>Student Details</h2>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* --- Profile Photo Section --- */}
          <div style={styles.photoSection}>
            <div style={styles.photoContainer}>
              <img 
                src={imageFile ? URL.createObjectURL(imageFile) : (form.photoURL || "https://via.placeholder.com/120")} 
                alt="Profile Preview" 
                style={styles.profileImg}
              />
              <label style={styles.uploadLabel}>
                Change Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0] || null)}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <div style={styles.grid}>
            {/* Full Name */}
            <div style={styles.field}>
              <label style={styles.label}>Full Name *</label>
              <input
                required
                style={styles.input}
                value={form.fullname}
                onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                placeholder="Enter your legal name"
              />
            </div>

            {/* Email (Read Only) */}
            <div style={styles.field}>
              <label style={styles.label}>Email Address</label>
              <input
                style={{ ...styles.input, background: "#f8f9fa", color: "#6c757d" }}
                value={form.email}
                readOnly
              />
            </div>

            {/* Discipline */}
            <div style={styles.field}>
              <label style={styles.label}>Discipline / Branch *</label>
              <input
                required
                style={styles.input}
                value={form.discipline}
                onChange={(e) => setForm({ ...form, discipline: e.target.value })}
                placeholder="e.g. Mechanical Engineering"
              />
            </div>

            {/* Mobile */}
            <div style={styles.field}>
              <label style={styles.label}>Mobile Number *</label>
              <input
                required
                style={styles.input}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                placeholder="10-digit number"
              />
            </div>

            {/* Address - Full Width */}
            <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
              <label style={styles.label}>Address Line (House/Street) *</label>
              <input
                required
                style={styles.input}
                value={form.addressLine}
                onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                placeholder="Apt, Suite, Street Address"
              />
            </div>

            {/* Pincode */}
            <div style={styles.field}>
              <label style={styles.label}>Pincode *</label>
              <input
                required
                style={styles.input}
                value={form.pincode}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setForm({ ...form, pincode: v });
                  if (v.length === 6) lookupPincode(v);
                }}
                placeholder="6-digit PIN"
              />
              {pincodeLoading && <span style={styles.loadingText}>Fetching location...</span>}
            </div>

            {/* City */}
            <div style={styles.field}>
              <label style={styles.label}>City</label>
              <input
                required
                style={styles.input}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Auto-filled"
              />
            </div>

            {/* State */}
            <div style={styles.field}>
              <label style={styles.label}>State</label>
              <input
                required
                style={styles.input}
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="Auto-filled"
              />
            </div>
          </div>

          <div style={styles.footerAction}>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? "Processing..." : "Save Profile & Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "20px auto",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  formCard: {
    background: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  header: {
    paddingTop: 9,
    padding: "9px 40px 10px 40px",
    borderBottom: "1px solid #f0f0f0",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    color: "#1a1a1a",
    fontWeight: "700",
  },
  subtitle: {
    color: "#6c757d",
    marginTop: "8px",
    fontSize: "14px",
  },
  form: {
    padding: "30px 40px",
  },
  photoSection: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "30px",
  },
  photoContainer: {
    position: "relative",
    textAlign: "center",
  },
  profileImg: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid #e9ecef",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },
  uploadLabel: {
    display: "block",
    marginTop: "10px",
    color: "#006400",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    textDecoration: "underline",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#495057",
    marginBottom: "8px",
  },
  input: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #ced4da",
    fontSize: "14px",
    transition: "border-color 0.2s",
    outline: "none",
  },
  loadingText: {
    fontSize: "11px",
    color: "#006400",
    marginTop: "4px",
    fontStyle: "italic",
  },
  footerAction: {
    marginTop: "40px",
    textAlign: "center",
  },
  submitBtn: {
    background: "#006400",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "14px 40px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "transform 0.1s, background 0.2s",
    boxShadow: "0 4px 15px rgba(0, 100, 0, 0.2)",
  },
};