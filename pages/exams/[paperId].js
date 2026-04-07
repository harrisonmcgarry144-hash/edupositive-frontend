import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { examsApi, aiApi } from "../../lib/api";
import { Card, Btn, Tag, C, Spinner } from "../../components/ui";

export default function PaperPage() {
  const router = useRouter();
  const { paperId } = router.query;
  const [paper, setPaper]       = useState(null);
  const [questions, setQs]      = useState([]);
  const [attempt, setAttempt]   = useState(null);
  const [answers, setAnswers]   = useState({});
  const [results, setResults]   = useState({});
  const [loading, setLoading]   = useState(true);
  const [marking, setMarking]   = useState({});
  const [submitted, setSubmit]  = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef                = useRef(null);

  useEffect(() => {
    if (!paperId) return;
    Promise.all([examsApi.paper(paperId), examsApi.questions(paperId)])
      .then(([p, q]) => { setPaper(p); setQs(q||[]); })
      .finally(() => setLoading(false));
  }, [paperId]);

  const startExam = async (mode) => {
    const a = await examsApi.startAttempt({ paperId, mode });
    setAttempt(a);
    if (mode === "timed" && paper.duration_mins) {
      setTimeLeft(paper.duration_mins * 60);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); handleSubmit(a.id); return 0; }
          return t - 1;
        });
      }, 1000);
    }
  };

  const handleSubmit = async (aId) => {
    clearInterval(timerRef.current);
    const id = aId || attempt?.id;
    for (const [qId, text] of Object.entries(answers)) {
      await examsApi.saveAnswer(id, { questionId: qId, answerText: text }).catch(()=>{});
    }
    await examsApi.submitAttempt(id, {});
    setSubmit(true);
  };

  const markAnswer = async (q) => {
    setMarking(p => ({ ...p, [q.id]: true }));
    try {
      const res = await aiApi.mark({ questionId: q.id, attemptId: attempt?.id, answerText: answers[q.id] || "" });
      setResults(p => ({ ...p, [q.id]: res }));
    } catch (e) { alert(e.message); }
    finally { setMarking(p => ({ ...p, [q.id]: false })); }
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  // Paper info screen
  if (!attempt) return (
    <div style={{ padding:"20px 16px 100px" }}>
      <button onClick={() => router.back()} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:20 }}>← Back</button>
      <h1 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:8, fontFamily:"var(--font-serif)" }}>
        {paper?.title || "Past Paper"}
      </h1>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:24 }}>
        {paper?.board_name && <Tag>{paper.board_name}</Tag>}
        {paper?.year && <Tag color={C.amber}>{paper.year}</Tag>}
        {paper?.total_marks && <Tag color={C.green}>{paper.total_marks} marks</Tag>}
        {paper?.duration_mins && <Tag color={C.accent}>{paper.duration_mins} mins</Tag>}
      </div>

      {paper?.gradeBoundaries?.length > 0 && (
        <Card style={{ marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:12, letterSpacing:"0.08em", textTransform:"uppercase" }}>Grade Boundaries</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {paper.gradeBoundaries.map(b => (
              <div key={b.grade} style={{ textAlign:"center", padding:"8px 14px", background:"var(--surface-high)", borderRadius:10 }}>
                <div style={{ fontSize:16, fontWeight:800, color:C.accent }}>{b.grade}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>{b.min_marks}+</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <p style={{ fontSize:14, color:C.textSec, marginBottom:24 }}>{questions.length} questions</p>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <Btn onClick={() => startExam("practice")} style={{ padding:"14px", fontSize:15, width:"100%" }}>📝 Practice Mode</Btn>
        <Btn onClick={() => startExam("timed")} variant="ghost" style={{ padding:"14px", fontSize:15, width:"100%" }}>⏱ Timed Mode</Btn>
      </div>
    </div>
  );

  // Results screen
  if (submitted) return (
    <div style={{ padding:"20px 16px 100px" }}>
      <h1 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>Exam Submitted ✓</h1>
      <p style={{ color:C.textSec, fontSize:14, marginBottom:24 }}>Mark each answer below to get AI feedback.</p>
      {questions.map(q => (
        <Card key={q.id} style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <Tag>{q.question_number || `Q${questions.indexOf(q)+1}`}</Tag>
            <Tag color={C.amber}>{q.marks} marks</Tag>
          </div>
          <p style={{ fontSize:14, color:C.text, marginBottom:8 }}>{q.question_text}</p>
          <div style={{ padding:"10px 14px", background:"var(--surface-high)", borderRadius:10, fontSize:13, color:C.textSec, marginBottom:12, fontStyle:"italic" }}>
            {answers[q.id] || "No answer given"}
          </div>
          {results[q.id] ? (
            <div>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                <Tag color={C.green}>{results[q.id].marksAwarded}/{q.marks} marks</Tag>
              </div>
              <p style={{ fontSize:13, color:C.text, marginBottom:8 }}>{results[q.id].feedback}</p>
              {results[q.id].improvements?.map((imp,i) => (
                <div key={i} style={{ fontSize:12, color:C.amber, padding:"6px 12px", background:"rgba(245,158,11,0.1)", borderRadius:8, marginBottom:4 }}>↑ {imp}</div>
              ))}
            </div>
          ) : (
            <Btn onClick={() => markAnswer(q)} disabled={marking[q.id]} variant="ghost" style={{ fontSize:13, padding:"8px 16px" }}>
              {marking[q.id] ? "Marking…" : "✦ AI Mark this"}
            </Btn>
          )}
        </Card>
      ))}
    </div>
  );

  // Active exam
  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h1 style={{ fontSize:18, fontWeight:800, color:C.text, fontFamily:"var(--font-serif)" }}>
          {paper?.title || "Exam"}
        </h1>
        {timeLeft !== null && (
          <div style={{ padding:"6px 14px", background: timeLeft<300?"rgba(239,68,68,0.15)":"var(--surface-high)", borderRadius:10, fontSize:16, fontWeight:800, color: timeLeft<300?C.red:C.text }}>
            ⏱ {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {questions.map((q, i) => (
        <Card key={q.id} style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.textSec }}>Question {q.question_number || i+1}</span>
            <Tag color={C.amber}>{q.marks} mark{q.marks!==1?"s":""}</Tag>
          </div>
          <p style={{ fontSize:14, color:C.text, marginBottom:14, lineHeight:1.6 }}>{q.question_text}</p>
          <textarea
            value={answers[q.id] || ""}
            onChange={e => setAnswers(p => ({...p,[q.id]:e.target.value}))}
            placeholder="Write your answer here…"
            rows={4}
            style={{
              width:"100%", padding:"12px 14px", background:"var(--surface-high)",
              border:`1px solid ${C.border}`, borderRadius:10, color:C.text,
              fontSize:13, lineHeight:1.6, fontFamily:"var(--font)", resize:"vertical", outline:"none",
            }}
          />
        </Card>
      ))}

      <Btn onClick={() => handleSubmit()} style={{ width:"100%", padding:"14px", fontSize:15 }}>
        Submit Exam →
      </Btn>
    </div>
  );
}
