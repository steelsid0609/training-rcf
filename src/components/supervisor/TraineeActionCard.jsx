import React, { useState } from "react";
import { useApplicationActions } from "../../hooks/useApplicationActions";
import { toast } from "react-toastify";
import { generatePostingLetterPDF } from "../../utils/pdfGenerator"; // Import generator

export default function TraineeActionCard({ app, user }) {
  const { issuePostingLetter, markCompleted, working } = useApplicationActions(user);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [useAutoGenerate, setUseAutoGenerate] = useState(true); // Default to Auto
  const [formData, setFormData] = useState({ period: "", plant: "", file: null });

  const handleIssue = async () => {
    if(!formData.period || !formData.plant) return toast.warn("Period and Plant are required");
    
    // Logic Split: Auto vs Manual
    let fileToUpload = formData.file;

    if (useAutoGenerate) {
        // Generate PDF Blob on the fly
        try {
            fileToUpload = generatePostingLetterPDF(app, {
                period: formData.period,
                plant: formData.plant
            });
        } catch (e) {
            console.error(e);
            return toast.error("Error generating PDF template");
        }
    } else {
        // Manual Validation
        if (!fileToUpload) return toast.warn("Please select a file to upload");
    }

    await issuePostingLetter(app, formData.period, formData.plant, fileToUpload);
    
    setShowModal(false);
    setFormData({ period: "", plant: "", file: null });
  };

  return (
    <div style={{ background: "#fff", padding: 20, borderRadius: 8, boxShadow: "0 2px 5px rgba(0,0,0,0.1)", borderLeft: "5px solid #006400", marginBottom: 15 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h4 style={{ margin: "0 0 5px 0" }}>{app.studentName}</h4>
          <div style={{ fontSize: 13, color: "#666" }}>{app.collegeName}</div>
          <div style={{ fontSize: 13, marginTop: 5 }}>
            <strong>Status:</strong> <span style={{ textTransform: "uppercase", fontWeight: "bold", color: "#006400" }}>{app.status}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button 
            onClick={() => setShowModal(true)}
            style={{ padding: "8px 12px", background: "#0d6efd", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
          >
            📝 Issue Letter
          </button>
          <button 
            onClick={() => { if(confirm("Mark Completed?")) markCompleted(app.id); }}
            style={{ padding: "8px 12px", background: "#198754", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
          >
            🏁 Finish
          </button>
        </div>
      </div>

      {/* Posting History */}
      {app.postingLetters?.length > 0 && (
        <div style={{ marginTop: 15, padding: 10, background: "#f8f9fa", borderRadius: 4 }}>
          <small>Latest Posting: <strong>{app.postingLetters[app.postingLetters.length-1].plant}</strong> ({app.postingLetters[app.postingLetters.length-1].period})</small>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{marginTop:0}}>Issue Posting Letter</h3>
            
            {/* Toggle Switch */}
            <div style={{ background: "#e3f2fd", padding: "10px", borderRadius: "6px", marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                <input 
                    type="checkbox" 
                    id="autoGen"
                    checked={useAutoGenerate} 
                    onChange={(e) => setUseAutoGenerate(e.target.checked)}
                    style={{width: "auto"}}
                />
                <label htmlFor="autoGen" style={{fontSize: "14px", cursor: "pointer", color: "#0d47a1"}}>
                    <strong>Auto-Generate Letter from Template</strong>
                </label>
            </div>

            <label style={label}>Period (e.g. 1st Month)</label>
            <input style={input} onChange={e => setFormData({...formData, period: e.target.value})} placeholder="e.g. Month 1"/>
            
            <label style={label}>Plant Allocation</label>
            <input style={input} onChange={e => setFormData({...formData, plant: e.target.value})} placeholder="e.g. Ammonia Plant"/>
            
            {!useAutoGenerate && (
                <>
                    <label style={label}>Upload Manual File</label>
                    <input type="file" style={input} onChange={e => setFormData({...formData, file: e.target.files[0]})} />
                </>
            )}

            <div style={{ marginTop: 20, textAlign: "right", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={btnCancel}>Cancel</button>
              <button onClick={handleIssue} disabled={working} style={btnSave}>
                {working ? "Processing..." : (useAutoGenerate ? "Generate & Issue" : "Upload & Issue")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const modalOverlay = { position: "fixed", top:0, left:0, right:0, bottom:0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContent = { background: "#fff", padding: 25, borderRadius: 8, width: 450 };
const label = { display: "block", marginTop: 10, fontWeight: "bold", fontSize: 13 };
const input = { width: "100%", padding: 8, marginTop: 5, border: "1px solid #ccc", borderRadius: 4 };
const btnCancel = { background: "#6c757d", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer" };
const btnSave = { background: "#006400", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer" };