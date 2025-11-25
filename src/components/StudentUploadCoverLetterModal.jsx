// src/components/StudentUploadCoverLetterModal.jsx
import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

// Cloudinary Config (Environment variables)
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
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
    if (!user) {
      toast.error("Authentication required.");
      return;
    }
    if (!fileToUpload) {
      toast.warn("Please select an image file first.");
      return;
    }

    // Client-side file validation (JPG/JPEG, max 2MB)
    if (fileToUpload.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    const allowedTypes = ["image/jpeg"];
    if (!allowedTypes.includes(fileToUpload.type)) {
      toast.error("Invalid file type. Please upload a JPG or JPEG.");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const publicId = `cover-letter/${app.id}_${user.uid}_${Date.now()}`;
    formData.append("public_id", publicId);

    try {
      // 1. Upload file to Cloudinary
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.secure_url) {
        const uploadedURL = data.secure_url;

        // 2. Update Firestore document with the new URL
        const ref = doc(db, "applications", app.id);
        await updateDoc(ref, {
          coverLetterURL: uploadedURL,
          coverLetterRequested: false,
          updatedAt: serverTimestamp(),
        });

        toast.success("Cover letter image successfully uploaded!");
        if (onComplete) await onComplete();
      } else {
        throw new Error(data.error?.message || "Cloudinary upload failed.");
      }
    } catch (err) {
      console.error("StudentUploadCoverLetterModal error:", err);
      toast.error(err.message || "Upload failed: Check console.");
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
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.35)",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: 520,
          background: "#fff",
          padding: 30,
          borderRadius: 8,
        }}
      >
        <h3>Upload College Letter (JPG/JPEG)</h3>
        <p>Application: {app.internshipType || app.id}</p>
        <hr style={{ margin: "15px 0" }} />

        <div>
          <label
            style={{ display: "block", marginBottom: 5, fontWeight: 600 }}
          >
            Select JPG/JPEG File (Max 2MB):
          </label>
          <input
            type="file"
            accept="image/jpeg"
            onChange={(e) => setFileToUpload(e.target.files[0] || null)}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          />
        </div>

        <div style={{ marginTop: 20, textAlign: "right" }}>
          <button
            onClick={() => {
              if (onClose) onClose();
            }}
            disabled={uploading}
            style={{
              marginLeft: 8,
              padding: "10px 15px",
              background: "#6c757d",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !fileToUpload}
            style={{
              padding: "10px 15px",
              background: "#198754",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              marginLeft: 10,
            }}
          >
            {uploading ? "Uploading..." : "Upload File"}
          </button>
        </div>
      </div>
    </div>
  );
}
