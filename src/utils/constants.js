// src/utils/constants.js

/**
 * Role Definitions
 */
export const ROLES = {
    STUDENT: "student",
    SUPERVISOR: "supervisor",
    ADMIN: "admin",
};

/**
 * Status Badge Configuration
 * @param {string} status - Application status key
 * @returns {{background: string, color: string}} Style object
 */
export const STATUS_COLORS = {
    PENDING: { bg: "#fff3cd", col: "#856404" }, // Orange/Yellow for Pending
    APPROVED: { bg: "#d4edda", col: "#155724" }, // Green for Approved
    REJECTED: { bg: "#f8d7da", col: "#721c24" }, // Red for Rejected
    COMPLETED: { bg: "#cce5ff", col: "#004085" }, // Blue for Completed
    IN_PROGRESS: { bg: "#e0cffc", col: "#5e35b1" }, // Purple for In Progress
    PENDING_CONFIRMATION: { bg: "#d1ecf1", col: "#0c5460" }, // Cyan for Final Confirmation
    VERIFICATION_PENDING: { bg: "#fff3cd", col: "#856404" }, // Yellow for Payment Review
    VERIFIED: { bg: "#d4edda", col: "#155724" }, // Green for Verified Payment
    // Default for unknown status
    DEFAULT: { bg: "#e2e3e5", col: "#383d41" }, 
};

export const getStatusStyle = (status) => {
    const key = (status || "").toUpperCase().replace(/ /g, "_");
    return STATUS_COLORS[key] || STATUS_COLORS.DEFAULT;
};

/**
 * Cloudinary Configuration (Assumes VITE environment variables are set)
 */
export const CLOUDINARY = {
    CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
    get URL() {
        return `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`;
    }
};

/**
 * Style Constants for UI Consistency
 */
export const UI_STYLES = {
    CARD_SHADOW: "0 2px 8px rgba(0,0,0,0.08)",
    BORDER_RADIUS: "8px",
    PRIMARY_GREEN: "#006400",
    PRIMARY_BLUE: "#0d6efd",
    DANGER_RED: "#dc3545",
    SECONDARY_GRAY: "#6c757d",
    TEXT_MAIN: "#333",
    TEXT_MUTED: "#666",
};