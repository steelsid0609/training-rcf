// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);      // Firebase user
  const [role, setRole] = useState(null);      // "student" | "supervisor" | "admin"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      try {
        // adjust collection/path if you use something else
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role || null);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error("Error fetching user role", err);
        setRole(null);
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
  };

  // you can replace this with a spinner if you want
  if (loading) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
