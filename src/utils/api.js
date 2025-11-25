// src/utils/api.js
// Small API helper using fetch and Vite env `VITE_API_URL`.
const BASE = import.meta.env.VITE_API_URL || "";

let authToken = null;
export function setAuthToken(token) {
  authToken = token;
}

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const url = `${BASE}${path}`;

  const init = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (authToken) {
    init.headers.Authorization = `Bearer ${authToken}`;
  }

  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const res = await fetch(url, init);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Request failed ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

// Applications
export const getApplications = (query = "") =>
  request(`/api/applications${query ? `?${query}` : ""}`);

export const getApplication = (id) => request(`/api/applications/${id}`);

export const createApplication = (data) =>
  request(`/api/applications`, { method: "POST", body: data });

export const approveApplication = (id, body = {}) =>
  request(`/api/applications/${id}/approve`, { method: "POST", body });

export const rejectApplication = (id, body = {}) =>
  request(`/api/applications/${id}/reject`, { method: "POST", body });

// Users
export const getUsers = () => request(`/api/users`);
export const getUser = (id) => request(`/api/users/${id}`);

// Colleges
export const getColleges = () => request(`/api/colleges`);

export default {
  setAuthToken,
  // applications
  getApplications,
  getApplication,
  createApplication,
  approveApplication,
  rejectApplication,
  // users
  getUsers,
  getUser,
  // colleges
  getColleges,
};
