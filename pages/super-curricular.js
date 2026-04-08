import { C } from "../components/ui";

export default function SuperCurricular() {
  return (
    <div style={{ padding:"60px 24px", textAlign:"center", minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🌟</div>
      <h1 style={{ fontSize:26, fontWeight:800, color:C.text, marginBottom:8, fontFamily:"var(--font-serif)" }}>Super Curricular</h1>
      <div style={{ display:"inline-block", padding:"4px 14px", borderRadius:100, background:"var(--accent-soft)", color:C.accent, fontSize:13, fontWeight:700, marginBottom:16 }}>Coming Soon</div>
      <p style={{ fontSize:15, color:C.textSec, maxWidth:400, lineHeight:1.7 }}>
        Curated resources, reading lists, podcasts and links to help you go beyond the A-Level syllabus and strengthen your university applications.
      </p>
      <p style={{ fontSize:13, color:C.textMuted, marginTop:12 }}>Tailored to your subjects and career aspirations.</p>
    </div>
  );
}
