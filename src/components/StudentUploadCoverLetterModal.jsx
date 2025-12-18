// src/components/StudentUploadCoverLetterModal.jsx
import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

// Cloudinary Config
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
// Check if keys exist
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
  console.error("MISSING CLOUDINARY KEYS IN .env FILE");
}

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const MAX_FILE_SIZE_MB = 2;

export default function StudentUploadCoverLetterModal({
  app,
  user,
  onClose,
  onComplete,
}) {
  const [uploading, setUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);

  async function handleUpload() {
    // 1. Basic Checks
    if (!user) return toast.error("Authentication required.");
    if (!fileToUpload) return toast.warn("Please select a file.");
    
    // 2. Environment Check
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error("System Configuration Error: Cloudinary keys missing.");
      return;
    }

    // 3. Size Validation
    if (fileToUpload.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    // 4. Type Validation (Added png and jpg support)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(fileToUpload.type)) {
      toast.error("Invalid file type. Please upload JPG, JPEG, or PNG.");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    // Unique ID for the file
    const publicId = `reco-letter/${app.id}_${user.uid}_${Date.now()}`;
    formData.append("public_id", publicId);

    try {
      // 5. Upload to Cloudinary
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.secure_url) {
        const uploadedURL = data.secure_url;

        // 6. Update Firestore
        const ref = doc(db, "applications", app.id);
        await updateDoc(ref, {
          coverLetterURL: uploadedURL,
          // coverLetterRequested: false, // Optional: reset this if needed
          updatedAt: serverTimestamp(),
        });

        toast.success("Letter uploaded successfully!");
        if (onComplete) await onComplete();
      } else {
        console.error("Cloudinary Error:", data);
        throw new Error(data.error?.message || "Upload failed.");
      }
    } catch (err) {
      console.error("Upload Logic Error:", err);
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      if (onClose) onClose();
    }
  }

  if (!app) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 0, top: 0, right: 0, bottom: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
      }}
    >
      <div style={{ width: 500, background: "#fff", padding: 30, borderRadius: 8 }}>
        <h3>Upload Recommendation Letter</h3>
        <p style={{ fontSize: 14, color: "#555" }}>Application: {app.internshipType}</p>
        <hr style={{ margin: "15px 0" }} />

        <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
          Select Image (JPG/JPEG, Max 2MB):
        </label>
        <input
          type="file"
          accept="image/jpeg, image/png, image/jpg"
          onChange={(e) => setFileToUpload(e.target.files[0] || null)}
          style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
        />

        <div style={{ marginTop: 20, textAlign: "right", display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={() => onClose && onClose()}
            disabled={uploading}
            style={{ padding: "10px 15px", background: "#6c757d", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !fileToUpload}
            style={{ padding: "10px 15px", background: "#198754", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
          >
            {uploading ? "Uploading..." : "Upload File"}
          </button>
        </div>
      </div>
    </div>
  );
}