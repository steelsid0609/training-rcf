// src/layouts/HomeLayout.jsx
import { Outlet } from "react-router-dom";
import logo from "../assets/logo.png"; 
import bg from "../assets/bg.jpg"; 

export default function HomeLayout() {
  return (
    <div
      style={{
        minHeight: "98vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        //backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        style={{
          position: "relative",
          background: "white",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
          zIndex: 1,
        }}
      >
        {/* Logo + Title */}
        <div style={{ marginBottom: "20px" }}>
          <img
            src={logo}
            alt="Company Logo"
            style={{ width: "80px", marginBottom: "10px" }}
          />
          <h2 style={{ margin: "10px 0", color: "#006400" }}>
            Rashtriya Chemical and Fertilizer Limited
          </h2>
          <p style={{ fontWeight: "bold", color: "#444" }}>
            Training & Internship Portal
          </p>
        </div>

        {/* Pages inside Home (like buttons from Home.jsx) */}
        <Outlet />
      </div>
    </div>
  );
}
