// src/components/common/UI/DataCard.jsx
import React from 'react';
import { getStatusStyle, UI_STYLES } from '../../../utils/constants';
import { getApplicationDates } from '../../../utils/helpers';

/**
 * Reusable card component for displaying application summaries.
 * Used for Student Application List, Supervisor/Admin views.
 */
export default function DataCard({ app, children, showPaymentStatus = false, borderStyle = null }) {
    
    const { start, end, isFinal } = getApplicationDates(app);
    
    // Determine the main status and payment status styles
    const mainStatus = (app.status || "pending").toLowerCase();
    const payStatus = (app.paymentStatus || "pending").toLowerCase();

    const statusBadge = (status) => {
        const { bg, col } = getStatusStyle(status);
        return {
            background: bg, color: col, padding: "4px 8px", borderRadius: "4px", fontWeight: "bold", fontSize: "11px",
            whiteSpace: 'nowrap'
        };
    };

    return (
        <div 
            key={app.id} 
            style={{ 
                ...cardStyle, 
                borderLeft: borderStyle || `5px solid ${mainStatus === 'approved' ? UI_STYLES.PRIMARY_GREEN : UI_STYLES.PRIMARY_BLUE}`
            }}
        >
            {/* Header */}
            <div style={cardStyles.header}>
                <div>
                    <h3 style={cardStyles.title}>{app.studentName || app.internshipType}</h3>
                    <div style={cardStyles.subText}>ID: {app.id.substring(0, 6)}...</div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <span style={statusBadge(mainStatus)}>{mainStatus.toUpperCase()}</span>
                </div>
            </div>

            {/* Summary */}
            <div style={cardStyles.summary}>
                <div>
                    <strong>Type:</strong> {app.internshipType || "-"}
                </div>
                <div>
                    <strong>College:</strong> {app.collegeName || "-"}
                </div>
                <div>
                    <strong>Dates:</strong> {start} to {end}
                    {isFinal && <span style={{ color: UI_STYLES.PRIMARY_GREEN, fontWeight: 'bold' }}> (Final)</span>}
                </div>
                
                {showPaymentStatus && (
                    <div style={cardStyles.paymentStatus}>
                        <strong>Payment:</strong> 
                        <span style={{ marginLeft: 5 }}>
                           <span style={statusBadge(payStatus)}>{payStatus.toUpperCase().replace("_", " ")}</span>
                        </span>
                    </div>
                )}
            </div>

            <hr style={cardStyles.divider} />

            {/* Actions (Passed as children) */}
            <div style={cardStyles.actions}>
                {children}
            </div>
        </div>
    );
}

// --- Card Styles ---
const cardStyles = {
    header: { 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-start" 
    },
    title: { 
        margin: "0 0 5px 0", 
        color: UI_STYLES.TEXT_MAIN,
        fontSize: 16
    },
    subText: { 
        fontSize: "12px", 
        color: UI_STYLES.TEXT_MUTED 
    },
    summary: { 
        marginTop: 15, 
        color: UI_STYLES.TEXT_MAIN, 
        fontSize: 14, 
        lineHeight: "1.6" 
    },
    paymentStatus: {
        marginTop: 5
    },
    divider: { 
        margin: "15px 0", 
        border: "0", 
        borderTop: "1px solid #eee" 
    },
    actions: { 
        display: "flex", 
        gap: 10, 
        flexWrap: "wrap" 
    }
};

const cardStyle = {
    background: "#fff",
    padding: "20px",
    borderRadius: UI_STYLES.BORDER_RADIUS,
    boxShadow: UI_STYLES.CARD_SHADOW,
    transition: "transform 0.2s",
};