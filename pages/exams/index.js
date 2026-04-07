import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { examsApi, contentApi } from "../../lib/api";
import { Card, Btn, Tag, C, Spinner, Modal, Input, Empty } from "../../components/ui";
import Link from "next/link";

export default function Exams() {
  const { user } = useAuth();
  const [papers, setPapers]   = useState([]);
  const [schedule, setSched]  = useState([]);
  const [subjects, setSubs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newExam, setNewExam] = useState({ subjectId:"", paperName:"", examDate:"", board:"" });
  const [tab, setTab]         = useState("papers"); // papers | schedule | attempts

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      examsApi.papers(),
      examsApi.schedule(),
      contentApi.subjects(),
    ]).then(([p, s, subs]) => {
      setPapers(p||[]); setSched(s||[]); setSubs(subs||[]);
    }).finally(() => setLoading(false));
  }, [user]);

  const addExam = async () => {
    if (!newExam.examDate) return;
    const e = await examsApi.addExam(newExam);
    setSched(p => [...p, e]);
    setShowAdd(false);
    setNewExam({ subjectId:"", paperName:"", examDate:"", board:"" });
  };

  const removeExam = async (id) => {
    await examsApi.deleteExam(id);
    setSched(p => p.filter(e => e.id !== id));
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;

  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <h1 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>Exams</h1>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:20 }}>Past papers, practice, and your exam schedule</p>

      {/* Tab bar */}
      <div style={{ display:"flex", gap:8, marginBottom:24, overflowX:"auto" }}>
        {[["papers","📄 Papers"],["schedule","📅 My Exams"],["attempts","📊 My Results"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:"8px 16px", borderRadius:100, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap",
            background: tab===id ? "var(--accent-soft)" : "transparent",
            border:`1px solid ${tab===id ? C.accent : C.border}`,
            color: tab===id ? C.accent : C.textSec,
          }}>{label}</button>
        ))}
      </div>

      {/* Past papers */}
      {tab === "papers" && (
        <>
          {papers.length === 0 && <Empty icon="📄" title="No past papers yet" sub="Papers will appear here when added by the admin" />}
          {papers.map(p => (
            <Link key={p.id} href={`/exams/${p.id}`}>
              <div style={{ padding:"16px 20px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, marginBottom:10, cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{p.title || `${p.subject_name} — Paper ${p.paper_number}`}</div>
                    <div style={{ fontSize:12, color:C.textMuted }}>{p.board_name} · {p.year} · {p.question_count} questions</div>
                  </div>
                  <Tag color={C.accent}>{p.total_marks}m</Tag>
                </div>
              </div>
            </Link>
          ))}
        </>
      )}

      {/* Exam schedule */}
      {tab === "schedule" && (
        <>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
            <Btn onClick={() => setShowAdd(true)} style={{ padding:"9px 18px", fontSize:13 }}>+ Add Exam</Btn>
          </div>

          {schedule.length === 0 && <Empty icon="📅" title="No exams added yet" sub="Add your exam dates to generate a personalised study schedule" />}
          {schedule.map(e => {
            const days = Math.ceil((new Date(e.exam_date) - new Date()) / 86400000);
            return (
              <div key={e.id} style={{ padding:"16px 20px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{e.paper_name || e.subject_name}</div>
                    <div style={{ fontSize:12, color:C.textMuted }}>{new Date(e.exam_date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</div>
                    {e.board && <div style={{ fontSize:12, color:C.textMuted }}>{e.board}</div>}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:24, fontWeight:800, color: days<=7?C.red:days<=14?C.amber:C.accent }}>{days}</div>
                    <div style={{ fontSize:11, color:C.textMuted }}>days</div>
                  </div>
                </div>
                <button onClick={() => removeExam(e.id)} style={{ background:"none", border:"none", color:C.red, fontSize:12, cursor:"pointer", marginTop:8 }}>Remove</button>
              </div>
            );
          })}
        </>
      )}

      {tab === "attempts" && <AttemptsTab />}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Exam Date">
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <div style={{ fontSize:12, color:C.textSec, marginBottom:6, fontWeight:600 }}>Subject</div>
            <select value={newExam.subjectId} onChange={e => setNewExam(p=>({...p,subjectId:e.target.value}))} style={{ width:"100%", padding:"12px 16px", background:"var(--surface-high)", border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14 }}>
              <option value="">Select subject…</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <Input label="Paper name (optional)" placeholder="e.g. Biology Paper 1" value={newExam.paperName} onChange={e => setNewExam(p=>({...p,paperName:e.target.value}))} />
          <Input label="Exam date" type="date" value={newExam.examDate} onChange={e => setNewExam(p=>({...p,examDate:e.target.value}))} />
          <Input label="Exam board (optional)" placeholder="e.g. AQA" value={newExam.board} onChange={e => setNewExam(p=>({...p,board:e.target.value}))} />
          <Btn onClick={addExam} disabled={!newExam.examDate} style={{ width:"100%", padding:"12px" }}>Add Exam</Btn>
        </div>
      </Modal>
    </div>
  );
}

function AttemptsTab() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    examsApi.attempts().then(setAttempts).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!attempts.length) return <Empty icon="📊" title="No attempts yet" sub="Complete a past paper to see your results here" />;

  return (
    <div>
      {attempts.map(a => (
        <Link key={a.id} href={`/exams/attempt/${a.id}`}>
          <div style={{ padding:"14px 18px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, marginBottom:10, cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{a.paper_title || "Practice Attempt"}</div>
                <div style={{ fontSize:12, color:C.textMuted }}>{new Date(a.started_at).toLocaleDateString("en-GB")} · {a.mode}</div>
              </div>
              {a.total_score !== null && (
                <div style={{ fontSize:20, fontWeight:800, color:C.accent }}>{a.total_score}</div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
