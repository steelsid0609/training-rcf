// src/layouts/SupervisorLayout.jsx
import { NavLink, Outlet } from "react-router-dom";

export default function SupervisorLayout() {
  return (
    <div className="supervisor-layout">
      <header>
        <h1>Supervisor Panel</h1>
      </header>

      <nav>
        <NavLink to="/supervisor/dashboard">Dashboard</NavLink>
        {/* add more links like /supervisor/students etc */}
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
