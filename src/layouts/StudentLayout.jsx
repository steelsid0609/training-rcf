// src/layouts/StudentLayout.jsx
import { NavLink, Outlet } from "react-router-dom";

export default function StudentLayout() {
  return (
    <div className="student-layout">
      <header>
        <h1>Student Panel</h1>
      </header>

      <nav>
        <NavLink to="/student/dashboard">Dashboard</NavLink>
        <NavLink to="/student/applications">Applications</NavLink>
        {/* add more links as needed */}
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
