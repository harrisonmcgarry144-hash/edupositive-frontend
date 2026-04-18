import { useState, useEffect } from "react";
import { paymentsApi } from "../lib/api";
import PremiumGate from "../components/PremiumGate";
import { C, Spinner } from "../components/ui";

export default function SuperCurricular() {
  const [isPremium, setIsPremium] = useState(null);

  useEffect(() => {
    paymentsApi.status().then(d => setIsPremium(d.isPremium)).catch(() => setIsPremium(false));
  }, []);

  if (isPremium === null) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;
  if (!isPremium) return <PremiumGate feature="Super Curricular" icon="🌍" />;

  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <h1 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>Super Curricular</h1>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:24 }}>University prep resources & beyond-the-classroom activities</p>

      <div style={{ padding:"40px 20px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🚀</div>
        <div style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:8 }}>Coming Soon</div>
        <div style={{ fontSize:14, color:C.textSec, lineHeight:1.6 }}>
          Super curricular resources, reading lists, university guides and enrichment activities are being built. Check back soon!
        </div>
      </div>
    </div>
  );
}
