// src/components/StudentEditProfile.jsx
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

export default function StudentEditProfile({
  user,
  profile,
  setShowEdit,
  onSaved,
}) {
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [pincode, setPincode] = useState(profile?.pincode || "");

  async function save() {
    if (!user) {
      toast.error("Not signed in");
      return;
    }
    try {
      setSaving(true);
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, { fullName, phone, pincode });
      toast.success("Profile updated");
      if (onSaved) await onSaved();
      setShowEdit(false);
    } catch (err) {
      console.error("StudentEditProfile save error:", err);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 20, background: "#fff", borderRadius: 8 }}>
      <h3>Edit Profile</h3>
      <div>
        <label>Full name</label>
        <br />
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>
      <div style={{ marginTop: 8 }}>
        <label>Phone</label>
        <br />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>
      <div style={{ marginTop: 8 }}>
        <label>Pincode</label>
        <br />
        <input
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: "10px 14px",
            background: "#198754",
            color: "#fff",
            border: "none",
            borderRadius: 6,
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={() => setShowEdit(false)}
          style={{ marginLeft: 8, padding: "10px 14px" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
