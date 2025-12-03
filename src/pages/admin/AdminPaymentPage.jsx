import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import PaymentActionCard from "../../components/common/PaymentActionCard";

export default function AdminPaymentPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Approved applications (Waiting for payment or Verified)
    const q = query(collection(db, "applications"), where("status", "==", "approved"));
    getDocs(q).then(snap => {
      setApps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []); 

  if(loading) return <div style={{padding:30}}>Loading Payments...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h2>Payment Verification</h2>
      {apps.length === 0 ? <p>No applications waiting for payment.</p> : (
        apps.map(app => <PaymentActionCard key={app.id} app={app} user={user} />)
      )}
    </div>
  );
}