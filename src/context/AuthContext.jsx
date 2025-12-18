import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);      // Firebase user
  const [role, setRole] = useState(null);      // "student" | "supervisor" | "admin"
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setProfileComplete(false);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      try {
        // Fetch the role from the 'users' collection
        // SECURITY: This ensures client-side redirects happen based on real DB data
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role || "student");
          setProfileComplete(!!data.profileComplete);
        } else {
          // Fallback if doc is missing
          setRole("student");
          setProfileComplete(false);
        }
      } catch (err) {
        console.error("Error fetching user role", err);
        setRole("student");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const value = {
    user,
    role,
    loading,
    isAuthenticated: !!user, 
    profileComplete,
    };

  // --- UI: Loading Screen ---
  if (loading) {
    return (
      <div style={loadingContainer}>
        <div style={spinnerStyle}></div>
        <p style={{ marginTop: "15px", fontFamily: "sans-serif", color: "#555" }}>
          Verifying security access...
        </p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

// Styles for the loader
const loadingContainer = {
    height: "100vh", 
    width: "100vw", 
    display: "flex", 
    flexDirection: "column",
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#f8f9fa"
};

const spinnerStyle = {
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3498db",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
};

// Add keyframes for spinner
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);
}