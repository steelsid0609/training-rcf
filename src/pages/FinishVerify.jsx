import React, { useEffect, useState } from "react";
import { applyActionCode, checkActionCode, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function FinishVerify() {
  const [status, setStatus] = useState("checking"); // checking | need-code | processing | done | error | invalid | reset-input
  const [errorMessage, setErrorMessage] = useState("");
  const [manualCode, setManualCode] = useState("");
  
  // Password Reset State
  const [newPassword, setNewPassword] = useState("");
  const [resetCode, setResetCode] = useState(null);
  
  const nav = useNavigate();

  useEffect(() => {
    // 1. Your robust helper function
    function extractOobCode() {
      try {
        const qs = new URLSearchParams(window.location.search || "");
        let code = qs.get("oobCode");
        if (code) return { code, mode: qs.get("mode") || null };

        const hash = window.location.hash || "";
        if (hash) {
          const idx = hash.indexOf("?");
          const params = idx >= 0 ? new URLSearchParams(hash.slice(idx + 1)) : new URLSearchParams(hash);
          code = params.get("oobCode");
          if (code) return { code, mode: params.get("mode") || null };
        }
        return null;
      } catch (e) {
        console.warn("extractOobCode error", e);
        return null;
      }
    }

    // 2. Main Logic
    (async () => {
      setStatus("checking");
      const found = extractOobCode();
      
      if (!found || !found.code) {
        setStatus("need-code");
        return;
      }

      const { code, mode } = found;

      // --- LOGIC SPLIT START ---
      
      // CASE A: Email Verification
      if (mode === "verifyEmail") {
        setStatus("processing");
        try {
          await applyActionCode(auth, code);
          setStatus("done");
          toast.success("Email verified! Redirecting...");
          setTimeout(() => nav("/login"), 2000);
        } catch (err) {
          console.error("verify error", err);
          setStatus("error");
          setErrorMessage(err.message);
        }
      } 
      
      // CASE B: Password Reset (ADDED THIS)
      else if (mode === "resetPassword") {
        setStatus("processing");
        try {
          // Check if code is valid
          await verifyPasswordResetCode(auth, code);
          setResetCode(code); // Save code for submission
          setStatus("reset-input"); // Show input form
        } catch (err) {
          setStatus("error");
          setErrorMessage("This password reset link is invalid or expired.");
        }
      } 
      
      // CASE C: Unknown Mode
      else {
        setStatus("invalid");
        setErrorMessage(`This link is for "${mode}". Use the correct flow.`);
      }

    })();
  }, [nav]);

  // Handle Manual Code Submission (Fallback)
  async function handleManualSubmit(e) {
    e.preventDefault();
    const code = (manualCode || "").trim();
    if (!code) return toast.warn("Enter code from the email.");
    
    // Default to verification flow for manual input
    setStatus("processing");
    try {
      await applyActionCode(auth, code);
      setStatus("done");
      toast.success("Verified! Redirecting...");
      setTimeout(() => nav("/login"), 1500);
    } catch (err) {
        // If that fails, maybe it's a password reset code? 
        // (Complex to handle manually, usually easiest to just show error)
        setStatus("error");
        setErrorMessage(err.message);
    }
  }

  // Handle Password Reset Submission
  async function handlePasswordSubmit(e) {
      e.preventDefault();
      if(newPassword.length < 6) return toast.warn("Password too short");
      
      setStatus("processing");
      try {
          await confirmPasswordReset(auth, resetCode, newPassword);
          setStatus("done");
          toast.success("Password reset successfully! Redirecting...");
          setTimeout(() => nav("/login"), 2000);
      } catch (err) {
          setStatus("error");
          setErrorMessage(err.message);
      }
  }

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      {status === "checking" && <div>Checking verification link...</div>}
      {status === "processing" && <div>Processing... please wait...</div>}
      
      {status === "done" && (
        <div style={{textAlign: "center", color: "green"}}>
            <h3>Success!</h3>
            <p>Action completed. Redirecting to sign-in...</p>
        </div>
      )}

      {/* --- NEW: Password Reset Form --- */}
      {status === "reset-input" && (
         <div style={cardStyle}>
            <h3>Reset Password</h3>
            <form onSubmit={handlePasswordSubmit}>
                <input 
                    type="password" 
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={inputStyle}
                    required
                />
                <button type="submit" style={btnStyle}>Change Password</button>
            </form>
         </div>
      )}

      {status === "need-code" && (
        <div>
          <h3>Verification link incomplete</h3>
          <p>We couldn't find the code. Paste the full URL or code below:</p>
          <form onSubmit={handleManualSubmit} style={{ marginTop: 12 }}>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Paste oobCode here"
              style={{ width: "100%", padding: 8, marginBottom: 10 }}
            />
            <button type="submit" style={btnStyle}>Verify</button>
          </form>
        </div>
      )}

      {(status === "invalid" || status === "error") && (
        <div style={{color: "red"}}>
          <h3>Error</h3>
          <p>{errorMessage}</p>
          <button onClick={() => nav("/login")} style={{...btnStyle, background: "#666"}}>Back to Login</button>
        </div>
      )}
    </div>
  );
}

// Simple Styles
const cardStyle = {
    background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
};
const inputStyle = {
    width: "100%", padding: "10px", margin: "10px 0", borderRadius: "4px", border: "1px solid #ddd", boxSizing: "border-box"
};
const btnStyle = {
    padding: "10px 15px", background: "green", color: "white", border: "none", borderRadius: "4px", cursor: "pointer"
};