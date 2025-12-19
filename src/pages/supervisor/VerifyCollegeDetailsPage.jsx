import React, { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  query, 
  where, 
  deleteDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-toastify";

export default function VerifyCollegeDetailsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for all pending submissions
    const q = query(collection(db, "tempCollegeDetails"), where("status", "==", "pending"));
    return onSnapshot(q, (snap) => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading submissions...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#006400", marginBottom: 20 }}>Verify Student College Submissions</h2>
      {submissions.length === 0 ? (
        <div style={styles.emptyState}>No pending submissions to verify.</div>
      ) : (
        <div style={styles.grid}>
          {submissions.map((sub) => (
            <ComparisonCard key={sub.id} submission={sub} />
          ))}
        </div>
      )}
    </div>
  );
}

function ComparisonCard({ submission }) {
  const [masterData, setMasterData] = useState(null);
  const [diffFound, setDiffFound] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check master list for match
    const masterQuery = query(
      collection(db, "colleges_master"), 
      where("name", "==", submission.collegeName)
    );
    
    return onSnapshot(masterQuery, (snap) => {
      if (!snap.empty) {
        const mData = snap.docs[0].data();
        setMasterData({ id: snap.docs[0].id, ...mData });
        
        // Deep comparison of College, Principal, and Faculty data
        const hasDiff = 
          mData.address !== submission.address ||
          JSON.stringify(mData.emails?.sort()) !== JSON.stringify(submission.emails?.sort()) ||
          JSON.stringify(mData.principal) !== JSON.stringify(submission.principal) ||
          JSON.stringify(mData.faculties) !== JSON.stringify(submission.faculties);
        
        setDiffFound(hasDiff);
      } else {
        setMasterData(null);
        setDiffFound(true);
      }
      setChecking(false);
    });
  }, [submission]);

  const handleMerge = async () => {
    const confirmMerge = window.confirm(`Merge "${submission.collegeName}" to Master List and delete temporary entry?`);
    if (!confirmMerge) return;

    try {
      // 1. Determine Ref (Existing or New)
      const masterRef = masterData 
        ? doc(db, "colleges_master", masterData.id) 
        : doc(collection(db, "colleges_master"));

      // 2. Set Data in Master (Merging inclusive of Principal & Faculty)
      await setDoc(masterRef, {
        name: submission.collegeName,
        address: submission.address,
        emails: submission.emails,
        contacts: submission.contacts,
        principal: submission.principal,
        faculties: submission.faculties,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // 3. Automatically delete from temp collection
      await deleteDoc(doc(db, "tempCollegeDetails", submission.id));

      toast.success("Successfully merged and temporary record removed!");
    } catch (err) {
      console.error(err);
      toast.error("Process failed: " + err.message);
    }
  };

  if (checking) return <div style={styles.card}>Checking...</div>;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h4 style={{ margin: 0 }}>{submission.collegeName}</h4>
        <span style={styles.studentLabel}>By: {submission.studentEmail}</span>
      </div>

      <div style={styles.body}>
        <div style={styles.infoRow}><strong>Address:</strong> {submission.address}</div>
        <div style={styles.infoRow}><strong>Principal:</strong> {submission.principal?.name}</div>
        <div style={styles.infoRow}><strong>Faculty Count:</strong> {submission.faculties?.length}</div>
        
        {!masterData ? (
          <div style={styles.newAlert}>NEW COLLEGE: Not in Master List</div>
        ) : diffFound ? (
          <div style={styles.diffAlert}>UPDATE: New/Modified data detected</div>
        ) : (
          <div style={styles.sameAlert}>✓ DATA MATCH: Identical to Master</div>
        )}
      </div>

      <div style={styles.footer}>
        {diffFound ? (
          <button onClick={handleMerge} style={styles.mergeBtn}>Merge & Delete Temp</button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
             <button onClick={async () => await deleteDoc(doc(db, "tempCollegeDetails", submission.id))} style={styles.deleteBtn}>Clear Duplicate</button>
             <button disabled style={styles.disabledBtn}>Up to Date</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "20px" },
  card: { background: "#fff", border: "1px solid #ddd", borderRadius: "10px", overflow: "hidden", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" },
  header: { padding: "15px", background: "#f8f9fa", borderBottom: "1px solid #eee" },
  studentLabel: { fontSize: "11px", color: "#888", display: "block", marginTop: "4px" },
  body: { padding: "15px", flex: 1 },
  infoRow: { fontSize: "13px", marginBottom: "6px", color: "#444" },
  footer: { padding: "15px", borderTop: "1px solid #eee", textAlign: "right" },
  newAlert: { color: "#2e7d32", fontWeight: "bold", background: "#e8f5e9", padding: "8px", borderRadius: "4px", marginTop: "10px", fontSize: "12px" },
  diffAlert: { color: "#ef6c00", fontWeight: "bold", background: "#fff3e0", padding: "8px", borderRadius: "4px", marginTop: "10px", fontSize: "12px" },
  sameAlert: { color: "#1565c0", fontWeight: "bold", background: "#e3f2fd", padding: "8px", borderRadius: "4px", marginTop: "10px", fontSize: "12px" },
  mergeBtn: { background: "#006400", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  deleteBtn: { background: "#fff", color: "#d32f2f", border: "1px solid #d32f2f", padding: "10px 18px", borderRadius: "6px", cursor: "pointer" },
  disabledBtn: { background: "#eee", color: "#999", border: "none", padding: "10px 18px", borderRadius: "6px", cursor: "not-allowed" },
  emptyState: { textAlign: "center", padding: "50px", color: "#888", background: "#f9f9f9", borderRadius: "10px" }
};