import { C, Btn } from "../components/ui";

export default function Tutoring() {
  return (
    <div style={{ padding:"60px 24px", textAlign:"center", minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🎓</div>
      <h1 style={{ fontSize:26, fontWeight:800, color:C.text, marginBottom:8, fontFamily:"var(--font-serif)" }}>1-to-1 Tutoring</h1>
      <div style={{ display:"inline-block", padding:"4px 14px", borderRadius:100, background:"var(--accent-soft)", color:C.accent, fontSize:13, fontWeight:700, marginBottom:16 }}>Coming Soon</div>
      <p style={{ fontSize:15, color:C.textSec, maxWidth:400, lineHeight:1.7 }}>
        Book personalised 1-to-1 tutoring sessions with expert A-Level tutors.
      </p>
      <div style={{ marginTop:24, padding:"20px 28px", borderRadius:16, background:"var(--surface-high)", border:"1px solid var(--border)" }}>
        <div style={{ fontSize:32, fontWeight:800, color:C.accent, marginBottom:4 }}>£29.99</div>
        <div style={{ fontSize:14, color:C.textSec }}>per hour · online · tailored to your subjects</div>
      </div>
    </div>
  );
}
