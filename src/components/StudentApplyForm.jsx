// src/components/StudentApplyForm.jsx
import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
const CLOUDINARY_UPLOAD_URL = import.meta.env.VITE_CLOUDINARY_UPLOAD_URL;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

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
    bloodGroup: "",
    collegeSearch: "",
    collegeSelected: "",
    college: { name: "", address: "", pincode: "", contact: "" },
    internshipType: "",
    preferredStartDate: "",
    preferredEndDate: "",
    receivedConfirmation: "No",
    confirmationNumber: "",
  });

  const [coverLetterFile, setCoverLetterFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showOtherCollege, setShowOtherCollege] = useState(false);
  const [masterCollegeList, setMasterCollegeList] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(true);

  // refresh basic fields if profile/user changes
  useEffect(() => {
    setForm((f) => ({
      ...f,
      fullname: profile?.fullname || "",
      phone: profile?.phone || "",
      discipline: profile?.discipline || "",
      email: user?.email || "",
    }));
  }, [profile, user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingColleges(true);
      try {
        const snap = await getDocs(collection(db, "colleges_master"));
        const cols = [];
        snap.forEach((d) => {
          const data = d.data();
          cols.push({ id: d.id, name: data.name || data.collegeName || "" });
        });
        if (!cancelled) setMasterCollegeList(cols);
      } catch (err) {
        console.error("Failed to load master college list:", err);
        if (!cancelled) setMasterCollegeList([]);
      } finally {
        if (!cancelled) setLoadingColleges(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setShowOtherCollege(form.collegeSelected === "Other");
  }, [form.collegeSelected]);

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
    if (!/^\d{10}$/.test(form.phone))
      return "Enter a valid 10-digit mobile number.";
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email))
      return "Enter a valid email address.";
    if (!form.discipline.trim())
      return "Please provide your discipline/branch.";
    if (!form.bloodGroup) return "Please select your blood group.";
    if (!form.collegeSelected) return "Please select or provide your college.";

    if (form.collegeSelected === "Other") {
      if (!form.college.name.trim())
        return "Please enter your college name.";
      if (!form.college.address.trim())
        return "Please enter your college address.";
      if (!/^\d{6}$/.test(form.college.pincode))
        return "Enter a valid 6-digit college pincode.";
      if (
        !/^\d{7,15}$/.test(form.college.contact.replace(/\D/g, ""))
      )
        return "Enter a valid college contact number (7-15 digits).";
    }

    if (!form.internshipType)
      return "Please select the internship type.";
    if (!form.preferredStartDate)
      return "Please select a start date.";
    if (!form.preferredEndDate)
      return "Please select an end date.";
    if (
      new Date(form.preferredEndDate) <
      new Date(form.preferredStartDate)
    )
      return "End date cannot be before start date.";
    if (!form.receivedConfirmation)
      return "Please indicate if you've received confirmation.";
    if (form.receivedConfirmation === "Yes") {
      if (!/^[A-Za-z0-9\-]{4,40}$/.test(form.confirmationNumber.trim()))
        return "Please enter a valid confirmation number (4+ alphanumeric chars).";
    }

    if (coverLetterFile) {
      if (coverLetterFile.size > 2 * 1024 * 1024) {
        return "Cover letter file must be under 2MB.";
      }
      const allowedTypes = ["image/jpeg"];
      if (!allowedTypes.includes(coverLetterFile.type)) {
        return "Invalid file type. Please upload a JPG or JPEG.";
      }
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
        const sanitizedContact = (form.college.contact || "").replace(
          /\D/g,
          ""
        );
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
        const colDoc = await addDoc(
          collection(db, "colleges_temp"),
          collegePayload
        );
        tempCollegeRef = {
          id: colDoc.id,
          path: `colleges_temp/${colDoc.id}`,
        };
      }

      const collegeInfo =
        form.collegeSelected === "Other"
          ? { name: form.college.name.trim(), tempCollegeRef }
          : { name: form.collegeSelected };

      const payload = {
        createdBy: user.uid,
        studentName: form.fullname,
        email: form.email,
        phone: form.phone,
        bloodGroup: form.bloodGroup,
        college: collegeInfo,
        internshipType: form.internshipType,
        preferredStartDate: form.preferredStartDate,
        preferredEndDate: form.preferredEndDate,
        receivedConfirmation: form.receivedConfirmation === "Yes",
        confirmationNumber:
          form.receivedConfirmation === "Yes"
            ? form.confirmationNumber.trim()
            : "",
        coverLetterURL,
        createdAt: serverTimestamp(),
        status: "pending",
      };

      await addDoc(collection(db, "applications"), payload);
      toast.success("Application submitted successfully.");
      setShowApplyForm(false);

      if (reload) {
        await reload(user.uid);
      }
    } catch (err) {
      console.error("Failed to Submit Application:", err);
      if (err.code === "permission-denied") {
        toast.error("You do not have permission to perform this action.");
      } else {
        toast.error(
          "Failed to Submit Application: " + (err.message || err.code)
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={card}>
      <h3>Apply for Internship / OJT / VT</h3>
      <form onSubmit={handleSubmit}>
        <label>Full Name</label>
        <input
          style={{ ...inputStyle, width: "570px" }}
          value={form.fullname}
          readOnly
        />

        <label>Discipline / Branch</label>
        <input
          style={{ ...inputStyle, width: "400px" }}
          value={form.discipline}
          readOnly
        />

        <label>Mobile number</label>
        <input
          style={{ ...inputStyle, width: "150px" }}
          value={form.phone}
          readOnly
        />

        <label>Email</label>
        <input
          style={{ ...inputStyle, width: "300px" }}
          value={form.email}
          readOnly
        />

        <label>Blood Group</label>
        <select
          required
          style={{ ...inputStyle, width: "130px" }}
          value={form.bloodGroup}
          onChange={(e) =>
            setForm((f) => ({ ...f, bloodGroup: e.target.value }))
          }
        >
          <option value="">Select Group</option>
          <option>O+</option>
          <option>O-</option>
          <option>A+</option>
          <option>A-</option>
          <option>B+</option>
          <option>B-</option>
          <option>AB+</option>
          <option>AB-</option>
        </select>

        <label>College (search & select)</label>
        <input
          style={{ ...inputStyle, width: "570px" }}
          placeholder={
            loadingColleges ? "Loading colleges..." : "Search your college..."
          }
          value={form.collegeSearch}
          onChange={(e) =>
            setForm((f) => ({ ...f, collegeSearch: e.target.value }))
          }
        />

        {form.collegeSearch && (
          <div
            style={{
              maxHeight: 140,
              overflowY: "auto",
              border: "1px solid #eee",
              padding: 6,
              marginBottom: 8,
              width: "570px",
            }}
          >
            {loadingColleges && (
              <div style={{ padding: 6 }}>Loading colleges...</div>
            )}
            {!loadingColleges && filteredColleges.length === 0 && (
              <div style={{ padding: 6 }}>
                No matches. Click <strong>Other</strong> to provide college
                details.
              </div>
            )}
            {!loadingColleges &&
              filteredColleges.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleCollegeSelect(c.name)}
                  style={{
                    padding: "6px 8px",
                    cursor: "pointer",
                    background:
                      form.collegeSelected === c.name
                        ? "#f0f8ff"
                        : "transparent",
                    borderRadius: 4,
                    marginBottom: 4,
                  }}
                >
                  {c.name}
                </div>
              ))}
            <div
              onClick={() => handleCollegeSelect("Other")}
              style={{
                padding: "6px 8px",
                cursor: "pointer",
                background:
                  form.collegeSelected === "Other" ? "#f0f8ff" : "transparent",
                borderRadius: 4,
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              Other
            </div>
          </div>
        )}

        {showOtherCollege && (
          <>
            <h4 style={{ marginTop: 12 }}>College details (Other)</h4>

            <label>College name</label>
            <input
              style={{ ...inputStyle, width: "570px" }}
              value={form.college.name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  college: { ...f.college, name: e.target.value },
                }))
              }
              placeholder="College name"
              required={showOtherCollege}
            />

            <label>College address</label>
            <input
              style={{ ...inputStyle, width: "570px" }}
              value={form.college.address}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  college: { ...f.college, address: e.target.value },
                }))
              }
              placeholder="Address"
              required={showOtherCollege}
            />

            <label>College pincode</label>
            <input
              style={{ ...inputStyle, width: "200px" }}
              value={form.college.pincode}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  college: {
                    ...f.college,
                    pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                  },
                }))
              }
              placeholder="6-digit pincode"
              required={showOtherCollege}
            />

            <label>College contact number</label>
            <input
              style={{ ...inputStyle, width: "200px" }}
              value={form.college.contact}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  college: { ...f.college, contact: e.target.value },
                }))
              }
              placeholder="Contact number"
              required={showOtherCollege}
            />
          </>
        )}

        <label style={{ marginTop: 8 }}>Apply for</label>
        <select
          style={{ ...inputStyle, width: "200px" }}
          value={form.internshipType}
          onChange={(e) =>
            setForm((f) => ({ ...f, internshipType: e.target.value }))
          }
        >
          <option value="">Select</option>
          <option>Internship</option>
          <option>On Job Training</option>
          <option>Vocational Trainee</option>
        </select>

        <label>Start date</label>
        <input
          style={{ ...inputStyle, width: "180px" }}
          type="date"
          value={form.preferredStartDate}
          onChange={(e) =>
            setForm((f) => ({ ...f, preferredStartDate: e.target.value }))
          }
        />

        <label>End date</label>
        <input
          style={{ ...inputStyle, width: "180px" }}
          type="date"
          value={form.preferredEndDate}
          onChange={(e) =>
            setForm((f) => ({ ...f, preferredEndDate: e.target.value }))
          }
        />

        <label>Cover Letter (Optional, JPG/JPEG, max 2MB)</label>
        <input
          type="file"
          style={{ ...inputStyle, width: "570px", padding: 5 }}
          accept="image/jpeg"
          onChange={(e) =>
            setCoverLetterFile(e.target.files[0] || null)
          }
        />

        <label>Already received confirmation?</label>
        <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
          <label
            style={{ display: "flex", gap: 6, alignItems: "center" }}
          >
            <input
              type="radio"
              name="receivedConfirmation"
              checked={form.receivedConfirmation === "Yes"}
              onChange={() =>
                setForm((f) => ({ ...f, receivedConfirmation: "Yes" }))
              }
            />{" "}
            Yes
          </label>
          <label
            style={{ display: "flex", gap: 6, alignItems: "center" }}
          >
            <input
              type="radio"
              name="receivedConfirmation"
              checked={form.receivedConfirmation === "No"}
              onChange={() =>
                setForm((f) => ({
                  ...f,
                  receivedConfirmation: "No",
                  confirmationNumber: "",
                }))
              }
            />{" "}
            No
          </label>
        </div>

        {form.receivedConfirmation === "Yes" && (
          <>
            <label>Confirmation number</label>
            <input
              style={inputStyle}
              value={form.confirmationNumber}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  confirmationNumber: e.target.value,
                }))
              }
              placeholder="Confirmation number"
              required
            />
          </>
        )}

        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <button
            type="submit"
            disabled={submitting}
            style={applyBtn}
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>

          <button
            type="button"
            onClick={() => setShowApplyForm(false)}
            style={{
              ...applyBtn,
              background: "#6c757d",
              marginLeft: 10,
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
