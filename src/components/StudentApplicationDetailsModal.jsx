import React from "react";

export default function StudentApplicationDetailsModal({ app, onClose }) {
  if (!app) return null;

  // Helper to format dates safely
  const formatDate = (val) => {
    if (!val) return "-";
    // If it's a Firestore Timestamp
    if (val.toDate) return val.toDate().toLocaleDateString();
    // If it's a string (YYYY-MM-DD) from the form
    return val;
  };

  // Helper for sections
  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 20 }}>
      <h4 style={{ margin: "0 0 8px 0", color: "#006400", borderBottom: "1px solid #eee", paddingBottom: 5 }}>
        {title}
      </h4>
      <div style={{ fontSize: 14, color: "#333", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {children}
      </div>
    </div>
  );

  const Field = ({ label, value, fullWidth }) => (
    <div style={{ gridColumn: fullWidth ? "span 2" : "auto" }}>
      <span style={{ fontWeight: 600, color: "#555" }}>{label}:</span>{" "}
      <span>{value || "-"}</span>
    </div>
  );

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0 }}>Application Details</h2>
          <button onClick={onClose} style={closeBtnStyle}>&times;</button>
        </div>

        <div style={scrollableContent}>
          {/* 1. STATUS & ID */}
          <div style={{ background: "#f9f9f9", padding: 15, borderRadius: 8, marginBottom: 20, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#777" }}>Application ID: {app.id}</div>
            <div style={{ fontSize: 18, fontWeight: "bold", marginTop: 5, textTransform: "uppercase", color: getStatusColor(app.status) }}>
              {app.status}
            </div>
            {app.rejectionReason && (
              <div style={{ color: "red", marginTop: 5, fontSize: 14 }}>
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

          {/* 3. COLLEGE DETAILS */}
          <Section title="College Information">
            <Field label="College Name" value={app.collegeName} fullWidth />
            {app.college?.name === "Other" || app.college?.tempCollegeRef ? (
               // If it was a custom entry, show details if available
               <>
                 <Field label="Address" value={app.college.address || "-"} fullWidth />
               </>
            ) : null}
          </Section>

          {/* 4. INTERNSHIP DETAILS */}
          <Section title="Training Details">
            <Field label="Type" value={app.internshipType} />
            <Field label="Confirmation" value={app.receivedConfirmation ? "Yes" : "No"} />
            {app.confirmationNumber && <Field label="Conf. Number" value={app.confirmationNumber} />}
            
            <Field label="Start Date" value={formatDate(app.preferredStartDate)} />
            <Field label="End Date" value={formatDate(app.preferredEndDate)} />
            
            {app.durationDetails && (
              <Field label="Duration" value={`${app.durationDetails.value} ${app.durationDetails.type}`} fullWidth />
            )}
          </Section>

          {/* 5. PAYMENT DETAILS */}
          <Section title="Payment Status">
            <Field label="Status" value={app.paymentStatus || "Pending"} />
            <Field label="Receipt No" value={app.paymentReceiptNumber} />
            <Field label="Submitted At" value={formatDate(app.paymentSubmittedAt)} />
            {app.paymentReceiptURL && (
               <div style={{ gridColumn: "span 2", marginTop: 5 }}>
                 <a href={app.paymentReceiptURL} target="_blank" rel="noreferrer" style={linkStyle}>
                   View Payment Receipt
                 </a>
               </div>
            )}
          </Section>

          {/* 6. DOCUMENTS */}
          <Section title="Documents">
            <div style={{ gridColumn: "span 2" }}>
              <div>
                <strong>Recommendation Letter: </strong>
                {app.coverLetterURL ? (
                  <a href={app.coverLetterURL} target="_blank" rel="noreferrer" style={linkStyle}>View File</a>
                ) : <span style={{color: "#999"}}>Not Uploaded (Optional)</span>}
              </div>
            </div>
          </Section>

          {/* 7. POSTING LETTERS (NEW SECTION) */}
          {(app.postingLetters?.length > 0 || app.postingLetterURL) && (
            <Section title="Issued Posting Letters">
              <div style={{ gridColumn: "span 2" }}>
                
                {/* A. Multiple Letters (New Flow) */}
                {app.postingLetters && app.postingLetters.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {app.postingLetters.map((letter, idx) => (
                      <div key={idx} style={postingCardStyle}>
                        <div style={{flex: 1}}>
                          <div style={{fontWeight: "bold", fontSize: "14px", color: "#333"}}>
                            {letter.period || "Posting"} 
                            {letter.plant && <span style={{fontWeight: "normal", color: "#666"}}> • {letter.plant}</span>}
                          </div>
                          <div style={{fontSize: "11px", color: "#888"}}>
                            Issued: {formatDate(letter.issuedAt)}
                          </div>
                        </div>
                        <a href={letter.url} target="_blank" rel="noreferrer" style={downloadBtnStyle}>
                          📥 Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* B. Legacy Single Letter (Fallback) */}
                {(!app.postingLetters || app.postingLetters.length === 0) && app.postingLetterURL && (
                   <div style={postingCardStyle}>
                     <div style={{flex: 1, fontWeight: "bold", fontSize: "14px"}}>Final Posting Letter</div>
                     <a href={app.postingLetterURL} target="_blank" rel="noreferrer" style={downloadBtnStyle}>
                       📥 Download
                     </a>
                   </div>
                )}
              </div>
            </Section>
          )}

        </div>

        <div style={footerStyle}>
          <button onClick={onClose} style={btnStyle}>Close</button>
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const overlayStyle = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.5)", zIndex: 1100,
  display: "flex", justifyContent: "center", alignItems: "center"
};
const modalStyle = {
  background: "#fff", width: "90%", maxWidth: "600px", maxHeight: "90vh",
  borderRadius: "8px", display: "flex", flexDirection: "column",
  boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
};
const headerStyle = {
  padding: "15px 20px", borderBottom: "1px solid #eee",
  display: "flex", justifyContent: "space-between", alignItems: "center"
};
const scrollableContent = {
  padding: "20px", overflowY: "auto", flex: 1
};
const footerStyle = {
  padding: "15px 20px", borderTop: "1px solid #eee", textAlign: "right"
};
const closeBtnStyle = {
  background: "transparent", border: "none", fontSize: "24px", cursor: "pointer"
};
const btnStyle = {
  padding: "8px 16px", background: "#6c757d", color: "#fff",
  border: "none", borderRadius: "4px", cursor: "pointer"
};
const linkStyle = {
  color: "#007bff", textDecoration: "underline", fontSize: "14px"
};
const postingCardStyle = {
  background: "#f1f8e9", border: "1px solid #c5e1a5", borderRadius: "6px",
  padding: "10px", display: "flex", alignItems: "center", justifyContent: "space-between"
};
const downloadBtnStyle = {
  textDecoration: "none", background: "#fff", border: "1px solid #006400",
  color: "#006400", fontSize: "12px", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold"
};

function getStatusColor(status) {
  if (status === "approved") return "#28a745";
  if (status === "rejected") return "#dc3545";
  if (status === "completed") return "#007bff";
  return "#e65100"; // pending
}