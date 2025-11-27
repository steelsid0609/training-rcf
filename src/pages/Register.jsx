// src/pages/Register.jsx
import React, { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore"; // Added imports
import { auth, db } from "../firebase"; // Added db
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; // Good for consistency

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (!email.includes("@")) {
        toast.warning("Invalid email");
        setLoading(false);
        return;
    }

    try {
      // 1. Create Auth User
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;

      // 2. CRITICAL: Create Firestore Document immediately
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        role: "student", // Default role
        createdAt: serverTimestamp(),
        // Add empty placeholders so profile page doesn't crash later
        fullName: "",
        phone: "",
        collegeName: "", 
      });

      // 3. Send Verification
      await sendEmailVerification(user, {
        url: `${window.location.origin}/login`, // Redirect back to login after verify
        handleCodeInApp: true
      });

      toast.success("Registration success! Please check your email to verify.");
      nav("/"); 
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input type="email" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
        <br/>
        <input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <br/>
        <button type="submit" disabled={loading}>{loading ? "Registering..." : "Register"}</button>
      </form>
    </div>
  );
}