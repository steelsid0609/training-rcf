// src/pages/supervisor/SupervisorUsersPage.jsx
import React from "react";
import AdminUsersPage from "../admin/AdminUsersPage"; // Use the generic user management component
import { ROLES } from "../../utils/constants";

export default function SupervisorUsersPage() {
  // Pass a filter to the shared component to only show students
  return <AdminUsersPage roleFilterOverride={ROLES.STUDENT} />;
}