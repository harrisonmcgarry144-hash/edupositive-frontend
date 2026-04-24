import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { contentApi, analyticsApi } from "../../lib/api";
import { C, Spinner } from "../../components/ui";
import Link from "next/link";

export default function Learn() {
  const { user } = useAuth();
  const [subjects, setSubjects]   = useState([]);
  const [memory, setMemory]       = useState([]);
  const [open, setOpen]           = useState(null);
  const [topicsMap, setTopicsMap] = useState({});
  const [progress, setProgress]   = useState({});
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      contentApi.mySubjects().catch(() => contentApi.subjects("a-level")),
      user ? analyticsApi.memory().catch(()=>[]) : Promise.resolve([]),
      contentApi.myProgress().catch(()=>({})),
    ]).then(([s, m, p]) => {
      setSubjects(s || []);
      setMemory(m || []);
      setProgress(p || {});
    }).finally(() => setLoading(false));
  }, [user]);

  const toggle = async (id) => {
    if (open === id) { setOpen(null); return; }
    setOpen(id);
    if (!topicsMap[id]) {
      const t = await contentApi.topics(id).catch(()=>[]);
      setTopicsMap(m => ({ ...m, [id]: t }));
    }
  };

  const pctColor = (p) => p >= 80 ? C.green : p >= 50 ? C.amber : p > 0 ? C.accent : C.border;

  if (loading) return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <div style={{ height:28, width:80, borderRadius:8, background:"var(--surface-high)" }} />
        <div style={{ width:36, height:36, borderRadius:"50%", background:"var(--surface-high)" }} />
      </div>
      <div style={{ height:13, width:200, borderRadius:6, background:"var(--surface-high)", marginBottom:24, marginTop:8 }} />
      {[1,2,3].map(i => (
        <div key={i} style={{ height:72, borderRadius:14, background:"var(--surface-high)", marginBottom:12 }} />
      ))}
    </div>
  );

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: "var(--font-serif)", margin:0 }}>Learn</h1>
        <Link href="/edit-subjects" style={{ width:36, height:36, borderRadius:"50%", background:"var(--accent-soft)", border:`1px solid var(--accent-glow)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:C.accent, textDecoration:"none", lineHeight:1 }}>+</Link>
      </div>
      <p style={{ fontSize: 13, color: C.textSec, marginBottom: 24 }}>Browse your A-Level subjects and topics</p>

      {subjects.length === 0 && (
        <div style={{ textAlign:"center", padding:40 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📚</div>
          <p style={{ color:C.textSec, marginBottom:16 }}>No subjects yet. Add your A-Level subjects to get started.</p>
          <Link href="/edit-subjects" style={{ padding:"12px 24px", borderRadius:12, background:C.accent, color:"#fff", textDecoration:"none", fontSize:14, fontWeight:700 }}>Add subjects →</Link>
        </div>
      )}

      {subjects.map(subject => {
        const subPct = progress[subject.id]?.subjectPct || 0;
        const topics = topicsMap[subject.id] || [];
        const isOpen = open === subject.id;

        return (
          <div key={subject.id} style={{ marginBottom: 12 }}>
            <div
              onClick={() => toggle(subject.id)}
              style={{
                padding: "16px 20px", borderRadius: isOpen ? "14px 14px 0 0" : 14,
                background: C.surface, border: `1px solid ${isOpen ? C.accent : C.border}`,
                cursor: "pointer", transition: "all 0.2s",
                borderBottom: isOpen ? `1px solid ${C.border}` : undefined,
              }}
            >
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: subPct > 0 ? 10 : 0 }}>
                <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{subject.icon}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{subject.name}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{subject.description}</div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
                  {subPct > 0 && <div style={{ fontSize: 13, fontWeight: 700, color: pctColor(subPct) }}>{subPct}%</div>}
                  <span style={{ color: C.textMuted, fontSize: 18, transition:"transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}>▾</span>
                </div>
              </div>
              {subPct > 0 && (
                <div style={{ height: 3, borderRadius: 100, background: C.border, overflow:"hidden" }}>
                  <div style={{ width:`${subPct}%`, height:"100%", background: pctColor(subPct), borderRadius:100, transition:"width 0.4s" }} />
                </div>
              )}
            </div>

            {isOpen && (
              <div style={{ background:"var(--surface-high)", border:`1px solid ${C.accent}`, borderTop:"none", borderRadius:"0 0 14px 14px", padding:"8px 0" }}>
                {topics.length === 0 && <div style={{ padding:"20px", textAlign:"center", color:C.textMuted, fontSize:13 }}>Loading topics…</div>}
                {topics.map((topic, ti) => {
                  const topicPct = progress[subject.id]?.topics?.[topic.id] || 0;
                  return (
                    <Link key={topic.id} href={`/learn/topic/${topic.id}`} style={{ textDecoration:"none", display:"block" }}>
                      <div style={{ padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom: ti < topics.length-1 ? `1px solid ${C.border}` : "none", cursor:"pointer" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom: topicPct > 0 ? 6 : 0 }}>{topic.name}</div>
                          {topicPct > 0 && (
                            <div style={{ height:2, borderRadius:100, background:C.border, overflow:"hidden", maxWidth:200 }}>
                              <div style={{ width:`${topicPct}%`, height:"100%", background:pctColor(topicPct), borderRadius:100 }} />
                            </div>
                          )}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          {topicPct > 0 && <span style={{ fontSize:12, fontWeight:700, color:pctColor(topicPct) }}>{topicPct}%</span>}
                          <span style={{ color:C.textMuted, fontSize:14 }}>→</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {subjects.length > 0 && (
        <Link href="/edit-subjects" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"16px 20px", borderRadius:14, background:"transparent", border:`1px dashed ${C.border}`, textDecoration:"none", marginTop:8 }}>
          <span style={{ fontSize:18, color:C.textMuted }}>+</span>
          <span style={{ fontSize:14, fontWeight:600, color:C.textMuted }}>Add or change subjects</span>
        </Link>
      )}
    </div>
  );
}
