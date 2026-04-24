import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { contentApi } from "../../lib/api";
import { Btn, C, Spinner } from "../../components/ui";
import Link from "next/link";

function parseSections(content) {
  if (!content) return [];
  const sections = [];
  const parts = content.split(/^##\s+/m);
  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split('\n');
    const title = lines[0].trim();
    const body = lines.slice(1).join('\n').trim();
    if (!body) continue;
    const paragraphs = body.split(/\n\n+/).filter(p => p.trim().length > 30);
    sections.push({ title, paragraphs });
  }
  return sections;
}

const SECTION_THEMES = {
  "Introduction": { icon:"🔍", accent:"#6c63ff", bg:"rgba(99,102,241,0.08)" },
  "Core Concepts": { icon:"💡", accent:"#22d3a0", bg:"rgba(34,211,160,0.08)" },
  "Key Details": { icon:"📌", accent:"#f59e0b", bg:"rgba(245,158,11,0.08)" },
  "Worked Examples": { icon:"✏️", accent:"#3b82f6", bg:"rgba(59,130,246,0.08)" },
  "Common Exam Mistakes": { icon:"⚠️", accent:"#ef4444", bg:"rgba(239,68,68,0.08)" },
  "Summary": { icon:"📝", accent:"#a78bfa", bg:"rgba(167,139,250,0.08)" },
};
const DEFAULT_THEME = { icon:"📄", accent:"#6c63ff", bg:"rgba(99,102,241,0.08)" };

export default function SubtopicPage() {
  const router = useRouter();
  const { subtopicId } = router.query;
  const [lessons, setLessons] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subtopicId) return;
    contentApi.lessons(subtopicId).then(setLessons).catch(() => {}).finally(() => setLoading(false));
  }, [subtopicId]);

  const openLesson = async (id) => {
    const lesson = await contentApi.lesson(id).catch(() => null);
    setSelected(lesson);
    setMode(null);
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;

  if (selected && mode) return (
    <ModeView lesson={selected} mode={mode}
      onBack={() => setMode(null)}
      onExit={() => { setSelected(null); setMode(null); }}
      onComplete={() => {
        setLessons(p => p.map(l => l.id === selected.id ? {...l, completed:true} : l));
        setMode(null);
      }} />
  );

  if (selected) return <LessonModeSelect lesson={selected} onSelect={setMode} onBack={() => setSelected(null)} />;

  return (
    <div style={{ padding:"20px 16px 100px", maxWidth:680, margin:"0 auto" }}>
      <button onClick={() => router.back()} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:20 }}>← Back</button>
      <h1 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>Lessons</h1>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:24 }}>{lessons.length} lessons available</p>
      {lessons.length === 0 && <p style={{ color:C.textSec, textAlign:"center", padding:40 }}>Lessons are being generated — check back in a moment!</p>}
      {lessons.map((l, i) => (
        <div key={l.id} onClick={() => openLesson(l.id)} style={{
          padding:"18px 20px", borderRadius:16, background:C.surface,
          border:`1px solid ${l.completed ? C.green : C.border}`,
          marginBottom:10, cursor:"pointer", display:"flex", alignItems:"center", gap:14,
        }}>
          <div style={{ width:40, height:40, borderRadius:10, background:l.completed ? C.green : "var(--accent-soft)", color:l.completed ? "#fff" : C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:800, flexShrink:0 }}>
            {l.completed ? "✓" : i + 1}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{l.title}</div>
            {l.summary && <p style={{ fontSize:12, color:C.textSec, lineHeight:1.5, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{l.summary}</p>}
          </div>
          <span style={{ color:C.textMuted, fontSize:16, flexShrink:0 }}>›</span>
        </div>
      ))}
    </div>
  );
}

