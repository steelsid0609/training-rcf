// /src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { toast } from "react-toastify";
import bg from "../assets/left-bg.jpg";
import logo from "../assets/transparent-logo.png";
import { UI_STYLES, ROLES } from "../utils/constants";

export default function Login() {
  const navigate = useNavigate();
  
  // State to manage current view: 'login', 'register', 'forgot'
  const [viewMode, setViewMode] = useState('login');

  // ------------------ LOGIN State ------------------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ------------------ REGISTER State ------------------
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  // Removed regFullname, regPhone, regCollegeName state here
  const [regLoading, setRegLoading] = useState(false);

  // ------------------ FORGOT PASSWORD State ------------------
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);


  // ensures Firestore user doc exists and fetches role
  async function ensureUserAndGetRole(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    let role = ROLES.STUDENT;

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        fullName: "",
        role: ROLES.STUDENT,
        createdAt: serverTimestamp(),
      }, { merge: true });
    } else {
      const data = userSnap.data();
      role = String(data.role || ROLES.STUDENT).toLowerCase();
    }
    
    await user.getIdTokenResult(true);
    return role;
  }

  async function handleLogin(e) {
    e?.preventDefault?.();
    setLoading(true);

    if (!/^\S+@\S+\.\S+$/.test(email) || !password || password.length < 6) {
      toast.warn("Invalid email or password.");
      setLoading(false);
      return;
    }

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const user = res.user;

      if (!user.emailVerified) {
        toast.warn("Email not verified. Please check your inbox or try resending.");
        await auth.signOut();
        setLoading(false);
        return;
      }

      const role = await ensureUserAndGetRole(user);

      if (role === ROLES.STUDENT) navigate("/student/dashboard");
      else if (role === ROLES.SUPERVISOR) navigate("/supervisor/dashboard");
      else if (role === ROLES.ADMIN) navigate("/admin/dashboard");
      else navigate("/");

    } catch (err) {
      console.error("Login error:", err);
      toast.error(err.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  // --- MODIFIED REGISTRATION HANDLER ---
  async function handleRegister(e) {
    e?.preventDefault?.();
    setRegLoading(true);

    if (!/^\S+@\S+\.\S+$/.test(regEmail)) {
        toast.warn("Enter a valid email.");
        setRegLoading(false);
        return;
    }
    if (!regPassword || regPassword.length < 6) {
        toast.warn("Password must be at least 6 characters.");
        setRegLoading(false);
        return;
    }

    try {
      const res = await createUserWithEmailAndPassword(
        auth,
        regEmail,
        regPassword
      );
      const user = res.user;

      // 1. Create minimal Firestore Document (other fields will be completed later)
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        email: user.email,
        // Set profile fields as empty strings, relying on the student flow to enforce completion
        fullname: "", 
        phone: "",
        collegeName: "",
        discipline: "",
        addressLine: "",
        pincode: "",
        city: "",
        state: "",
        role: ROLES.STUDENT,
        createdAt: serverTimestamp(),
      });

      // 2. Send Verification
      await sendEmailVerification(user, {
        url: `${window.location.origin}/finishVerify`,
        handleCodeInApp: true,
      });

      toast.success("Registration successful! Check your email to verify.");
      
      // Reset form and switch to login view
      setRegEmail("");
      setRegPassword("");
      setViewMode('login'); 
      setEmail(user.email); // Pre-fill login email

    } catch (err) {
      console.error("Register error:", err);
      toast.error(err.message || "Registration failed");
    } finally {
      setRegLoading(false);
    }
  }

  async function handleForgot(e) {
    e?.preventDefault?.();
    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail, {
        url: `${window.location.origin}/finishVerify`,
        handleCodeInApp: true,
      });
      toast.success("Password reset email sent. Check inbox/spam.");
      setForgotEmail("");
      setViewMode('login'); // Switch back to login
    } catch (err) {
      console.error("Forgot password error:", err);
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setForgotLoading(false);
    }
  }

  /* ------------------ UI Rendering ------------------ */

  const renderContent = () => {
    switch (viewMode) {
        case 'forgot':
            return (
                <div style={card}>
                    <h2>Reset Password</h2>
                    <form onSubmit={handleForgot}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            required
                            style={input}
                        />
                        <button type="submit" disabled={forgotLoading} style={primaryBtn}>
                            {forgotLoading ? "Sending..." : "Send reset email"}
                        </button>
                    </form>
                    <div style={{ marginTop: 20 }}>
                        <button onClick={() => setViewMode('login')} style={linkBtn}>
                            ← Back to sign in
                        </button>
                    </div>
                </div>
            );
        case 'register':
            return (
                <div style={card}>
                    <h2>Register (Student Account)</h2>
                    <p style={{marginTop: -10, marginBottom: 20, color: UI_STYLES.TEXT_MUTED, fontSize: 14}}>
                        Complete your profile details after logging in.
                    </p>
                    <form onSubmit={handleRegister}>
                        <input
                            type="email"
                            placeholder="Email *"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            required
                            style={input}
                        />
                        <input
                            type="password"
                            placeholder="Password (Min 6 Chars) *"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            required
                            style={input}
                        />
                        <button type="submit" disabled={regLoading} style={primaryBtn}>
                            {regLoading ? "Registering..." : "Create Account"}
                        </button>
                    </form>
                    <div style={{ marginTop: 35 }}>
                        <button onClick={() => setViewMode('login')} style={linkBtn}>
                            ← Already have an account? Sign In
                        </button>
                    </div>
                </div>
            );
        case 'login':
        default:
            return (
                <div style={card}>
                    <h2 style={{ marginBottom: 20 }}>
                        Sign In to the Training Portal
                    </h2>

                    <form onSubmit={handleLogin}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={input}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={input}
                        />
                        <button type="submit" disabled={loading} style={primaryBtn}>
                            {loading ? "Signing in…" : "Sign in"}
                        </button>
                    </form>

                    <div
                        style={{
                            marginTop: 35,
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                        }}
                    >
                        <button onClick={() => setViewMode('forgot')} style={linkBtn}>
                            Forgot password?
                        </button>
                        <button onClick={() => setViewMode('register')} style={linkBtn}>
                            Register (Student)
                        </button>
                    </div>
                </div>
            );
    }
  }

  return (
    <div style={wrap}>
      <div style={leftPane}>
        <div style={overlayStyle}></div> 
        <div style={{ padding: "20px", textAlign: "center", zIndex: 1 }}>
          <img
            src={logo}
            alt="Logo"
            style={{ width: "80px", cursor: "pointer" }}
            onClick={() => navigate("/")}
          />
          <h1 style={leftHeading}>
            Rashtriya Chemical and Fertilizer Limited
          </h1>
        </div>
      </div>

      <div style={rightPane}>
        <div style={cardWrap}>
            {renderContent()}
        </div>
      </div>
    </div>
  );
}

