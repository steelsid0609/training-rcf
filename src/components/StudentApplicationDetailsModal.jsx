// src/components/StudentApplicationDetailsModal.jsx
import React from "react";
import Modal from "./common/UI/Modal"; // Use reusable modal
import { formatDateDisplay, getApplicationDates } from "../utils/helpers";
import { getStatusStyle, UI_STYLES } from "../utils/constants";

export default function StudentApplicationDetailsModal({ app, onClose }) {
  if (!app) return null;

  const { start, end, isFinal } = getApplicationDates(app);

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 20 }}>
      <h4 style={sectionStyles.h4}>
        {title}
      </h4>
      <div style={sectionStyles.grid}>
        {children}
      </div>
    </div>
  );

  const Field = ({ label, value, isLink = false }) => (
    <div style={sectionStyles.field}>
      <span style={sectionStyles.label}>{label}:</span>{" "}
      {isLink && value ? (
        <a href={value} target="_blank" rel="noreferrer" style={sectionStyles.link}>View File ↗</a>
      ) : (
        <span>{value || "-"}</span>
      )}
    </div>
  );

  return (
    <Modal title="Application Details" onClose={onClose} maxWidth={650}>
      {/* 1. STATUS & ID */}
      <div style={statusBoxStyle}>
        <div style={{ fontSize: 12, color: UI_STYLES.TEXT_MUTED }}>Application ID: {app.id}</div>
        <div style={{ fontSize: 18, fontWeight: "bold", marginTop: 5, textTransform: "uppercase", color: getStatusStyle(app.status).col }}>
          {app.status}
        </div>
        {app.rejectionReason && (
          <div style={{ color: UI_STYLES.DANGER_RED, marginTop: 5, fontSize: 14 }}>
            Reason: {app.rejectionReason}
          </div>
        )}
      </div>

      {/* 2. PERSONAL DETAILS */}
      <Section title="Student Details">
        <Field label="Name" value={app.studentName} />
        <Field label="Email" value={app.email} />
        <Field label="Phone" value={app.phone} />
        <Field label="Discipline" value={app.discipline} />
      </Section>

      {/* 3. INTERNSHIP DATES */}
      <Section title="Internship Dates">
        <div style={dateBoxStyle.preferred}>
          <strong style={{ color: UI_STYLES.PRIMARY_GREEN }}>Preferred Dates:</strong> {formatDateDisplay(app.preferredStartDate, 'DD/MM/YYYY')} to {formatDateDisplay(app.preferredEndDate, 'DD/MM/YYYY')}
        </div>

        <div style={dateBoxStyle.actual}>
          <strong style={{ color: getStatusStyle('approved').col }}>Actual/Final Dates:</strong>
          {isFinal ? `${start} to ${end}` : "Awaiting Supervisor Approval"}
        </div>

        {app.durationDetails && (
          <Field label="Duration" value={`${app.durationDetails.value} ${app.durationDetails.type}`} />
        )}

        <Field label="Type" value={app.internshipType} />

      </Section>

      {/* 4. PAYMENT DETAILS */}
      <Section title="Payment Status">
        <Field label="Status" value={app.paymentStatus || "Pending"} />
        <Field label="Receipt No" value={app.paymentReceiptNumber} />
        <Field label="Submitted At" value={formatDateDisplay(app.paymentSubmittedAt)} />
        <Field label="Receipt File" value={app.paymentReceiptURL} isLink={true} />
      </Section>

      {/* 5. DOCUMENTS */}
      <Section title="Documents">
        <Field label="Rec. Letter" value={app.coverLetterURL} isLink={true} />
        <Field label="Approval Letter" value={app.approvalLetterURL} isLink={true} />
      </Section>

      {/* 6. POSTING LETTERS */}
      {(app.postingLetters?.length > 0 || app.postingLetterURL) && (
        <Section title="Issued Posting Letters">
          <div style={sectionStyles.fullWidth}>
            {app.postingLetters && app.postingLetters.length > 0 && (
              <div style={postingLetterContainer}>
                {app.postingLetters.map((letter, idx) => (
                  <div key={idx} style={postingCardStyle}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold", fontSize: "14px", color: UI_STYLES.TEXT_MAIN }}>
                        {letter.period || "Posting"}
                        {letter.plant && <span style={{ fontWeight: "normal", color: UI_STYLES.TEXT_MUTED }}> • {letter.plant}</span>}
                      </div>
                      <div style={{ fontSize: "11px", color: UI_STYLES.TEXT_MUTED }}>
                        Issued: {formatDateDisplay(letter.issuedAt)}
                      </div>
                    </div>
                    <a href={letter.url} target="_blank" rel="noreferrer" style={downloadBtnStyle}>
                      📥 Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}
    </Modal>
  );
}

// --- STYLES ---

const statusBoxStyle = {
  background: "#f9f9f9", 
  padding: 15, 
  borderRadius: UI_STYLES.BORDER_RADIUS, 
  marginBottom: 20, 
  textAlign: "center" 
};

const sectionStyles = {
  h4: { 
    margin: "0 0 8px 0", 
    color: UI_STYLES.PRIMARY_GREEN, 
    borderBottom: "1px solid #eee", 
    paddingBottom: 5 
  },
  grid: { 
    fontSize: 14, 
    color: UI_STYLES.TEXT_MAIN, 
    display: "grid", 
    gridTemplateColumns: "1fr 1fr", 
    gap: "10px" 
  },
  field: { 
    gridColumn: "span 1" 
  },
  label: { 
    fontWeight: 600, 
    color: "#555" 
  },
  link: {
    color: UI_STYLES.PRIMARY_BLUE, 
    textDecoration: "underline", 
    fontSize: "14px"
  },
  fullWidth: {
    gridColumn: "span 2"
  }
};

const dateBoxStyle = {
  preferred: {
    gridColumn: "span 2", marginBottom: 10, padding: 8, border: "1px dashed #ccc", borderRadius: 4
  },
  actual: {
    gridColumn: "span 2", marginBottom: 10, padding: 8, border: `1px solid ${getStatusStyle('approved').col}`, background: getStatusStyle('approved').bg, borderRadius: 4
  }
};

const postingLetterContainer = {
    display: "flex", flexDirection: "column", gap: "10px"
};
const postingCardStyle = {
  background: "#f1f8e9", border: "1px solid #c5e1a5", borderRadius: "6px",
  padding: "10px", display: "flex", alignItems: "center", justifyContent: "space-between"
};
const downloadBtnStyle = {
  textDecoration: "none", background: "#fff", border: `1px solid ${UI_STYLES.PRIMARY_GREEN}`,
  color: UI_STYLES.PRIMARY_GREEN, fontSize: "12px", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold"
};