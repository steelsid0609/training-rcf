// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
      <button onClick={() => nav("/login?role=student")} style={buttonStyle}>
        Student Login
      </button>

      <button
        onClick={() => nav("/login?role=admin")}
        style={{ ...buttonStyle, background: "#cc0000" }}
      >
        Admin Login
      </button>
    </div>
  );
}

const buttonStyle = {
  padding: "12px",
  fontSize: "16px",
  fontWeight: "bold",
  border: "none",
  borderRadius: "8px",
  background: "#28a745",
  color: "white",
  cursor: "pointer",
  transition: "0.3s",
};
