// src/components/student/ChangePasswordSection.jsx
import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

export default function ChangePasswordSection({ compact = false }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSendReset = async () => {
    if (!user?.email) return;
    try {
      setBusy(true);
      await sendPasswordResetEmail(auth, user.email);
      setStatus("Password reset link sent to your email.");
    } catch (err) {
      console.error(err);
      setStatus("Failed to send reset link. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!user) return <p>No user logged in.</p>;

  return (
    <div>
      {!compact && <h1>Change Password</h1>}
      {compact && <h3>Change Password</h3>}

      <p style={{ marginBottom: 8, marginTop: 4 }}>
        Click below to receive a password reset link on your registered email:
        <strong> {user.email}</strong>
      </p>
      <button onClick={handleSendReset} disabled={busy}>
        {busy ? "Sending..." : "Send Reset Link"}
      </button>
      {status && <p style={{ marginTop: 8 }}>{status}</p>}
    </div>
  );
}
