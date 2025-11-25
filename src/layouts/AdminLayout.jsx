// src/layouts/AdminLayout.jsx
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <header>
        <h1>Admin Panel</h1>
      </header>

      <nav>
        <NavLink to="/admin/dashboard">Dashboard</NavLink>
        {/* more admin links */}
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
