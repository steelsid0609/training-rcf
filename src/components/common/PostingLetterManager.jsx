import React, { useState } from "react";
import { useApplicationActions } from "../../hooks/useApplicationActions";
import { toast } from "react-toastify";

export default function PostingLetterManager({ app, user, onComplete }) {
  const { issuePostingLetter, working } = useApplicationActions(user);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ period: "", plant: "", file: null });

  const handleSubmit = async () => {
    if (!formData.period || !formData.plant || !formData.file) {
      return toast.warn("Fill all fields");
    }
    await issuePostingLetter(app, formData.period, formData.plant, formData.file);
    setShowModal(false);
    setFormData({ period: "", plant: "", file: null });
    if (onComplete) onComplete();
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        style={{ padding: "8px 12px", background: "#006400", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
      >
        📝 Issue Letter
      </button>

      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>Issue Posting Letter: {app.studentName}</h3>
            
            <label style={styles.label}>Period</label>
            <input 
              style={styles.input} 
              placeholder="e.g. 1st Month" 
              onChange={e => setFormData({...formData, period: e.target.value})} 
            />

            <label style={styles.label}>Plant</label>
            <input 
              style={styles.input} 
              placeholder="e.g. Ammonia" 
              onChange={e => setFormData({...formData, plant: e.target.value})} 
            />

            <label style={styles.label}>File</label>
            <input type="file" onChange={e => setFormData({...formData, file: e.target.files[0]})} />

            <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button onClick={handleSubmit} disabled={working}>
                {working ? "Uploading..." : "Issue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#fff", padding: 20, borderRadius: 8, width: 400 },
  label: { display: "block", marginTop: 10, fontWeight: "bold" },
  input: { width: "100%", padding: 8, marginTop: 5, border: "1px solid #ccc" }
};