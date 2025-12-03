// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";
import { UI_STYLES } from "../utils/constants";

export default function Home() {
  const nav = useNavigate();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
      <p style={{marginBottom: 10, color: UI_STYLES.TEXT_MUTED}}>
      </p>
      <button 
        onClick={() => nav("/login")} 
        style={buttonStyle}
        className="btn-primary" // Use the centralized styling
      >
        Sign In / Register
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
  color: "white",
  cursor: "pointer",
  transition: "0.3s",
};