/* ---------- Styles (Replicated from previous for consistency) ---------- */
const wrap = {
  position: "fixed",
  inset: 0,
  display: "flex",
  width: "100vw",
  height: "100vh",
  overflow: "hidden",
};
const overlayStyle = {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0, 0, 0, 0.25)",
    zIndex: 0
};
const leftPane = {
  flex: "0 0 25%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundImage: `url(${bg})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  position: "relative"
};
const leftHeading = {
  marginTop: "20px",
  fontSize: "40px",
  fontWeight: "700",
  color: "#fff",
  textShadow: "0 2px 4px rgba(0,0,0,0.8)",
  lineHeight: "1",
  textAlign: "center",
};
const rightPane = {
  flex: "0 0 75%",
  height: "100%",
  background: "#ffffff",
  display: "flex",
  flexDirection: "column",
};
const cardWrap = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px",
};
const card = {
  width: 550,
  padding: 28,
  borderRadius: 12,
  background: "#fff",
  boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
  textAlign: "center",
};
const input = {
  width: "80%",
  padding: "12px 12px",
  marginTop: 15,
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 14,
};
const primaryBtn = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "none",
  marginTop: 25,
  background: UI_STYLES.PRIMARY_GREEN,
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};
const linkBtn = {
  background: "transparent",
  border: "none",
  color: UI_STYLES.PRIMARY_BLUE,
  cursor: "pointer",
  padding: 0,
  fontSize: 14,
};