// src/components/supervisor/ActualDatesConfirmationModal.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

// Utility function to convert YYYY-MM-DD to DD/MM/YYYY for display
function formatDateDisplay(isoString) {
    if (!isoString || typeof isoString !== 'string') return "N/A";
    const parts = isoString.split("-");
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
    return isoString;
}

// Helper to calculate the calculated end date based on duration (from StudentApplyForm.jsx logic)
function calculateEndDate(startDate, durationValue, durationType) {
    if (!startDate || !durationValue) return "";
    
    const start = new Date(startDate);
    const end = new Date(start);
    const val = parseInt(durationValue);

    if (isNaN(val) || val <= 0) return "";

    if (durationType === "months") end.setMonth(end.getMonth() + val);
    else if (durationType === "weeks") end.setDate(end.getDate() + (val * 7));
    else if (durationType === "days") end.setDate(end.getDate() + val);
    
    // Ensure format is YYYY-MM-DD for consistency
    return end.toISOString().split('T')[0];
}


export default function ActualDatesConfirmationModal({ 
    app, 
    slotsList, 
    slotsMap, 
    onClose, 
    onApprove 
}) {
    
    // Initialize form with existing PREFERRED dates/slot
    const [formData, setFormData] = useState({
        slotId: app.durationDetails?.slotId || "",
        actualStartDate: app.preferredStartDate, // Pre-fill with preferred date
        actualEndDate: app.preferredEndDate, // Pre-fill with calculated preferred date
    });
    const [submitting, setSubmitting] = useState(false);

    const durationValue = app.durationDetails?.value;
    const durationType = app.durationDetails?.type;
    const durationDisplay = durationValue ? `${durationValue} ${durationType}` : "N/A";

    // Recalculate end date if the start date changes (as duration is fixed)
    useEffect(() => {
        if (formData.actualStartDate && durationValue && durationType) {
            const newEndDate = calculateEndDate(formData.actualStartDate, durationValue, durationType);
            setFormData(f => ({ ...f, actualEndDate: newEndDate }));
        }
    }, [formData.actualStartDate, durationValue, durationType]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.slotId) return toast.warn("Please select a slot.");
        if (!formData.actualStartDate || !formData.actualEndDate) return toast.warn("Actual dates are required.");

        setSubmitting(true);
        // Call the main approve function with the newly confirmed data
        await onApprove(app, formData);
        setSubmitting(false);
        onClose();
    };

    return (
        <div style={modalStyles.overlay}>
            <form style={modalStyles.modal} onSubmit={handleSubmit}>
                <h3 style={modalStyles.header}>Finalize Internship Dates</h3>

                <div style={modalStyles.content}>
                    {/* Display Preferred Dates - Now using DD/MM/YYYY format */}
                    <div style={modalStyles.infoBox}>
                        <p style={{margin: "0 0 5px 0"}}>
                            <strong>Student:</strong> {app.studentName}
                        </p>
                        <p style={{margin: "0 0 5px 0"}}>
                            <strong>Type:</strong> {app.internshipType} ({durationDisplay})
                        </p>
                        <p style={{margin: 0, color: "#006400"}}>
                            <strong>Preferred Dates:</strong> {formatDateDisplay(app.preferredStartDate)} to {formatDateDisplay(app.preferredEndDate)}
                        </p>
                    </div>

                    {/* Final Slot Selection */}
                    <label style={modalStyles.label}>Select Final Slot *</label>
                    <select 
                        style={modalStyles.input}
                        value={formData.slotId}
                        onChange={e => setFormData({...formData, slotId: e.target.value})}
                        required
                    >
                        <option value="">-- Select Final Slot --</option>
                        {slotsList.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.label} (Starts: {formatDateDisplay(s.startDate)})
                            </option>
                        ))}
                    </select>
                    
                    {/* Actual Date Inputs */}
                    <h4 style={modalStyles.h4}>Set Actual Internship Dates</h4>
                    <div style={{display: 'flex', gap: 15}}>
                        <div style={{flex: 1}}>
                            {/* NOTE: input type="date" value MUST be in YYYY-MM-DD */}
                            <label style={modalStyles.label}>Actual Start Date *</label>
                            <input 
                                type="date" 
                                style={modalStyles.input}
                                value={formData.actualStartDate}
                                onChange={e => setFormData({...formData, actualStartDate: e.target.value})}
                                required
                            />
                        </div>
                        <div style={{flex: 1}}>
                            {/* NOTE: input type="date" value MUST be in YYYY-MM-DD */}
                            <label style={modalStyles.label}>Actual End Date *</label>
                            <input 
                                type="date" 
                                style={modalStyles.input}
                                value={formData.actualEndDate}
                                onChange={e => setFormData({...formData, actualEndDate: e.target.value})}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div style={modalStyles.footer}>
                    <button type="button" onClick={onClose} style={modalStyles.btnCancel} disabled={submitting}>
                        Cancel
                    </button>
                    <button type="submit" style={modalStyles.btnApprove} disabled={submitting}>
                        {submitting ? "Approving..." : "Approve & Finalize"}
                    </button>
                </div>
            </form>
        </div>
    );
}

// =======================================================
// MODAL STYLES
// =======================================================
const modalStyles = {
    overlay: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", zIndex: 1100,
      display: "flex", justifyContent: "center", alignItems: "center"
    },
    modal: {
      background: "#fff", width: "90%", maxWidth: "550px",
      borderRadius: "10px", 
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      display: "flex", flexDirection: "column",
    },
    header: {
        padding: "20px", 
        borderBottom: "1px solid #eee", 
        margin: 0, 
        color: "#333",
        fontSize: 22
    },
    h4: {
        marginTop: 20, 
        marginBottom: 5, 
        color: "#0d47a1",
        borderBottom: "1px solid #eee",
        paddingBottom: 5
    },
    infoBox: {
        padding: 15,
        background: "#e3f2fd",
        borderRadius: 8,
        marginBottom: 20,
        borderLeft: "5px solid #2196f3"
    },
    content: {
        padding: "20px", 
        flex: 1, 
        maxHeight: '70vh', 
        overflowY: 'auto'
    },
    footer: {
        padding: "15px 20px", 
        borderTop: "1px solid #eee", 
        textAlign: "right",
        display: "flex",
        justifyContent: "flex-end",
        gap: 10
    },
    label: { 
        display: "block", 
        fontSize: 13, 
        fontWeight: 600, 
        marginBottom: 5, 
        marginTop: 5,
        color: "#555"
    },
    input: {
        width: "100%", 
        padding: 10, 
        borderRadius: 4, 
        border: "1px solid #ccc", 
        fontSize: 14
    },
    btnCancel: {
        padding: "10px 20px", 
        background: "#6c757d", 
        color: "#fff", 
        border: "none", 
        borderRadius: 6, 
        cursor: "pointer", 
        fontWeight: 'bold'
    },
    btnApprove: {
        padding: "10px 20px", 
        background: "#28a745", 
        color: "#fff", 
        border: "none", 
        borderRadius: 6, 
        cursor: "pointer",
        fontWeight: 'bold'
    }
};