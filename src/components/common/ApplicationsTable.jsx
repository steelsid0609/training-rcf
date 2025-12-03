// src/components/common/ApplicationsTable.jsx
import React from "react";
import { getStatusStyle, UI_STYLES } from "../../utils/constants";
import { formatDateDisplay } from "../../utils/helpers";

/**
 * Reusable table view for applications (Admin/Supervisor Master List).
 * It includes filtering capabilities (handled by parent) and pagination.
 */
export default function ApplicationsTable({
  applications,
  onViewDetails,
  actionsColumn = null, // Custom JSX for an action column (e.g., Edit/View button)
}) {

  const getStatusBadge = (status) => {
    const s = (status || "pending").toUpperCase().replace(/ /g, "_");
    const { bg, col } = getStatusStyle(s);
    return {
      background: bg, color: col, padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold", whiteSpace: "nowrap"
    };
  };

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.trHead}>
            <th style={styles.th}>Student</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>College</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Dates</th>
            <th style={styles.th}>Applied On</th>
            {onViewDetails && <th style={styles.th}>Details</th>}
            {actionsColumn && <th style={styles.th}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {applications.length === 0 ? (
            <tr><td colSpan={actionsColumn ? 8 : 7} style={styles.emptyRow}>No matching records.</td></tr>
          ) : (
            applications.map(app => (
              <tr key={app.id} style={styles.tr}>
                <td style={styles.td}>
                  <div style={{ fontWeight: "bold" }}>{app.studentName || app.email}</div>
                  <div style={{ fontSize: 12, color: UI_STYLES.TEXT_MUTED }}>{app.email}</div>
                </td>
                <td style={styles.td}>{app.internshipType || "-"}</td>
                <td style={styles.td}>{app.collegeName || "-"}</td>
                <td style={styles.td}>
                  <span style={getStatusBadge(app.status)}>{app.status?.toUpperCase()}</span>
                </td>
                <td style={styles.td}>
                  <div style={{ fontSize: 12 }}>{formatDateDisplay(app.preferredStartDate)}</div>
                  <div style={{ fontSize: 12, color: UI_STYLES.TEXT_MUTED }}>to {formatDateDisplay(app.preferredEndDate)}</div>
                </td>
                <td style={styles.td}>
                  {formatDateDisplay(app.createdAt)}
                </td>
                {onViewDetails && (
                  <td style={styles.td}>
                    <button
                      onClick={() => onViewDetails(app)}
                      style={styles.viewBtn}
                    >
                      View
                    </button>
                  </td>
                )}
                {actionsColumn && <td style={styles.td}>{actionsColumn(app)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  tableContainer: { 
    background: UI_STYLES.WHITE, 
    borderRadius: UI_STYLES.BORDER_RADIUS, 
    boxShadow: UI_STYLES.CARD_SHADOW, 
    overflowX: "auto" 
  },
  table: { 
    width: "100%", 
    borderCollapse: "collapse", 
    minWidth: "1000px" 
  },
  trHead: { 
    background: "#f8f9fa", 
    borderBottom: "2px solid #eee" 
  },
  th: { 
    padding: "12px 15px", 
    textAlign: "left", 
    fontSize: "14px", 
    color: UI_STYLES.TEXT_MUTED, 
    fontWeight: "600" 
  },
  tr: { 
    borderBottom: "1px solid #eee" 
  },
  td: { 
    padding: "12px 15px", 
    fontSize: "14px", 
    color: UI_STYLES.TEXT_MAIN, 
    verticalAlign: "middle" 
  },
  emptyRow: { 
    padding: 30, 
    textAlign: "center", 
    color: UI_STYLES.TEXT_MUTED 
  },
  viewBtn: { 
    padding: "6px 14px", 
    background: UI_STYLES.SECONDARY_GRAY, 
    color: UI_STYLES.WHITE, 
    border: "none", 
    borderRadius: "4px", 
    cursor: "pointer", 
    fontSize: "13px" 
  }
};