import { useState } from "react";
import { db } from "../firebase";
import { doc, updateDoc, serverTimestamp, arrayUnion, increment, Timestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { generateApprovalLetterPDF } from "../utils/pdfGenerator"; // Import generator

// Cloudinary Config
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export function useApplicationActions(user) {
  const [working, setWorking] = useState(false);

  // Helper to upload file/blob to Cloudinary
  const uploadFile = async (file, publicId) => {
    const formData = new FormData();
    // Check if it's a PDF Blob (generated) or a File (uploaded)
    if (file instanceof Blob) {
      formData.append("file", file, "document.pdf");
    } else {
      formData.append("file", file);
    }
    formData.append("upload_preset", UPLOAD_PRESET);
    if(publicId) formData.append("public_id", publicId);

    const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Upload failed");
    return json.secure_url;
  };

  // --- 1. APPROVE (Pending -> Approved) ---
  const approveApplication = async (app, finalFormData) => {
    setWorking(true);
    const toastId = toast.loading("Generating Approval Letter & Finalizing...");

    try {
      // A. Generate Approval Letter PDF
      // We use finalFormData because it contains the confirmed Actual Dates
      const pdfBlob = generateApprovalLetterPDF(app, {
        actualStartDate: finalFormData.actualStartDate,
        actualEndDate: finalFormData.actualEndDate
      });

      // B. Upload Letter to Cloudinary
      const letterUrl = await uploadFile(pdfBlob, `approval_letter_${app.id}_${Date.now()}`);

      // C. Update Firestore
      const appRef = doc(db, "applications", app.id);
      
      await updateDoc(appRef, {
        status: "approved",
        approvedBy: user.uid,
        approvedAt: serverTimestamp(),
        
        // Save Actual Dates
        actualStartDate: finalFormData.actualStartDate,
        actualEndDate: finalFormData.actualEndDate,
        
        // Save Slot
        durationDetails: { 
          ...app.durationDetails, 
          slotId: finalFormData.slotId 
        },

        // Save Generated Letter URL
        approvalLetterURL: letterUrl 
      });

      // D. Update Slot Count
      if (finalFormData.slotId) {
        const slotRef = doc(db, "trainingSlots", finalFormData.slotId);
        await updateDoc(slotRef, { applicationCount: increment(1) });
      }

      toast.update(toastId, { render: "Approved & Letter Issued! ✅", type: "success", isLoading: false, autoClose: 3000 });
    } catch (err) {
      console.error(err);
      toast.update(toastId, { render: "Approval failed: " + err.message, type: "error", isLoading: false, autoClose: 4000 });
    } finally {
      setWorking(false);
    }
  };

  // --- 2. REJECT ---
  const rejectApplication = async (appId, reason) => {
    if (!reason) return;
    setWorking(true);
    try {
      await updateDoc(doc(db, "applications", appId), {
        status: "rejected",
        rejectedBy: user.uid,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason
      });
      toast.info("Application Rejected ❌");
    } catch (err) {
      toast.error("Rejection failed: " + err.message);
    } finally {
      setWorking(false);
    }
  };

  // --- 3. VERIFY PAYMENT ---
  const verifyPayment = async (appId) => {
    setWorking(true);
    try {
      await updateDoc(doc(db, "applications", appId), {
        paymentStatus: "verified",
        status: "pending_confirmation",
        paymentVerifiedBy: user.uid,
        paymentVerifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Payment Verified 💰");
    } catch (err) {
      toast.error("Verification failed: " + err.message);
    } finally {
      setWorking(false);
    }
  };

  // --- 4. REJECT PAYMENT ---
  const rejectPayment = async (appId, reason) => {
    setWorking(true);
    try {
      await updateDoc(doc(db, "applications", appId), {
        paymentStatus: "rejected",
        paymentRejectReason: reason,
        updatedAt: serverTimestamp()
      });
      toast.warn("Payment Rejected ⚠️");
    } catch (err) {
      toast.error("Action failed: " + err.message);
    } finally {
      setWorking(false);
    }
  };

  // --- 5. ISSUE POSTING LETTER ---
  const issuePostingLetter = async (app, period, plant, fileOrBlob) => {
    setWorking(true);
    const toastId = toast.loading("Issuing Posting Letter...");
    try {
      // Upload
      const url = await uploadFile(fileOrBlob, `posting_${app.id}_${Date.now()}`);

      const newLetter = {
        period,
        plant,
        url: url,
        issuedAt: Timestamp.now(),
        issuedBy: user.uid,
        id: Date.now().toString()
      };

      const updates = {
        postingLetters: arrayUnion(newLetter),
        updatedAt: serverTimestamp()
      };

      if (app.status === "pending_confirmation") {
        updates.status = "in_progress";
        updates.internshipStartedAt = serverTimestamp();
        updates.internshipStartedBy = user.uid;
      }

      await updateDoc(doc(db, "applications", app.id), updates);
      toast.update(toastId, { render: "Posting Letter Issued! 📝", type: "success", isLoading: false, autoClose: 3000 });
    } catch (err) {
      console.error(err);
      toast.update(toastId, { render: "Failed: " + err.message, type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setWorking(false);
    }
  };

  // --- 6. MARK COMPLETED ---
  const markCompleted = async (appId) => {
    setWorking(true);
    try {
      await updateDoc(doc(db, "applications", appId), {
        status: "completed",
        completedBy: user.uid,
        completedAt: serverTimestamp()
      });
      toast.success("Internship Completed 🏁");
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setWorking(false);
    }
  };

  return {
    working,
    approveApplication,
    rejectApplication,
    verifyPayment,
    rejectPayment,
    issuePostingLetter,
    markCompleted
  };
}