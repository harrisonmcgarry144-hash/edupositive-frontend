import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { contentApi, analyticsApi } from "../../lib/api";
import { Card, ProgressBar, Tag, C, Spinner, PageWrap } from "../../components/ui";
import Link from "next/link";

export default function Learn() {
  const { user } = useAuth();
  const [subjects, setSubjects]   = useState([]);
  const [memory, setMemory]       = useState([]);
  const [open, setOpen]           = useState(null);
  const [topicsMap, setTopicsMap] = useState({});
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      contentApi.mySubjects().catch(() => contentApi.subjects(user?.level_type)),
      user ? analyticsApi.memory().catch(()=>[]) : Promise.resolve([]),
    ]).then(([s, m]) => {
      setSubjects(s || []);
      setMemory(m || []);
    }).finally(() => setLoading(false));
  }, [user]);

  const getStr = (id) => { const m = memory.find(x => x.subtopic_id === id); return m ? Math.round(m.score) : null; };
  const strColor = (s) => s === null ? C.textMuted : s >= 70 ? C.green : s >= 50 ? C.amber : C.red;

  const toggle = async (id) => {
    if (open === id) { setOpen(null); return; }
    setOpen(id);
    if (!topicsMap[id]) {
      const t = await contentApi.topics(id).catch(()=>[]);
      setTopicsMap(m => ({ ...m, [id]: t }));
    }
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding: 60 }}><Spinner size={32}/></div>;

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4, fontFamily: "var(--font-serif)" }}>Your Subjects</h1>
      <p style={{ fontSize: 13, color: C.textSec, marginBottom: 24 }}>Tap a subject to explore topics</p>
      {subjects.length === 0 && <p style={{ color: C.textSec, textAlign:"center", padding: 40 }}>No subjects found yet.</p>}
      {subjects.map(sub => {
        const isOpen = open === sub.id;
        const topics = topicsMap[sub.id] || [];
        return (
          <div key={sub.id} style={{ marginBottom: 10 }}>
            <button onClick={() => toggle(sub.id)} style={{
              width: "100%", padding: "16px 20px",
              background: isOpen ? "var(--surface-high)" : C.surface,
              border: `1px solid ${isOpen ? C.accent + "44" : C.border}`,
              borderRadius: isOpen ? "14px 14px 0 0" : 14,
              display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.accent + "22", display:"flex", alignItems:"center", justifyContent:"center", fontSize: 22 }}>
                {sub.icon || "📚"}
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{sub.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{sub.level_type?.toUpperCase()}</div>
              </div>
              <span style={{ color: C.textMuted, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", display:"inline-block" }}>▼</span>
            </button>
            {isOpen && (
              <div style={{ background: "var(--surface-high)", border: `1px solid ${C.accent + "22"}`, borderTop: "none", borderRadius: "0 0 14px 14px" }}>
                {topics.length === 0 && <div style={{ padding: 20, color: C.textMuted, fontSize: 13, textAlign:"center" }}>No topics yet</div>}
                {topics.map((topic, ti) => (
                  <div key={topic.id}>
                    <div style={{ padding: "10px 20px", fontSize: 12, fontWeight: 700, color: C.accent, borderBottom: `1px solid ${C.border}`, letterSpacing:"0.05em", textTransform:"uppercase" }}>{topic.name}</div>
                    {(topic.subtopics || []).map((st, si) => {
                      const s = getStr(st.id);
                      return (
                        <Link key={st.id} href={`/learn/${st.id}`}>
                          <div style={{ padding: "12px 24px", borderBottom: `1px solid ${C.border}`, cursor:"pointer" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom: s!==null ? 5:0 }}>
                              <span style={{ fontSize: 14, color: C.text }}>{st.name}</span>
                              {s !== null && <span style={{ fontSize: 12, color: strColor(s), fontWeight: 700 }}>{s}%</span>}
                            </div>
                            {s !== null && <ProgressBar value={s} color={strColor(s)} height={3} />}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
