// src/hooks/useApplicationActions.js
import { useState } from "react";
import { db } from "../firebase";
import { doc, updateDoc, serverTimestamp, arrayUnion, increment, Timestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { generateApprovalLetterPDF } from "../utils/pdfGenerator";
import { uploadFileToCloudinary } from "../utils/helpers"; // Use centralized helper

export function useApplicationActions(user) {
  const [working, setWorking] = useState(false);

  // --- 1. APPROVE (Pending -> Approved) ---
  const approveApplication = async (app, finalFormData) => {
    setWorking(true);
    const toastId = toast.loading("Generating Approval Letter & Finalizing...");

    try {
      // A. Generate Approval Letter PDF
      const pdfBlob = generateApprovalLetterPDF(app, {
        actualStartDate: finalFormData.actualStartDate,
        actualEndDate: finalFormData.actualEndDate
      });

      // B. Upload Letter to Cloudinary (Use centralized helper)
      const letterUrl = await uploadFileToCloudinary(pdfBlob, `approval_letter_${app.id}_${Date.now()}`);

      // C. Update Firestore
      const appRef = doc(db, "applications", app.id);
      
      await updateDoc(appRef, {
        status: "approved",
        approvedBy: user.uid,
        approvedAt: serverTimestamp(),
        
        // Save Actual Dates
        actualStartDate: finalFormData.actualStartDate,
        actualEndDate: finalFormData.actualEndDate,
        
        // Update the durationDetails object to reflect the final slotId
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

  // --- 2. REJECT (Pending -> Rejected) ---
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

  // --- 3. VERIFY PAYMENT (Approved -> Pending Confirmation) ---
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

  // --- 4. REJECT PAYMENT (Approved (Verification Pending) -> Approved (Rejected)) ---
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

  // --- 5. ISSUE POSTING LETTER (Pending Confirmation/In Progress -> In Progress) ---
  const issuePostingLetter = async (app, period, plant, fileOrBlob) => {
    setWorking(true);
    const toastId = toast.loading("Issuing Posting Letter...");
    try {
      // Upload (Use centralized helper)
      const url = await uploadFileToCloudinary(fileOrBlob, `posting_${app.id}_${Date.now()}`);

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

      // If it was PENDING_CONFIRMATION, now it starts.
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

  // --- 6. MARK COMPLETED (In Progress -> Completed) ---
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