// src/utils/permissions.js
export const PERMISSIONS = {
  student: [
    "CREATE_APPLICATION",
    "VIEW_OWN_APPLICATIONS",
  ],
  supervisor: [
    "VIEW_ASSIGNED_STUDENTS",
    "APPROVE_APPLICATION",
  ],
  admin: [
    "MANAGE_USERS",
    "VIEW_ALL_APPLICATIONS",
  ],
};

export function can(role, permission) {
  return PERMISSIONS[role]?.includes(permission);
}