function LessonModeSelect({ lesson, onSelect, onBack }) {
  const modes = [
    { id:"lesson", icon:"📖", label:"Learn", desc:"Go through the lesson at your own pace", color:"#6c63ff" },
    { id:"quiz", icon:"✅", label:"Quiz", desc:"Test your understanding with practice questions", color:"#22d3a0" },
    { id:"blurt", icon:"🧠", label:"Blurt", desc:"Write everything you remember — AI marks it", color:"#f59e0b" },
    { id:"mindmap", icon:"🗺️", label:"Mind Map", desc:"Build a mind map — AI grades the connections", color:"#a78bfa" },
  ];
  return (
    <div style={{ padding:"20px 16px 100px", maxWidth:680, margin:"0 auto" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:20 }}>← Back to lessons</button>
      <div style={{ fontSize:12, color:C.textMuted, marginBottom:4 }}>{lesson.subject_name} · {lesson.topic_name}</div>
      <h1 style={{ fontSize:28, fontWeight:800, color:C.text, marginBottom:8, fontFamily:"var(--font-serif)", lineHeight:1.2 }}>{lesson.title}</h1>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:28 }}>How would you like to study this?</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:12 }}>
        {modes.map(m => (
          <button key={m.id} onClick={() => onSelect(m.id)} style={{
            padding:"22px 18px", borderRadius:18, background:C.surface, border:`1px solid ${C.border}`,
            textAlign:"left", cursor:"pointer", transition:"all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}>
            <div style={{ width:44, height:44, borderRadius:12, background:`${m.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:12 }}>{m.icon}</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:4 }}>{m.label}</div>
            <div style={{ fontSize:12, color:C.textSec, lineHeight:1.5 }}>{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ModeView({ lesson, mode, onBack, onExit, onComplete }) {
  if (mode === "lesson") return <LessonMode lesson={lesson} onBack={onBack} onExit={onExit} onComplete={onComplete} />;
  if (mode === "quiz") return <QuizMode lesson={lesson} onBack={onBack} onExit={onExit} onComplete={onComplete} />;
  if (mode === "blurt") return <BlurtMode lesson={lesson} onBack={onBack} onExit={onExit} onComplete={onComplete} />;
  if (mode === "mindmap") return <MindMapMode lesson={lesson} onBack={onBack} onExit={onExit} onComplete={onComplete} />;
  return null;
}

// ═══ LESSON MODE ═══════════════════════════════════════════════════════════
function LessonMode({ lesson, onBack, onExit, onComplete }) {
  const sections = parseSections(lesson.content);
  const allCards = [];
  sections.forEach(sec => {
    sec.paragraphs.forEach((para, pi) => {
      allCards.push({ sectionTitle: sec.title, paragraph: para, isFirst: pi === 0 });
    });
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState("read"); // read | check | result
  const [question, setQuestion] = useState(null);
  const [loadingQ, setLoadingQ] = useState(false);
  const [answered, setAnswered] = useState(null); // null | 'correct' | 'wrong'
  const [completed, setCompleted] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [slideDir, setSlideDir] = useState('none');
  const touchStart = useRef(null);

  const total = allCards.length;
  const isLast = currentIdx === total - 1;
  const card = allCards[currentIdx];
  const theme = SECTION_THEMES[card?.sectionTitle] || DEFAULT_THEME;
  const progress = Math.round(((currentIdx + 1) / total) * 100);

  const loadQuestion = async () => {
    setLoadingQ(true);
    setQuestion(null);
    try {
      const token = localStorage.getItem('ep_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://edupositive-backend.onrender.com'}/api/content/lessons/${lesson.id}/paragraph-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ paragraph: card.paragraph, paragraphIndex: currentIdx })
      });
      if (res.ok) setQuestion(await res.json());
    } catch(e) {}
    setLoadingQ(false);
  };

  // "Next" now triggers the quick check first
  const handleNext = () => {
    if (isLast) {
      handleComplete();
      return;
    }
    setPhase("check");
    setAnswered(null);
    loadQuestion();
  };

  const advanceCard = () => {
    setSlideDir('left');
    setTimeout(() => {
      setCurrentIdx(i => i + 1);
      setPhase("read");
      setQuestion(null);
      setAnswered(null);
      setSlideDir('none');
    }, 200);
  };

  const onAnswer = (correct) => {
    setAnswered(correct ? 'correct' : 'wrong');
    if (correct) setTimeout(() => advanceCard(), 900);
  };

  const skipCheck = () => advanceCard();

  const goPrev = () => {
    if (currentIdx <= 0) return;
    setSlideDir('right');
    setTimeout(() => {
      setCurrentIdx(i => i - 1);
      setPhase("read");
      setQuestion(null);
      setAnswered(null);
      setSlideDir('none');
    }, 200);
  };

  const handleComplete = async () => {
    try { await contentApi.completeLesson(lesson.id); } catch(e) {}
    setCompleted(true);
    setTimeout(() => onComplete(), 1000);
  };

  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) > 60) {
      if (diff > 0) goPrev();
    }
    touchStart.current = null;
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      {/* Top bar */}
      <div style={{ padding:"14px 16px 10px", borderBottom:`1px solid ${C.border}`, background:C.bg, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, maxWidth:680, margin:"0 auto" }}>
          <button onClick={() => setShowLeave(true)} style={{ background:"none", border:"none", color:C.textSec, fontSize:22, cursor:"pointer", lineHeight:1, padding:4 }}>×</button>
          <div style={{ flex:1, height:6, background:"var(--surface-high)", borderRadius:100, overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:100, background:`linear-gradient(90deg, ${theme.accent}, ${C.accent})`, width:`${progress}%`, transition:"width 0.3s ease" }} />
          </div>
          <span style={{ fontSize:12, color:C.textMuted, minWidth:38, textAlign:"right" }}>{currentIdx + 1}/{total}</span>
        </div>
      </div>

      {/* Card area */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"20px 16px", maxWidth:680, width:"100%", margin:"0 auto" }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

        {/* Section label */}
        {card?.isFirst && phase === "read" && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
            <span style={{ fontSize:20 }}>{theme.icon}</span>
            <span style={{ fontSize:12, fontWeight:800, color:theme.accent, textTransform:"uppercase", letterSpacing:"0.08em" }}>{card.sectionTitle}</span>
          </div>
        )}

        {/* Main card */}
        <div style={{
          flex:1, background: phase === "check" ? "var(--surface-high)" : theme.bg, borderRadius:24,
          border:`1px solid ${phase === "check" ? C.accent : theme.accent + "33"}`,
          padding:"32px 28px", display:"flex", flexDirection:"column", justifyContent:"center",
          minHeight:300,
          transform: slideDir === 'left' ? 'translateX(-20px)' : slideDir === 'right' ? 'translateX(20px)' : 'translateX(0)',
          opacity: slideDir === 'none' ? 1 : 0.3,
          transition: 'all 0.2s ease',
        }}>
          {phase === "read" && (
            <p style={{ fontSize:18, color:C.text, lineHeight:1.8, margin:0, whiteSpace:"pre-wrap" }}>{card?.paragraph}</p>
          )}

          {phase === "check" && (
            loadingQ ? (
              <div style={{ textAlign:"center" }}>
                <Spinner size={24} />
                <div style={{ marginTop:12, fontSize:13, color:C.textMuted }}>Generating question…</div>
              </div>
            ) : question ? (
              <QuestionInline q={question} answered={answered} onAnswer={onAnswer} onSkip={skipCheck} />
            ) : (
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:13, color:C.textMuted, marginBottom:16 }}>Couldn't load question.</div>
                <Btn onClick={skipCheck} style={{ padding:"10px 24px" }}>Skip →</Btn>
              </div>
            )
          )}
        </div>

        {/* Buttons */}
        {phase === "read" && (
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <button onClick={goPrev} disabled={currentIdx === 0} style={{
              padding:"14px", borderRadius:12, background:"var(--surface-high)",
              border:`1px solid ${C.border}`, color:C.textSec,
              cursor: currentIdx === 0 ? "not-allowed" : "pointer",
              opacity: currentIdx === 0 ? 0.4 : 1, fontSize:18, width:56,
            }}>←</button>
            <Btn onClick={handleNext} style={{ flex:1, padding:"14px" }}>
              {isLast ? (completed ? "✓ Done!" : "Finish →") : "Next →"}
            </Btn>
          </div>
        )}
      </div>

      {/* Leave modal */}
      {showLeave && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:24 }}>
          <div style={{ background:C.surface, borderRadius:16, padding:28, width:"100%", maxWidth:360, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:8 }}>Leave this lesson?</div>
            <div style={{ fontSize:13, color:C.textMuted, marginBottom:24 }}>Your progress won't be saved.</div>
            <div style={{ display:"flex", gap:12 }}>
              <Btn onClick={() => { setShowLeave(false); onExit(); }} variant="ghost" style={{ flex:1, padding:"12px" }}>Leave</Btn>
              <Btn onClick={() => setShowLeave(false)} style={{ flex:1, padding:"12px" }}>Continue</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionInline({ q, answered, onAnswer, onSkip }) {
  const hasMC = q.options && Array.isArray(q.options) && q.options.length > 0;
  const [typed, setTyped] = useState("");
  const [selected, setSelected] = useState(null);

  if (answered) {
    return (
      <div>
        <div style={{ padding:"16px", borderRadius:14, background: answered === 'correct' ? "rgba(34,211,160,0.15)" : "rgba(239,68,68,0.15)", border:`1px solid ${answered === 'correct' ? C.green : C.red}`, marginBottom:12 }}>
          <div style={{ fontSize:15, fontWeight:800, color: answered === 'correct' ? C.green : C.red, marginBottom:8 }}>
            {answered === 'correct' ? "✓ Correct! Moving on…" : "✗ Not quite"}
          </div>
          <div style={{ fontSize:14, color:C.text, lineHeight:1.6 }}>{q.answer}</div>
        </div>
        {answered === 'wrong' && (
          <Btn onClick={() => onAnswer(true)} style={{ width:"100%", padding:"12px" }}>Got it, continue →</Btn>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize:12, fontWeight:800, color:C.accent, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>✦ Quick Check</div>
      <div style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:16, lineHeight:1.5 }}>{q.question}</div>

      {hasMC ? (
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correctIndex;
            const isSelected = selected === i;
            return (
              <button key={i} onClick={() => {
                setSelected(i);
                setTimeout(() => onAnswer(isCorrect), 300);
              }} style={{
                padding:"14px 16px", borderRadius:12,
                border:`2px solid ${isSelected ? (isCorrect ? C.green : C.red) : C.border}`,
                background: isSelected ? (isCorrect ? "rgba(34,211,160,0.12)" : "rgba(239,68,68,0.12)") : C.surface,
                color:C.text, fontSize:14, cursor:"pointer", textAlign:"left", transition:"all 0.15s",
              }}>{opt}</button>
            );
          })}
        </div>
      ) : (
        <div style={{ marginBottom:12 }}>
          <textarea value={typed} onChange={e => setTyped(e.target.value)} placeholder="Type your answer…" rows={3}
            style={{ width:"100%", padding:"12px 14px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, color:C.text, fontSize:14, lineHeight:1.6, resize:"none", outline:"none", boxSizing:"border-box" }} />
          <Btn onClick={() => onAnswer(typed.length > 10)} disabled={!typed.trim()} style={{ width:"100%", padding:"12px", marginTop:8 }}>Check →</Btn>
        </div>
      )}

      <button onClick={onSkip} style={{ background:"none", border:"none", color:C.textMuted, fontSize:12, cursor:"pointer", width:"100%", textAlign:"center", padding:"8px" }}>
        Skip question →
      </button>
    </div>
  );
}

// ═══ QUIZ MODE ════════════════════════════════════════════════════════════════
function QuizMode({ lesson, onBack, onExit, onComplete }) {
  const questions = lesson.questions || [];
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState({});

  if (questions.length === 0) {
    return (
      <div style={{ padding:60, textAlign:"center", maxWidth:480, margin:"0 auto" }}>
        <div style={{ fontSize:56, marginBottom:16 }}>📝</div>
        <h2 style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:8 }}>No questions yet</h2>
        <p style={{ fontSize:14, color:C.textSec, marginBottom:24 }}>Quiz questions are being generated for this lesson.</p>
        <Btn onClick={onBack}>Back</Btn>
      </div>
    );
  }

  const q = questions[idx];
  const GRADE_COLORS = { "C":"#f59e0b","B":"#3b82f6","A":"#8b5cf6","A*":"#22d3a0" };
  const gc = GRADE_COLORS[q.grade] || C.accent;

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <div style={{ padding:"14px 16px 10px", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:50, background:C.bg }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, maxWidth:680, margin:"0 auto" }}>
          <button onClick={onExit} style={{ background:"none", border:"none", color:C.textSec, fontSize:22, cursor:"pointer", lineHeight:1, padding:4 }}>×</button>
          <div style={{ flex:1, height:6, background:"var(--surface-high)", borderRadius:100, overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:100, background:`linear-gradient(90deg, ${C.accent}, #a78bfa)`, width:`${((idx + 1) / questions.length) * 100}%`, transition:"width 0.3s" }} />
          </div>
          <span style={{ fontSize:12, color:C.textMuted, minWidth:38, textAlign:"right" }}>{idx + 1}/{questions.length}</span>
        </div>
      </div>
      <div style={{ padding:"24px 16px 80px", maxWidth:680, margin:"0 auto" }}>
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <span style={{ padding:"4px 12px", borderRadius:100, fontSize:11, fontWeight:800, background:`${gc}22`, color:gc, border:`1px solid ${gc}` }}>Grade {q.grade}</span>
          <span style={{ fontSize:12, color:C.textMuted, padding:"4px 0" }}>{q.marks} marks</span>
        </div>
        <div style={{ fontSize:18, fontWeight:600, color:C.text, marginBottom:20, lineHeight:1.5 }}>{q.question}</div>
        {!submitted[q.id] ? (
          <>
            <textarea value={answers[q.id]||""} onChange={e => setAnswers(p => ({...p, [q.id]: e.target.value}))}
              placeholder="Write your answer…" rows={5}
              style={{ width:"100%", padding:"14px 16px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, color:C.text, fontSize:15, lineHeight:1.6, resize:"vertical", outline:"none", boxSizing:"border-box" }} />
            <Btn onClick={() => setSubmitted(p => ({...p, [q.id]: true}))} disabled={!answers[q.id]?.trim()} style={{ width:"100%", padding:"14px", marginTop:12 }}>Reveal answer →</Btn>
          </>
        ) : (
          <div>
            {q.mark_scheme && <div style={{ padding:"14px 16px", borderRadius:12, background:"rgba(34,211,160,0.08)", border:`1px solid rgba(34,211,160,0.2)`, marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:800, color:C.green, marginBottom:6, textTransform:"uppercase" }}>Mark Scheme</div>
              <div style={{ fontSize:14, color:C.text, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{q.mark_scheme}</div>
            </div>}
            {q.model_answer && <div style={{ padding:"14px 16px", borderRadius:12, background:"rgba(99,102,241,0.08)", border:`1px solid var(--accent-glow)`, marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:800, color:C.accent, marginBottom:6, textTransform:"uppercase" }}>Model Answer</div>
              <div style={{ fontSize:14, color:C.text, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{q.model_answer}</div>
            </div>}
            <div style={{ display:"flex", gap:10 }}>
              <Btn variant="ghost" onClick={() => { setSubmitted(p => ({...p, [q.id]: false})); setAnswers(p => ({...p, [q.id]: ""})); }} style={{ flex:1, padding:"12px" }}>Try again</Btn>
              {idx < questions.length - 1
                ? <Btn onClick={() => setIdx(i => i + 1)} style={{ flex:2, padding:"12px" }}>Next question →</Btn>
                : <Btn onClick={() => { onComplete(); onExit(); }} style={{ flex:2, padding:"12px" }}>Finish quiz ✓</Btn>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ BLURT MODE ═══════════════════════════════════════════════════════════════
function BlurtMode({ lesson, onBack, onExit, onComplete }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('ep_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://edupositive-backend.onrender.com'}/api/ai/blurt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ subtopicId: lesson.subtopic_id, userText: text })
      });
      if (res.ok) setResult(await res.json());
    } catch(e) { alert("Couldn't grade your answer"); }
    setSubmitting(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:50, background:C.bg }}>
        <button onClick={onExit} style={{ background:"none", border:"none", color:C.textSec, fontSize:22, cursor:"pointer", lineHeight:1, padding:4 }}>×</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.text }}>🧠 Blurt Mode</div>
          <div style={{ fontSize:11, color:C.textMuted }}>{lesson.title}</div>
        </div>
      </div>
      <div style={{ padding:"24px 16px 80px", maxWidth:680, margin:"0 auto" }}>
        {!result ? (
          <>
            <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:8, fontFamily:"var(--font-serif)" }}>Write everything you know</h2>
            <p style={{ fontSize:13, color:C.textSec, marginBottom:20, lineHeight:1.6 }}>Close the lesson and write everything you can remember. The AI will check what you got right, what you missed, and what was wrong.</p>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Start writing…" rows={14}
              style={{ width:"100%", padding:"16px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, color:C.text, fontSize:15, lineHeight:1.7, resize:"vertical", outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
            <Btn onClick={submit} disabled={!text.trim() || submitting} style={{ width:"100%", padding:"14px", marginTop:12 }}>
              {submitting ? "Marking…" : "Mark my answer →"}
            </Btn>
          </>
        ) : (
          <BlurtResult result={result} onRetry={() => { setResult(null); setText(""); }} onFinish={() => { onComplete(); onExit(); }} />
        )}
      </div>
    </div>
  );
}

function BlurtResult({ result, onRetry, onFinish }) {
  const score = result.score || 0;
  const color = score >= 80 ? C.green : score >= 50 ? C.amber : C.red;
  return (
    <div>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:56, fontWeight:900, color, lineHeight:1 }}>{score}</div>
        <div style={{ fontSize:12, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:4 }}>out of 100</div>
      </div>
      {result.wellRecalled?.length > 0 && <Section title="✓ Well recalled" color={C.green}>{result.wellRecalled.map((p, i) => <li key={i} style={{ fontSize:14, color:C.text, marginBottom:6 }}>{p}</li>)}</Section>}
      {result.missingKeyPoints?.length > 0 && <Section title="✗ Missing" color={C.red}>{result.missingKeyPoints.map((p, i) => <li key={i} style={{ fontSize:14, color:C.text, marginBottom:6 }}>{p}</li>)}</Section>}
      {result.incorrectIdeas?.length > 0 && <Section title="⚠ Incorrect" color={C.amber}>{result.incorrectIdeas.map((p, i) => <li key={i} style={{ fontSize:14, color:C.text, marginBottom:6 }}>{p}</li>)}</Section>}
      {result.knowledgeGapReport && <div style={{ padding:"16px 18px", borderRadius:14, background:"var(--surface-high)", border:`1px solid ${C.border}`, marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:800, color:C.accent, marginBottom:8, textTransform:"uppercase" }}>Summary</div>
        <div style={{ fontSize:14, color:C.text, lineHeight:1.6 }}>{result.knowledgeGapReport}</div>
      </div>}
      <div style={{ display:"flex", gap:10, marginTop:20 }}>
        <Btn variant="ghost" onClick={onRetry} style={{ flex:1, padding:"12px" }}>Try again</Btn>
        <Btn onClick={onFinish} style={{ flex:2, padding:"12px" }}>Done ✓</Btn>
      </div>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ padding:"14px 16px", borderRadius:12, background:`${color}15`, border:`1px solid ${color}44`, marginBottom:10 }}>
      <div style={{ fontSize:12, fontWeight:800, color, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>{title}</div>
      <ul style={{ margin:0, paddingLeft:20 }}>{children}</ul>
    </div>
  );
}

// ═══ MIND MAP MODE ════════════════════════════════════════════════════════════
function MindMapMode({ lesson, onBack, onExit, onComplete }) {
  const [nodes, setNodes] = useState([{ id:'root', text:lesson.title, isRoot:true }]);
  const [connections, setConnections] = useState([]);
  const [newNodeText, setNewNodeText] = useState("");
  const [showAdd, setShowAdd] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const addChild = (parentId) => {
    if (!newNodeText.trim()) return;
    const id = Date.now().toString();
    setNodes(p => [...p, { id, text: newNodeText.trim() }]);
    setConnections(p => [...p, { from: parentId, to: id }]);
    setNewNodeText("");
    setShowAdd(null);
  };

  const removeNode = (id) => {
    if (id === 'root') return;
    setNodes(p => p.filter(n => n.id !== id));
    setConnections(p => p.filter(c => c.from !== id && c.to !== id));
  };

  const submit = async () => {
    setSubmitting(true);
    const mindmapText = nodes.map(n => {
      if (n.isRoot) return `[ROOT] ${n.text}`;
      const parent = connections.find(c => c.to === n.id);
      if (parent) {
        const parentNode = nodes.find(nn => nn.id === parent.from);
        return `${parentNode?.text} → ${n.text}`;
      }
      return n.text;
    }).join('\n');
    try {
      const token = localStorage.getItem('ep_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://edupositive-backend.onrender.com'}/api/ai/mindmap-grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ subtopicId: lesson.subtopic_id, mindmap: mindmapText })
      });
      if (res.ok) setResult(await res.json());
      else setResult({ score: 0, feedback: "Couldn't grade your mind map right now." });
    } catch(e) { setResult({ score: 0, feedback: "Error grading." }); }
    setSubmitting(false);
  };

  if (result) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, padding:"20px 16px 80px" }}>
        <div style={{ maxWidth:680, margin:"0 auto" }}>
          <button onClick={() => setResult(null)} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:16 }}>← Back to map</button>
          <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:16 }}>Mind Map Graded</h2>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ fontSize:56, fontWeight:900, color: result.score >= 70 ? C.green : result.score >= 40 ? C.amber : C.red }}>{result.score}</div>
            <div style={{ fontSize:12, color:C.textMuted, textTransform:"uppercase" }}>out of 100</div>
          </div>
          {result.feedback && <div style={{ padding:"16px 18px", borderRadius:14, background:"var(--surface-high)", border:`1px solid ${C.border}`, marginBottom:12 }}>
            <div style={{ fontSize:14, color:C.text, lineHeight:1.7 }}>{result.feedback}</div>
          </div>}
          {result.missing?.length > 0 && <Section title="✗ Missing connections" color={C.red}>{result.missing.map((m, i) => <li key={i} style={{ fontSize:14, color:C.text, marginBottom:6 }}>{m}</li>)}</Section>}
          {result.incorrect?.length > 0 && <Section title="⚠ Incorrect" color={C.amber}>{result.incorrect.map((m, i) => <li key={i} style={{ fontSize:14, color:C.text, marginBottom:6 }}>{m}</li>)}</Section>}
          <div style={{ display:"flex", gap:10, marginTop:20 }}>
            <Btn variant="ghost" onClick={() => setResult(null)} style={{ flex:1 }}>Keep editing</Btn>
            <Btn onClick={() => { onComplete(); onExit(); }} style={{ flex:2 }}>Done ✓</Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:50, background:C.bg }}>
        <button onClick={onExit} style={{ background:"none", border:"none", color:C.textSec, fontSize:22, cursor:"pointer", lineHeight:1, padding:4 }}>×</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.text }}>🗺️ Mind Map</div>
          <div style={{ fontSize:11, color:C.textMuted }}>Tap + on any node to add branches</div>
        </div>
        <Btn onClick={submit} disabled={nodes.length < 3 || submitting} style={{ padding:"8px 16px", fontSize:13 }}>
          {submitting ? "Grading…" : "Grade ✓"}
        </Btn>
      </div>
      <div style={{ padding:"20px 16px", maxWidth:720, margin:"0 auto" }}>
        <div style={{ fontSize:12, color:C.textSec, marginBottom:16, textAlign:"center" }}>Build a mind map showing what you know.</div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {nodes.map(n => (
            <div key={n.id} style={{ padding:"14px 16px", borderRadius:14, background: n.isRoot ? "var(--accent-soft)" : C.surface, border:`1px solid ${n.isRoot ? C.accent : C.border}`, marginLeft: n.isRoot ? 0 : 24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ flex:1, fontSize:15, fontWeight:n.isRoot ? 800 : 600, color:C.text }}>{n.text}</div>
                <button onClick={() => setShowAdd(n.id)} style={{ padding:"4px 10px", borderRadius:8, background:C.accent, color:"#fff", border:"none", fontSize:12, cursor:"pointer" }}>+ branch</button>
                {!n.isRoot && <button onClick={() => removeNode(n.id)} style={{ padding:"4px 8px", borderRadius:8, background:"transparent", color:C.red, border:`1px solid ${C.red}33`, fontSize:12, cursor:"pointer" }}>×</button>}
              </div>
              {showAdd === n.id && (
                <div style={{ marginTop:10, display:"flex", gap:8 }}>
                  <input autoFocus value={newNodeText} onChange={e => setNewNodeText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addChild(n.id)}
                    placeholder="What's connected to this?"
                    style={{ flex:1, padding:"10px 12px", background:"var(--surface-high)", border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, outline:"none" }} />
                  <Btn onClick={() => addChild(n.id)} style={{ padding:"10px 16px", fontSize:13 }}>Add</Btn>
                </div>
              )}
            </div>
          ))}
        </div>
        {nodes.length === 1 && <p style={{ textAlign:"center", color:C.textMuted, marginTop:24, fontSize:13 }}>Add your first branch by tapping + above</p>}
      </div>
    </div>
  );
}
