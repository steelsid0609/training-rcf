// src/utils/helpers.js
import { CLOUDINARY, getStatusStyle } from "./constants";
import { toast } from "react-toastify";
import { Timestamp } from "firebase/firestore";

/**
 * Safely format date from Firestore Timestamp or ISO string.
 * @param {Timestamp|string} val - The date value.
 * @returns {string} Formatted date string (DD/MM/YYYY) or '-'
 */
export const formatDateDisplay = (val, format = 'DD/MM/YYYY') => {
    if (!val) return "-";
    
    let date;
    if (val?.toDate && typeof val.toDate === "function") {
        date = val.toDate();
    } else if (typeof val === 'string' || typeof val === 'number') {
        date = new Date(val);
    } else {
        return "-";
    }

    if (isNaN(date.getTime())) return String(val);

    const DD = String(date.getDate()).padStart(2, '0');
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const YYYY = date.getFullYear();

    if (format === 'ISO') return date.toISOString().split('T')[0]; // YYYY-MM-DD
    if (format === 'DD/MM/YYYY') return `${DD}/${MM}/${YYYY}`;
    
    // Default to readable locale string for time stamps
    return date.toLocaleString();
};

/**
 * Custom hook wrapper for fetching data with real-time listeners.
 * @param {Query} q - The Firestore query object.
 * @param {function(Array)} onSuccess - Callback to handle the list of documents.
 * @param {function(Error)} onError - Callback for error handling.
 * @returns {function(): function()} Unsubscribe function.
 */
export const listenToCollection = (q, onSuccess, onError) => {
    return onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onSuccess(list);
    }, onError);
};


/**
 * Helper to upload file or Blob to Cloudinary.
 * @param {File | Blob} fileOrBlob - The file/blob to upload.
 * @param {string} publicId - Base public ID for Cloudinary.
 * @returns {Promise<string>} Secure URL of the uploaded file.
 */
export const uploadFileToCloudinary = async (fileOrBlob, publicId) => {
    if (!CLOUDINARY.CLOUD_NAME || !CLOUDINARY.UPLOAD_PRESET) {
        throw new Error("System Configuration Error: Cloudinary keys missing.");
    }
    
    const formData = new FormData();
    // Check if it's a PDF Blob (generated) or a File (uploaded)
    if (fileOrBlob instanceof Blob) {
      formData.append("file", fileOrBlob, "document.pdf");
    } else {
      formData.append("file", fileOrBlob);
    }
    
    formData.append("upload_preset", CLOUDINARY.UPLOAD_PRESET);
    if(publicId) formData.append("public_id", publicId);

    const res = await fetch(CLOUDINARY.URL, { method: "POST", body: formData });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Upload failed");
    
    return json.secure_url;
};

/**
 * Helper to determine the correct display dates.
 * @param {object} app - The application object.
 * @returns {{start: string, end: string, isFinal: boolean}}
 */
export const getApplicationDates = (app) => {
    // Prioritize actual dates if available (means they are final)
    const start = app.actualStartDate || app.preferredStartDate || "-";
    const end = app.actualEndDate || app.preferredEndDate || "-";
    
    return { 
        start: formatDateDisplay(start, 'DD/MM/YYYY'), 
        end: formatDateDisplay(end, 'DD/MM/YYYY'), 
        isFinal: !!app.actualStartDate 
    };
};