import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { contentApi } from "../../../lib/api";
import { C, Spinner } from "../../../components/ui";
import Link from "next/link";

export default function TopicPage() {
  const router = useRouter();
  const { topicId } = router.query;
  const [subtopics, setSubtopics] = useState([]);
  const [topic, setTopic]         = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!topicId) return;
    contentApi.subtopics(topicId)
      .then(data => { setSubtopics(data?.subtopics || data || []); setTopic(data?.topic || null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [topicId]);

  const pctColor = (p) => p >= 80 ? C.green : p >= 50 ? C.amber : p > 0 ? C.accent : C.border;

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;

  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <button onClick={() => router.back()} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:20 }}>← Back</button>
      <h1 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>{topic?.name || "Topic"}</h1>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:24 }}>{subtopics.length} subtopics</p>

      {subtopics.length === 0 && <p style={{ color:C.textSec, textAlign:"center", padding:40 }}>No subtopics yet</p>}

      {subtopics.map((st, i) => {
        const pct = st.completion_pct || 0;
        return (
          <Link key={st.id} href={`/learn/${st.id}`} style={{ textDecoration:"none", display:"block" }}>
            <div style={{
              padding:"16px 20px", borderRadius:14, background:C.surface,
              border:`1px solid ${pct === 100 ? C.green : C.border}`,
              marginBottom:8, cursor:"pointer",
              display:"flex", justifyContent:"space-between", alignItems:"center",
            }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom: pct > 0 ? 8 : 0 }}>{st.name}</div>
                {pct > 0 && (
                  <div style={{ height:3, borderRadius:100, background:C.border, overflow:"hidden", maxWidth:180 }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:pctColor(pct), borderRadius:100 }} />
                  </div>
                )}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {pct > 0 && <span style={{ fontSize:12, fontWeight:700, color:pctColor(pct) }}>{pct}%</span>}
                {pct === 100 && <div style={{ width:22, height:22, borderRadius:"50%", background:C.green, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>✓</div>}
                <span style={{ color:C.textMuted, fontSize:14 }}>→</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
