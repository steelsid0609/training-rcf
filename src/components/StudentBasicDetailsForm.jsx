// src/components/StudentBasicDetailsForm.jsx
import { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

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
  });

  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Local styles
  const card = {
    background: "#fff",
    padding: 18,
    marginTop: 12,
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  };

  const inputStyle = {
    display: "block",
    width: "100%",
    margin: "8px 0 12px 0",
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
  };

  const applyBtn = {
    background: "#006400",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: 600,
  };

  // Lookup pincode and auto-fill city and state
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

      if (
        result?.Status === "Success" &&
        Array.isArray(result.PostOffice) &&
        result.PostOffice.length > 0
      ) {
        const po = result.PostOffice[0];
        setForm((f) => ({ ...f, city: po.District, state: po.State }));
      } else {
        setForm((f) => ({ ...f, city: "", state: "" }));
        toast.warn("Pincode not found");
      }
    } catch (err) {
      console.error("Pincode Lookup Failed:", err);
      toast.error("Failed to auto-fill city/state from pincode. Enter manually.");
    } finally {
      setPincodeLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.fullname.trim()) {
      toast.warn("Please enter Full Name");
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      toast.warn("Please enter valid 10-digit Phone Number");
      return;
    }
    if (!/^\d{6}$/.test(form.pincode)) {
      toast.warn("Please enter valid 6-digit Pincode");
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const payload = {
        fullname: form.fullname,
        phone: form.phone,
        addressLine: form.addressLine || "",
        pincode: form.pincode,
        city: form.city || "",
        state: form.state || "",
        discipline: form.discipline || "",
        email: form.email,
        updatedAt: serverTimestamp(),
      };

      await setDoc(userRef, payload, { merge: true });
      toast.success("Profile saved successfully.");

      if (onCompleted) {
        await onCompleted();
      }

      // 🔥 redirect to student dashboard
      navigate("/student/dashboard");
    } catch (err) {
      console.error("Failed to Save Basic Info:", err);
      if (err.code === "permission-denied") {
        toast.error("You do not have permission to perform this action.");
      } else {
        toast.error("Failed to save profile: " + (err.message || err.code));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={card}>
      <h3>Complete your basic information</h3>
      <p>
        Please provide your name, mobile number and address (pincode, city,
        state).
      </p>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          style={{
            ...inputStyle,
            background: "#f2f2f2",
            cursor: "not-allowed",
            width: "300px",
          }}
          value={form.email}
          readOnly
        />

        <label>Full name</label>
        <input
          required
          style={{ ...inputStyle, width: "500px" }}
          value={form.fullname}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, fullname: e.target.value }))
          }
          placeholder="Your full name"
        />

        <label>Discipline / Branch</label>
        <input
          required
          style={{ ...inputStyle, width: "300px" }}
          value={form.discipline}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, discipline: e.target.value }))
          }
          placeholder="e.g. Mechanical, Electrical, Computer Science"
        />

        <label>Mobile number</label>
        <input
          required
          style={{ ...inputStyle, width: "200px" }}
          value={form.phone}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              phone: e.target.value.replace(/\D/g, "").slice(0, 10),
            }))
          }
          placeholder="10-digit mobile number"
        />

        <label>Address line (house/street)</label>
        <input
          style={{ ...inputStyle, width: "800px" }}
          value={form.addressLine}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, addressLine: e.target.value }))
          }
          placeholder="House / Street / Locality"
        />

        <label>Pincode</label>
        <input
          required
          style={{ ...inputStyle, width: "100px" }}
          value={form.pincode}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 6);
            setForm((prev) => ({ ...prev, pincode: v }));

            if (v.length === 6) {
              lookupPincode(v);
            } else {
              setForm((prev) => ({ ...prev, city: "", state: "" }));
            }
          }}
          placeholder="6-digit PIN code"
        />
        {pincodeLoading && (
          <div style={{ fontSize: 13, marginTop: -8 }}>
            Looking up city/state...
          </div>
        )}

        <label>City</label>
        <input
          required
          style={{ ...inputStyle, width: "200px" }}
          value={form.city}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, city: e.target.value }))
          }
          placeholder="City (auto-filled from pincode)"
        />

        <label>State</label>
        <input
          required
          style={{ ...inputStyle, width: "200px" }}
          value={form.state}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, state: e.target.value }))
          }
          placeholder="State (auto-filled from pincode)"
        />

        <div style={{ marginTop: 10 }}>
          <button type="submit" disabled={loading} style={applyBtn}>
            {loading ? "Saving..." : "Submit & Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
