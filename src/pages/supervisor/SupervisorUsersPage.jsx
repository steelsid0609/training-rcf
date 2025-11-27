import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { db, auth } from "../../firebase";
import { toast } from "react-toastify";

export default function SupervisorUsersPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. Add Search State
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);
    try {
      const q = query(
        collection(db, "users"), 
        where("role", "==", "student")
      );
      
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      setStudents(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  async function sendReset(email) {
    if (!email) return toast.warn("User has no email record");
    if (!window.confirm(`Send password reset link to ${email}?`)) return;

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Reset link sent to ${email}`);
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  }

  // 2. Filter Logic
  const filteredStudents = students.filter((std) => {
    const term = searchTerm.toLowerCase();
    const name = (std.fullname || "").toLowerCase();
    const email = (std.email || "").toLowerCase();
    const phone = (std.phone || "");

    return name.includes(term) || email.includes(term) || phone.includes(term);
  });

  if (loading) return <div style={{ padding: 20 }}>Loading students...</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2>Registered Students</h2>
          <p style={{ color: "#666", marginTop: 4 }}>
            Manage registered students and password resets.
          </p>
        </div>
      </div>

      {/* 3. Search Bar UI */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="🔍 Search by Name, Email, or Phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchInputStyle}
        />
      </div>

      {filteredStudents.length === 0 ? (
        <p>No students found matching "{searchTerm}".</p>
      ) : (
        <div style={gridStyle}>
          {filteredStudents.map((std) => (
            <div key={std.id} style={cardStyle}>
              <div style={{ fontWeight: "bold", fontSize: "16px", marginBottom: 5 }}>
                {std.fullname || "No Name Provided"}
              </div>
              
              <div style={{ fontSize: "14px", color: "#555" }}>
                <div style={{ marginBottom: 4 }}>📧 {std.email}</div>
                <div style={{ marginBottom: 4 }}>📞 {std.phone || "N/A"}</div>
                <div>🎓 {std.discipline || "N/A"}</div>
              </div>

              <hr style={{ margin: "12px 0", border: "0", borderTop: "1px solid #eee" }} />

              <button 
                onClick={() => sendReset(std.email)}
                style={resetBtnStyle}
              >
                Send Password Reset
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const gridStyle = {
  display: "grid",
  gap: "20px",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
};

const cardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  borderTop: "4px solid #003366"
};

const resetBtnStyle = {
  width: "100%",
  padding: "8px 12px",
  background: "#0d6efd",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "500"
};

const searchInputStyle = {
  width: "100%",
  maxWidth: "400px",
  padding: "10px 15px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "15px",
  outline: "none"
};