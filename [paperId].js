import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { examsApi } from "../../lib/api";
import { Btn, Tag, C, Spinner } from "../../components/ui";

export default function PaperPage() {
  const router = useRouter();
  const { paperId } = router.query;
  const [paper, setPaper]     = useState(null);
  const [loading, setLoad]    = useState(true);
  const [phase, setPhase]     = useState("info"); // info | exam | marking | result
  const [attempt, setAttempt] = useState(null);
  const [timerOn, setTimerOn] = useState(false);
  const [timeLeft, setTimeLeft]= useState(0);
  const [marks, setMarks]     = useState({});
  const timerRef              = useRef(null);

  useEffect(() => {
    if (!paperId) return;
    examsApi.paper(paperId).then(p => { setPaper(p); setTimeLeft((p?.duration_mins||120)*60); }).finally(()=>setLoad(false));
  }, [paperId]);

  const startExam = async (withTimer) => {
    const a = await examsApi.startAttempt({ paperId, mode: withTimer ? "timed" : "practice" });
    setAttempt(a);
    setTimerOn(withTimer);
    setPhase("exam");
    if (withTimer) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); setPhase("marking"); return 0; }
          return t - 1;
        });
      }, 1000);
    }
  };

  const finishExam = () => {
    clearInterval(timerRef.current);
    setPhase("marking");
  };

  const submitMarks = async () => {
    const totalScore = Object.values(marks).reduce((a,b) => a + (parseInt(b)||0), 0);
    await examsApi.submitAttempt(attempt.id, { totalScore, marksBreakdown: marks });
    setPhase("result");
  };

  const calcGrade = () => {
    if (!paper?.gradeBoundaries?.length) return null;
    const score = Object.values(marks).reduce((a,b) => a+(parseInt(b)||0), 0);
    const sorted = [...paper.gradeBoundaries].sort((a,b) => b.min_marks - a.min_marks);
    for (const b of sorted) {
      if (score >= b.min_marks) return { grade: b.grade, score, total: paper.total_marks };
    }
    return { grade: "U", score, total: paper.total_marks };
  };

  const formatTime = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;

  // ── Info screen ────────────────────────────────────────────────────────────
  if (phase === "info") return (
    <div style={{ padding:"20px 16px 100px" }}>
      <button onClick={() => router.back()} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:20 }}>← Back</button>
      <h1 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:12, fontFamily:"var(--font-serif)" }}>{paper?.title}</h1>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:24 }}>
        {paper?.board_name && <Tag>{paper.board_name}</Tag>}
        {paper?.year && <Tag color={C.amber}>{paper.year}</Tag>}
        {paper?.total_marks && <Tag color={C.green}>{paper.total_marks} marks</Tag>}
        {paper?.duration_mins && <Tag color={C.accent}>{paper.duration_mins} mins</Tag>}
      </div>

      {/* Grade boundaries */}
      {paper?.gradeBoundaries?.length > 0 && (
        <div style={{ padding:"16px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:12, letterSpacing:"0.08em", textTransform:"uppercase" }}>Grade Boundaries</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {paper.gradeBoundaries.sort((a,b)=>b.min_marks-a.min_marks).map(b => (
              <div key={b.grade} style={{ textAlign:"center", padding:"10px 16px", background:"var(--surface-high)", borderRadius:10 }}>
                <div style={{ fontSize:18, fontWeight:800, color:b.grade==="A*"||b.grade==="A"?C.green:b.grade==="B"||b.grade==="C"?C.amber:C.red }}>{b.grade}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>{b.min_marks}+</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PDF viewer if uploaded */}
      {paper?.paper_url && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:10, letterSpacing:"0.08em", textTransform:"uppercase" }}>Question Paper</div>
          <div style={{ borderRadius:14, overflow:"hidden", border:`1px solid ${C.border}`, background:C.surface }}>
            <iframe
              src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(paper.paper_url)}`}
              style={{ width:"100%", height:500, border:"none" }}
              title="Question Paper"
            />
          </div>
          <a href={paper.paper_url} target="_blank" rel="noreferrer">
            <Btn variant="ghost" style={{ width:"100%", marginTop:10, padding:"10px" }}>⬇ Download Paper PDF</Btn>
          </a>
        </div>
      )}

      {!paper?.paper_url && (
        <div style={{ padding:"20px", background:"rgba(245,158,11,0.1)", border:`1px solid ${C.amber}`, borderRadius:12, marginBottom:24 }}>
          <div style={{ fontSize:13, color:C.amber, fontWeight:600, marginBottom:4 }}>📄 Paper PDF not yet uploaded</div>
          <div style={{ fontSize:12, color:C.textSec }}>Download the paper from <a href="https://www.physicsandmathstutor.com" target="_blank" rel="noreferrer" style={{ color:C.accent }}>Physics & Maths Tutor</a> or the exam board website.</div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <Btn onClick={() => startExam(true)} style={{ padding:"14px", fontSize:15, width:"100%" }}>⏱ Start Timed ({paper?.duration_mins} mins)</Btn>
        <Btn onClick={() => startExam(false)} variant="ghost" style={{ padding:"14px", fontSize:15, width:"100%" }}>📝 Practice (no timer)</Btn>
      </div>
    </div>
  );

  // ── Exam screen ────────────────────────────────────────────────────────────
  if (phase === "exam") return (
    <div style={{ padding:"20px 16px 100px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:C.text }}>Paper in progress</h2>
        {timerOn && (
          <div style={{ padding:"8px 16px", borderRadius:10, background:timeLeft<300?"rgba(239,68,68,0.15)":"var(--surface-high)", fontSize:18, fontWeight:800, color:timeLeft<300?C.red:C.text }}>
            ⏱ {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {paper?.paper_url ? (
        <div>
          <div style={{ borderRadius:14, overflow:"hidden", border:`1px solid ${C.border}`, marginBottom:16 }}>
            <iframe
              src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(paper.paper_url)}`}
              style={{ width:"100%", height:600, border:"none" }}
              title="Question Paper"
            />
          </div>
          <a href={paper.paper_url} target="_blank" rel="noreferrer">
            <Btn variant="ghost" style={{ width:"100%", marginBottom:12, padding:"10px" }}>⬇ Open in new tab</Btn>
          </a>
        </div>
      ) : (
        <div style={{ padding:"24px", background:"var(--surface-high)", borderRadius:14, marginBottom:20, textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📄</div>
          <p style={{ color:C.textSec, fontSize:14 }}>Work through your paper. Come back when you're done to self-mark.</p>
        </div>
      )}

      <Btn onClick={finishExam} style={{ width:"100%", padding:"14px", fontSize:15 }}>
        ✓ I'm done — go to mark scheme
      </Btn>
    </div>
  );

  // ── Marking screen ─────────────────────────────────────────────────────────
  if (phase === "marking") return (
    <div style={{ padding:"20px 16px 100px" }}>
      <h2 style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>Self-Mark</h2>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:20 }}>Use the mark scheme to mark your work, then enter your marks below.</p>

      {/* Mark scheme viewer */}
      {paper?.mark_scheme_url ? (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:10, letterSpacing:"0.08em", textTransform:"uppercase" }}>Mark Scheme</div>
          <div style={{ borderRadius:14, overflow:"hidden", border:`1px solid ${C.border}`, marginBottom:10 }}>
            <iframe
              src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(paper.mark_scheme_url)}`}
              style={{ width:"100%", height:500, border:"none" }}
              title="Mark Scheme"
            />
          </div>
          <a href={paper.mark_scheme_url} target="_blank" rel="noreferrer">
            <Btn variant="ghost" style={{ width:"100%", padding:"10px" }}>⬇ Open mark scheme in new tab</Btn>
          </a>
        </div>
      ) : (
        <div style={{ padding:"16px", background:"rgba(245,158,11,0.1)", border:`1px solid ${C.amber}`, borderRadius:12, marginBottom:20 }}>
          <div style={{ fontSize:13, color:C.amber, fontWeight:600, marginBottom:4 }}>📋 Mark scheme not yet uploaded</div>
          <div style={{ fontSize:12, color:C.textSec }}>Find the mark scheme on <a href="https://www.physicsandmathstutor.com" target="_blank" rel="noreferrer" style={{ color:C.accent }}>Physics & Maths Tutor</a> or the exam board website.</div>
        </div>
      )}

      {/* Enter marks */}
      <div style={{ padding:"20px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:16 }}>Enter your marks</div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, color:C.textSec, marginBottom:8 }}>Total marks (out of {paper?.total_marks})</div>
          <input
            type="number"
            min="0"
            max={paper?.total_marks}
            value={marks.total || ""}
            onChange={e => setMarks({ total: e.target.value })}
            placeholder={`0 – ${paper?.total_marks}`}
            style={{
              width:"100%", padding:"16px", background:"var(--surface-high)",
              border:`2px solid ${C.accent}`, borderRadius:12, color:C.text,
              fontSize:24, fontWeight:800, textAlign:"center", outline:"none",
            }}
          />
        </div>

        {/* Preview grade */}
        {marks.total !== undefined && marks.total !== "" && (
          <div style={{ textAlign:"center", padding:"16px", background:"var(--surface-high)", borderRadius:12 }}>
            {(() => {
              const score = parseInt(marks.total)||0;
              const boundaries = paper?.gradeBoundaries?.sort((a,b)=>b.min_marks-a.min_marks) || [];
              let grade = "U";
              for (const b of boundaries) { if (score >= b.min_marks) { grade = b.grade; break; } }
              const color = ["A*","A"].includes(grade)?C.green:["B","C"].includes(grade)?C.amber:C.red;
              return (
                <div>
                  <div style={{ fontSize:14, color:C.textSec, marginBottom:4 }}>Predicted grade</div>
                  <div style={{ fontSize:48, fontWeight:800, color }}>{grade}</div>
                  <div style={{ fontSize:13, color:C.textSec }}>{score} / {paper?.total_marks}</div>
                  {boundaries.length > 0 && (
                    <div style={{ fontSize:12, color:C.textMuted, marginTop:8 }}>
                      {boundaries.find(b=>b.grade==="A")?.min_marks} marks needed for an A
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <Btn onClick={submitMarks} disabled={!marks.total} style={{ width:"100%", padding:"14px", fontSize:15 }}>
        Save Result →
      </Btn>
    </div>
  );

  // ── Result screen ──────────────────────────────────────────────────────────
  if (phase === "result") {
    const score = parseInt(marks.total)||0;
    const boundaries = paper?.gradeBoundaries?.sort((a,b)=>b.min_marks-a.min_marks) || [];
    let grade = "U";
    for (const b of boundaries) { if (score >= b.min_marks) { grade = b.grade; break; } }
    const color = ["A*","A"].includes(grade)?C.green:["B","C"].includes(grade)?C.amber:C.red;
    const pct = Math.round(score/paper?.total_marks*100);

    return (
      <div style={{ padding:"40px 16px 100px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center" }}>
        <div style={{ fontSize:60, marginBottom:8, fontWeight:800, color }}>{grade}</div>
        <div style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:4 }}>{score} / {paper?.total_marks}</div>
        <div style={{ fontSize:16, color:C.textSec, marginBottom:8 }}>{pct}%</div>
        <div style={{ fontSize:14, color:C.textSec, marginBottom:32 }}>{paper?.title}</div>

        {boundaries.length > 0 && (
          <div style={{ width:"100%", maxWidth:400, padding:"16px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, marginBottom:24 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:12, letterSpacing:"0.08em", textTransform:"uppercase" }}>Grade Boundaries</div>
            <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap" }}>
              {boundaries.map(b => (
                <div key={b.grade} style={{
                  textAlign:"center", padding:"10px 14px", borderRadius:10,
                  background: grade===b.grade ? `${color}22` : "var(--surface-high)",
                  border: `1px solid ${grade===b.grade ? color : C.border}`,
                }}>
                  <div style={{ fontSize:16, fontWeight:800, color:["A*","A"].includes(b.grade)?C.green:["B","C"].includes(b.grade)?C.amber:C.red }}>{b.grade}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{b.min_marks}+</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:12, width:"100%", maxWidth:400 }}>
          <Btn variant="ghost" onClick={() => router.push("/exams")} style={{ flex:1, padding:"13px" }}>← Back</Btn>
          <Btn onClick={() => { setPhase("info"); setMarks({}); clearInterval(timerRef.current); }} style={{ flex:1, padding:"13px" }}>Retry</Btn>
        </div>
      </div>
    );
  }

  return null;
}
