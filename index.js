import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { examsApi, contentApi } from "../../lib/api";
import { Card, Btn, Tag, C, Spinner, Empty } from "../../components/ui";
import Link from "next/link";

export default function Exams() {
  const { user }             = useAuth();
  const [subjects, setSubs]  = useState([]);
  const [papers, setPapers]  = useState({});
  const [selected, setSelSub]= useState(null);
  const [selYear, setSelYear]= useState(null);
  const [loading, setLoad]   = useState(true);
  const [tab, setTab]        = useState("papers");

  useEffect(() => {
    if (!user) { setLoad(false); return; }
    contentApi.mySubjects()
      .then(subs => {
        setSubs(subs || []);
        if (subs?.length) setSelSub(subs[0]);
      })
      .finally(() => setLoad(false));
  }, [user]);

  useEffect(() => {
    if (!selected) return;
    examsApi.papersBySubject(selected.id)
      .then(p => setPapers(prev => ({ ...prev, [selected.id]: p || [] })))
      .catch(() => {});
  }, [selected]);

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;

  const subjectPapers = selected ? (papers[selected.id] || []) : [];
  const byYear = {};
  for (const p of subjectPapers) {
    if (!byYear[p.year]) byYear[p.year] = [];
    byYear[p.year].push(p);
  }
  const years = Object.keys(byYear).sort((a,b) => b - a);
  const yearPapers = selYear ? byYear[selYear] || [] : [];

  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <h1 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>Past Papers</h1>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:20 }}>Practice with real exam papers and track your grades</p>

      <div style={{ display:"flex", gap:8, marginBottom:24, overflowX:"auto" }}>
        {[["papers","📄 Papers"],["attempts","📊 My Results"],["schedule","📅 My Exams"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:"8px 16px", borderRadius:100, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap",
            background: tab===id ? "var(--accent-soft)" : "transparent",
            border:`1px solid ${tab===id ? C.accent : C.border}`,
            color: tab===id ? C.accent : C.textSec,
          }}>{label}</button>
        ))}
      </div>

      {tab === "papers" && (
        <>
          {subjects.length === 0 && <Empty icon="📚" title="No subjects selected" sub="Go to Settings to update your subjects" />}

          {subjects.length > 0 && (
            <>
              {/* Subject selector */}
              <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:20, paddingBottom:4 }}>
                {subjects.map(s => (
                  <button key={s.id} onClick={() => { setSelSub(s); setSelYear(null); }} style={{
                    padding:"8px 16px", borderRadius:100, fontSize:13, fontWeight:600,
                    cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
                    background: selected?.id===s.id ? "var(--accent-soft)" : C.surface,
                    border:`1px solid ${selected?.id===s.id ? C.accent : C.border}`,
                    color: selected?.id===s.id ? C.accent : C.textSec,
                  }}>{s.icon} {s.name}</button>
                ))}
              </div>

              {/* Year selector */}
              {!selYear && years.length > 0 && (
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:12, letterSpacing:"0.08em", textTransform:"uppercase" }}>Select Year — {selected?.name}</div>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    {years.map(year => (
                      <button key={year} onClick={() => setSelYear(year)} style={{
                        padding:"20px 28px", borderRadius:14, fontSize:20, fontWeight:800,
                        background:C.surface, border:`1px solid ${C.border}`,
                        color:C.text, cursor:"pointer",
                      }}>{year}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Papers for year */}
              {selYear && (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                    <button onClick={() => setSelYear(null)} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer" }}>← {selected?.name}</button>
                    <span style={{ color:C.textMuted, fontSize:14 }}>/ {selYear}</span>
                  </div>
                  {yearPapers.map(p => (
                    <Link key={p.id} href={`/exams/${p.id}`}>
                      <div style={{
                        padding:"18px 20px", borderRadius:14, background:C.surface,
                        border:`1px solid ${C.border}`, marginBottom:10, cursor:"pointer",
                        display:"flex", justifyContent:"space-between", alignItems:"center",
                      }}>
                        <div>
                          <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:6 }}>{p.title}</div>
                          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                            <Tag>{p.board_name}</Tag>
                            <Tag color={C.amber}>{p.total_marks} marks</Tag>
                            <Tag color={C.accent}>{p.duration_mins} mins</Tag>
                            {p.paper_url && <Tag color={C.green}>PDF ✓</Tag>}
                          </div>
                        </div>
                        <div style={{ fontSize:22, color:C.textMuted }}>→</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {!selYear && years.length === 0 && <Empty icon="📄" title="No papers yet" sub="Papers will appear here once uploaded by admin" />}
            </>
          )}
        </>
      )}

      {tab === "attempts" && <AttemptsTab />}
      {tab === "schedule" && <ScheduleTab />}
    </div>
  );
}

function AttemptsTab() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoad]      = useState(true);
  useEffect(() => { examsApi.attempts().then(setAttempts).catch(()=>{}).finally(()=>setLoad(false)); }, []);
  if (loading) return <Spinner />;
  if (!attempts.length) return <Empty icon="📊" title="No attempts yet" sub="Complete a past paper to see your results here" />;
  return (
    <div>
      {attempts.map(a => (
        <Link key={a.id} href={`/exams/attempt/${a.id}`}>
          <div style={{ padding:"14px 18px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, marginBottom:10, cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>{a.paper_title}</div>
                <div style={{ fontSize:12, color:C.textMuted }}>{new Date(a.started_at).toLocaleDateString("en-GB")}</div>
              </div>
              {a.final_grade ? (
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:28, fontWeight:800, color:["A*","A"].includes(a.final_grade)?C.green:["B","C"].includes(a.final_grade)?C.amber:C.red }}>{a.final_grade}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{a.total_score}/{a.total_marks}</div>
                </div>
              ) : <Tag color={C.amber}>In progress</Tag>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ScheduleTab() {
  const [schedule, setSched]  = useState([]);
  const [subjects, setSubs]   = useState([]);
  const [loading, setLoad]    = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ subjectId:"", paperName:"", examDate:"" });

  useEffect(() => {
    Promise.all([examsApi.schedule(), contentApi.mySubjects()])
      .then(([s,subs]) => { setSched(s||[]); setSubs(subs||[]); })
      .catch(()=>{}).finally(()=>setLoad(false));
  }, []);

  const add = async () => {
    const e = await examsApi.addExam(form);
    setSched(p => [...p, e]); setShowAdd(false);
  };

  if (loading) return <Spinner />;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
        <Btn onClick={() => setShowAdd(true)} style={{ padding:"9px 18px", fontSize:13 }}>+ Add Exam Date</Btn>
      </div>
      {!schedule.length && <Empty icon="📅" title="No exam dates added" sub="Add your exam dates to track countdowns" />}
      {schedule.map(e => {
        const days = Math.ceil((new Date(e.exam_date) - new Date()) / 86400000);
        return (
          <div key={e.id} style={{ padding:"16px 20px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{e.paper_name || e.subject_name}</div>
                <div style={{ fontSize:12, color:C.textMuted }}>{new Date(e.exam_date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:24, fontWeight:800, color:days<=7?C.red:days<=14?C.amber:C.accent }}>{days}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>days</div>
              </div>
            </div>
            <button onClick={() => { examsApi.deleteExam(e.id); setSched(p=>p.filter(x=>x.id!==e.id)); }} style={{ background:"none", border:"none", color:C.red, fontSize:12, cursor:"pointer", marginTop:8 }}>Remove</button>
          </div>
        );
      })}
      {showAdd && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
          <div style={{ background:C.surface, borderRadius:16, padding:24, width:"100%", maxWidth:400, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:16 }}>Add Exam Date</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <select value={form.subjectId} onChange={e=>setForm(p=>({...p,subjectId:e.target.value}))} style={{ width:"100%", padding:"12px", background:"var(--surface-high)", border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14 }}>
                <option value="">Select subject…</option>
                {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input placeholder="Paper name (e.g. Biology Paper 1)" value={form.paperName} onChange={e=>setForm(p=>({...p,paperName:e.target.value}))} style={{ padding:"12px", background:"var(--surface-high)", border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14 }} />
              <input type="date" value={form.examDate} onChange={e=>setForm(p=>({...p,examDate:e.target.value}))} style={{ padding:"12px", background:"var(--surface-high)", border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14 }} />
              <div style={{ display:"flex", gap:10 }}>
                <Btn variant="ghost" onClick={()=>setShowAdd(false)} style={{ flex:1, padding:"12px" }}>Cancel</Btn>
                <Btn onClick={add} disabled={!form.examDate} style={{ flex:1, padding:"12px" }}>Add</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
