import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { contentApi } from "../../lib/api";
import { Btn, C, Spinner } from "../../components/ui";

const API = process.env.NEXT_PUBLIC_API_URL || 'https://edupositive-backend.onrender.com';

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('ep_token');
  const res = await fetch(`${API}${path}`, {
    ...opts, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(opts.headers||{}) }
  });
  return res.ok ? res.json() : Promise.reject(await res.json());
}

// Award XP helper
async function awardXP(action) {
  try {
    await apiFetch('/api/study/xp', { method: 'POST', body: JSON.stringify({ action }) });
  } catch(e) {}
}

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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SubtopicPage() {
  const router = useRouter();
  const { subtopicId } = router.query;
  const [lessons, setLessons] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroMins, setPomodoroMins] = useState(25);
  const [pomodoroSecs, setPomodoroSecs] = useState(0);
  const pomodorRef = useRef(null);

  useEffect(() => {
    if (!subtopicId) return;
    contentApi.lessons(subtopicId).then(setLessons).catch(() => {}).finally(() => setLoading(false));
  }, [subtopicId]);

  useEffect(() => {
    if (pomodoroActive) {
      pomodorRef.current = setInterval(() => {
        setPomodoroSecs(s => {
          if (s > 0) return s - 1;
          setPomodoroMins(m => {
            if (m > 0) return m - 1;
            setPomodoroActive(false);
            clearInterval(pomodorRef.current);
            return 0;
          });
          return 59;
        });
      }, 1000);
    } else {
      clearInterval(pomodorRef.current);
    }
    return () => clearInterval(pomodorRef.current);
  }, [pomodoroActive]);

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
      }}
      subtopicId={subtopicId}
    />
  );

  if (selected) return <LessonModeSelect lesson={selected} onSelect={setMode} onBack={() => setSelected(null)} />;

  const allDone = lessons.length > 0 && lessons.every(l => l.completed);

  return (
    <div style={{ padding:"20px 16px 100px", maxWidth:680, margin:"0 auto" }}>
      {/* Pomodoro */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <button onClick={() => router.back()} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer" }}>← Back</button>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {pomodoroActive && (
            <div style={{ padding:"6px 12px", borderRadius:100, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.3)", fontSize:13, fontWeight:800, color:"#ef4444" }}>
              🍅 {String(pomodoroMins).padStart(2,'0')}:{String(pomodoroSecs).padStart(2,'0')}
            </div>
          )}
          <button onClick={() => { if (pomodoroActive) { setPomodoroActive(false); setPomodoroMins(25); setPomodoroSecs(0); } else { setPomodoroMins(25); setPomodoroSecs(0); setPomodoroActive(true); } }}
            style={{ padding:"6px 12px", borderRadius:100, background: pomodoroActive ? "rgba(239,68,68,0.12)" : "var(--surface-high)", border:`1px solid ${pomodoroActive ? "#ef444444" : C.border}`, fontSize:12, cursor:"pointer", color: pomodoroActive ? "#ef4444" : C.textSec }}>
            {pomodoroActive ? "Stop 🍅" : "🍅 Pomodoro"}
          </button>
        </div>
      </div>

      <h1 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>Lessons</h1>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:8 }}>{lessons.length} lessons available</p>

      {/* Estimated time */}
      {lessons.length > 0 && (
        <div style={{ fontSize:12, color:C.textMuted, marginBottom:24 }}>⏱ ~{lessons.length * 4} minutes to complete</div>
      )}

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

      {/* Boss battle unlock */}
      {allDone && (
        <div onClick={() => { setSelected({ id:'boss', title:'Boss Battle', subtopic_id: subtopicId }); setMode('boss'); }}
          style={{ padding:"20px", borderRadius:16, background:"rgba(239,68,68,0.08)", border:"2px solid rgba(239,68,68,0.4)", marginTop:12, cursor:"pointer", textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>⚔️</div>
          <div style={{ fontSize:16, fontWeight:800, color:"#ef4444" }}>Boss Battle Unlocked!</div>
          <div style={{ fontSize:12, color:C.textSec, marginTop:4 }}>Complete all lessons to unlock — test your mastery</div>
        </div>
      )}
    </div>
  );
}

// ── Mode select ───────────────────────────────────────────────────────────────
function LessonModeSelect({ lesson, onSelect, onBack }) {
  const modes = [
    { id:"lesson", icon:"📖", label:"Learn", desc:"Step-by-step with quick checks", color:"#6c63ff" },
    { id:"recall", icon:"🧠", label:"Active Recall", desc:"Question first — content revealed after", color:"#22d3a0" },
    { id:"rapidfire", icon:"⚡", label:"Rapid Fire", desc:"20 questions as fast as possible", color:"#f59e0b" },
    { id:"blurt", icon:"✍️", label:"Blurt", desc:"Write everything you remember — AI marks it", color:"#3b82f6" },
    { id:"mindmap", icon:"🗺️", label:"Mind Map", desc:"Build a mind map — AI grades connections", color:"#a78bfa" },
    { id:"boss", icon:"⚔️", label:"Boss Battle", desc:"Final challenge — unlocked by completing all", color:"#ef4444" },
  ];
  return (
    <div style={{ padding:"20px 16px 100px", maxWidth:680, margin:"0 auto" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:20 }}>← Back</button>
      <div style={{ fontSize:12, color:C.textMuted, marginBottom:4 }}>{lesson.subject_name} · {lesson.topic_name}</div>
      <h1 style={{ fontSize:26, fontWeight:800, color:C.text, marginBottom:8, fontFamily:"var(--font-serif)", lineHeight:1.2 }}>{lesson.title}</h1>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:24 }}>How would you like to study this?</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
        {modes.map(m => (
          <button key={m.id} onClick={() => onSelect(m.id)} style={{
            padding:"18px 16px", borderRadius:16, background:C.surface, border:`1px solid ${C.border}`,
            textAlign:"left", cursor:"pointer", transition:"all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.background = `${m.color}11`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}>
            <div style={{ width:40, height:40, borderRadius:10, background:`${m.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, marginBottom:10 }}>{m.icon}</div>
            <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:3 }}>{m.label}</div>
            <div style={{ fontSize:11, color:C.textSec, lineHeight:1.4 }}>{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ModeView({ lesson, mode, onBack, onExit, onComplete, subtopicId }) {
  if (mode === "lesson") return <LessonMode lesson={lesson} onBack={onBack} onExit={onExit} onComplete={onComplete} />;
  if (mode === "recall") return <ActiveRecallMode lesson={lesson} onBack={onBack} onExit={onExit} onComplete={onComplete} />;
  if (mode === "rapidfire") return <RapidFireMode lesson={lesson} onExit={onExit} onComplete={onComplete} subtopicId={subtopicId} />;
  if (mode === "blurt") return <BlurtMode lesson={lesson} onBack={onBack} onExit={onExit} onComplete={onComplete} />;
  if (mode === "mindmap") return <MindMapMode lesson={lesson} onBack={onBack} onExit={onExit} onComplete={onComplete} />;
  if (mode === "boss") return <BossBattleMode lesson={lesson} onExit={onExit} onComplete={onComplete} subtopicId={subtopicId} />;
  return null;
}

// ── LEARN MODE ────────────────────────────────────────────────────────────────
function LessonMode({ lesson, onBack, onExit, onComplete }) {
  const sections = parseSections(lesson.content);
  const allCards = [];
  sections.forEach(sec => sec.paragraphs.forEach((para, pi) => allCards.push({ sectionTitle: sec.title, paragraph: para, isFirst: pi === 0 })));

  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState("read");
  const [question, setQuestion] = useState(null);
  const [loadingQ, setLoadingQ] = useState(false);
  const [answered, setAnswered] = useState(null);
  const [blurMode, setBlurMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [mistakes, setMistakes] = useState([]);
  const [showLeave, setShowLeave] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [slideDir, setSlideDir] = useState('none');
  const [confidence, setConfidence] = useState(null);
  const [showHint, setShowHint] = useState(0);
  const touchStart = useRef(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [questionType, setQuestionType] = useState('mcq');

  const total = allCards.length;
  const isLast = currentIdx === total - 1;
  const card = allCards[currentIdx];
  const theme = SECTION_THEMES[card?.sectionTitle] || DEFAULT_THEME;
  const progress = Math.round(((currentIdx + 1) / total) * 100);

  useEffect(() => {
    apiFetch('/api/study/session/start', { method:'POST', body: JSON.stringify({ subtopicId: lesson.subtopic_id, mode:'learn' }) })
      .then(d => setSessionId(d.sessionId)).catch(() => {});
  }, []);

  const QUESTION_TYPES = ['mcq', 'fillblank', 'error_spot'];

  const loadQuestion = async () => {
    setLoadingQ(true);
    setQuestion(null);
    setShowHint(0);
    const type = QUESTION_TYPES[currentIdx % QUESTION_TYPES.length];
    setQuestionType(type);
    try {
      const q = await apiFetch('/api/study/generate-question', {
        method:'POST',
        body: JSON.stringify({ paragraph: card.paragraph, type, difficulty: 'medium' })
      });
      setQuestion(q);
    } catch(e) {
      // Fallback to Groq paragraph quiz
      try {
        const q = await apiFetch(`/api/content/lessons/${lesson.id}/paragraph-quiz`, {
          method:'POST', body: JSON.stringify({ paragraph: card.paragraph })
        });
        setQuestion({ ...q, type: 'mcq' });
      } catch(e2) {}
    }
    setLoadingQ(false);
  };

  const handleNext = () => {
    if (isLast) { handleComplete(); return; }
    setPhase("check");
    setAnswered(null);
    setConfidence(null);
    loadQuestion();
  };

  const advanceCard = () => {
    setSlideDir('left');
    setTimeout(() => {
      setCurrentIdx(i => i + 1);
      setPhase("read");
      setQuestion(null);
      setAnswered(null);
      setConfidence(null);
      setSlideDir('none');
    }, 200);
  };

  const onAnswer = (correct, userAnswer, correctAnswer) => {
    setAnswered(correct ? 'correct' : 'wrong');
    awardXP('question_attempted');
    if (correct) {
      awardXP('question_correct');
      setSessionCorrect(c => c + 1);
      setTimeout(() => advanceCard(), 900);
    } else {
      // Save to mistake bank
      if (question) {
        apiFetch('/api/study/mistakes', { method:'POST', body: JSON.stringify({
          lessonId: lesson.id, subtopicId: lesson.subtopic_id,
          question: question.question, userAnswer, correctAnswer, questionType: question.type || 'mcq'
        }) }).catch(() => {});
      }
    }
  };

  const goPrev = () => {
    if (currentIdx <= 0) return;
    setSlideDir('right');
    setTimeout(() => { setCurrentIdx(i => i - 1); setPhase("read"); setQuestion(null); setAnswered(null); setSlideDir('none'); }, 200);
  };

  const handleComplete = async () => {
    try { await contentApi.completeLesson(lesson.id); } catch(e) {}
    if (sessionId) await apiFetch(`/api/study/session/${sessionId}/end`, { method:'PUT', body: JSON.stringify({ correct: sessionCorrect, total, xpEarned: total * 10 }) }).catch(() => {});
    setCompleted(true);
    // Confetti
    if (typeof window !== 'undefined') {
      const colors = ['#6c63ff','#22d3a0','#f59e0b','#ef4444','#a78bfa'];
      for (let i = 0; i < 30; i++) {
        setTimeout(() => {
          const el = document.createElement('div');
          el.style.cssText = `position:fixed;width:8px;height:8px;border-radius:50%;background:${colors[Math.floor(Math.random()*5)]};left:${Math.random()*100}vw;top:-10px;z-index:9999;pointer-events:none;transition:transform 2s,opacity 2s`;
          document.body.appendChild(el);
          setTimeout(() => { el.style.transform = `translateY(${80+Math.random()*20}vh) rotate(${Math.random()*360}deg)`; el.style.opacity = '0'; }, 50);
          setTimeout(() => el.remove(), 2100);
        }, i * 60);
      }
    }
    setTimeout(() => onComplete(), 1500);
  };

  const toggleBookmark = () => {
    if (bookmarked) { apiFetch(`/api/study/bookmarks/${lesson.id}`, { method:'DELETE' }).catch(() => {}); setBookmarked(false); }
    else { apiFetch('/api/study/bookmarks', { method:'POST', body: JSON.stringify({ lessonId: lesson.id }) }).catch(() => {}); setBookmarked(true); }
  };

  const onTouchStart = e => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = e => {
    if (!touchStart.current) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) > 60 && diff > 0) goPrev();
    touchStart.current = null;
  };

  return (
    <div style={{ minHeight:"100vh", background: focusMode ? "#000" : C.bg, display:"flex", flexDirection:"column" }}>
      {/* Top bar */}
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, background: focusMode ? "#000" : C.bg, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, maxWidth:680, margin:"0 auto" }}>
          <button onClick={() => setShowLeave(true)} style={{ background:"none", border:"none", color:C.textSec, fontSize:22, cursor:"pointer", lineHeight:1, padding:4 }}>×</button>
          <div style={{ flex:1, height:6, background:"var(--surface-high)", borderRadius:100, overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:100, background:`linear-gradient(90deg, ${theme.accent}, ${C.accent})`, width:`${progress}%`, transition:"width 0.3s ease" }} />
          </div>
          <span style={{ fontSize:12, color:C.textMuted }}>{currentIdx + 1}/{total}</span>
          <button onClick={() => setBlurMode(b => !b)} title="Blur mode" style={{ background:"none", border:"none", fontSize:16, cursor:"pointer", opacity: blurMode ? 1 : 0.4 }}>👁</button>
          <button onClick={() => setFocusMode(f => !f)} title="Focus mode" style={{ background:"none", border:"none", fontSize:16, cursor:"pointer", opacity: focusMode ? 1 : 0.4 }}>🎯</button>
          <button onClick={toggleBookmark} style={{ background:"none", border:"none", fontSize:16, cursor:"pointer", opacity: bookmarked ? 1 : 0.4 }}>🔖</button>
        </div>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"20px 16px", maxWidth:680, width:"100%", margin:"0 auto" }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

        {/* Section label */}
        {card?.isFirst && phase === "read" && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <span style={{ fontSize:18 }}>{theme.icon}</span>
            <span style={{ fontSize:11, fontWeight:800, color:theme.accent, textTransform:"uppercase", letterSpacing:"0.08em" }}>{card.sectionTitle}</span>
          </div>
        )}

        {/* Main card */}
        <div style={{
          flex:1, background: phase === "check" ? "var(--surface-high)" : theme.bg, borderRadius:24,
          border:`1px solid ${phase === "check" ? C.accent : theme.accent + "33"}`,
          padding:"28px 24px", display:"flex", flexDirection:"column", justifyContent:"center",
          minHeight:280,
          transform: slideDir === 'left' ? 'translateX(-20px)' : slideDir === 'right' ? 'translateX(20px)' : 'translateX(0)',
          opacity: slideDir === 'none' ? 1 : 0.3,
          transition: 'all 0.2s ease',
        }}>
          {phase === "read" && (
            <p style={{
              fontSize:17, color:C.text, lineHeight:1.85, margin:0, whiteSpace:"pre-wrap",
              filter: blurMode ? "blur(6px)" : "none",
              cursor: blurMode ? "pointer" : "default",
              transition:"filter 0.3s",
              userSelect: blurMode ? "none" : "auto",
            }}
            onMouseEnter={e => blurMode && (e.currentTarget.style.filter = "blur(0)")}
            onMouseLeave={e => blurMode && (e.currentTarget.style.filter = "blur(6px)")}
            onTouchStart={e => blurMode && (e.currentTarget.style.filter = "blur(0)")}
            onTouchEnd={e => blurMode && setTimeout(() => e.currentTarget.style.filter = "blur(6px)", 2000)}
            >{card?.paragraph}</p>
          )}

          {phase === "check" && (
            loadingQ ? (
              <div style={{ textAlign:"center" }}>
                <Spinner size={24} />
                <div style={{ marginTop:12, fontSize:13, color:C.textMuted }}>Generating question…</div>
              </div>
            ) : question ? (
              <QuestionRenderer q={question} answered={answered} onAnswer={onAnswer}
                onSkip={() => advanceCard()} hints={question.hints || []}
                showHint={showHint} onShowHint={() => setShowHint(h => Math.min(h+1, (question.hints||[]).length))} />
            ) : (
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:13, color:C.textMuted, marginBottom:16 }}>Couldn't load question.</div>
                <Btn onClick={() => advanceCard()} style={{ padding:"10px 24px" }}>Continue →</Btn>
              </div>
            )
          )}

          {/* Confidence rating after correct answer */}
          {phase === "check" && answered === 'correct' && !confidence && (
            <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:12, color:C.textMuted, marginBottom:8, textAlign:"center" }}>How confident are you on this topic?</div>
              <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setConfidence(n)} style={{
                    width:36, height:36, borderRadius:8, border:`1px solid ${C.border}`,
                    background:C.surface, fontSize:14, cursor:"pointer", fontWeight:700,
                    color: n <= 2 ? "#ef4444" : n <= 3 ? "#f59e0b" : "#22d3a0",
                  }}>{n}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        {phase === "read" && (
          <div style={{ display:"flex", gap:10, marginTop:14 }}>
            <button onClick={goPrev} disabled={currentIdx === 0} style={{
              padding:"14px", borderRadius:12, background:"var(--surface-high)",
              border:`1px solid ${C.border}`, color:C.textSec,
              cursor: currentIdx === 0 ? "not-allowed" : "pointer",
              opacity: currentIdx === 0 ? 0.4 : 1, fontSize:18, width:52,
            }}>←</button>
            <Btn onClick={handleNext} style={{ flex:1, padding:"14px" }}>
              {isLast ? (completed ? "✓ Done!" : "Finish →") : "Next →"}
            </Btn>
          </div>
        )}
      </div>

      {showLeave && <LeaveModal onLeave={() => { setShowLeave(false); onExit(); }} onStay={() => setShowLeave(false)} />}
    </div>
  );
}

// ── QUESTION RENDERER ─────────────────────────────────────────────────────────
function QuestionRenderer({ q, answered, onAnswer, onSkip, hints, showHint, onShowHint }) {
  const [selected, setSelected] = useState(null);
  const [typed, setTyped] = useState("");
  const [matchState, setMatchState] = useState({});
  const [orderState, setOrderState] = useState(null);

  useEffect(() => {
    if (q.type === 'order' && !orderState) {
      const shuffled = [...(q.steps || [])].sort(() => Math.random() - 0.5);
      setOrderState(shuffled);
    }
  }, [q]);

  if (answered) {
    return (
      <div>
        <div style={{ padding:"14px", borderRadius:14, background: answered === 'correct' ? "rgba(34,211,160,0.12)" : "rgba(239,68,68,0.12)", border:`1px solid ${answered === 'correct' ? C.green : "#ef4444"}`, marginBottom:10 }}>
          <div style={{ fontSize:15, fontWeight:800, color: answered === 'correct' ? C.green : "#ef4444", marginBottom:8 }}>
            {answered === 'correct' ? "✓ Correct! Moving on…" : "✗ Not quite"}
          </div>
          <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{q.explanation || q.answer}</div>
          {answered === 'wrong' && q.wrongExplanations && selected !== null && q.wrongExplanations[selected] && (
            <div style={{ fontSize:12, color:C.textMuted, marginTop:8 }}>Why that was wrong: {q.wrongExplanations[selected]}</div>
          )}
        </div>
        {answered === 'wrong' && <Btn onClick={() => onAnswer(true)} style={{ width:"100%", padding:"12px" }}>Got it, continue →</Btn>}
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize:11, fontWeight:800, color:C.accent, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
        {q.type === 'fillblank' ? '✦ Fill in the blank' : q.type === 'match' ? '✦ Match the pairs' : q.type === 'order' ? '✦ Put in order' : q.type === 'error_spot' ? '✦ Spot the error' : '✦ Quick Check'}
      </div>
      <div style={{ fontSize:15, fontWeight:600, color:C.text, marginBottom:14, lineHeight:1.5 }}>{q.question}</div>

      {/* Progressive hints */}
      {hints.length > 0 && (
        <div style={{ marginBottom:10 }}>
          {[...Array(showHint)].map((_, i) => (
            <div key={i} style={{ padding:"8px 12px", borderRadius:8, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", fontSize:12, color:"#f59e0b", marginBottom:4 }}>
              💡 Hint {i+1}: {hints[i]}
            </div>
          ))}
          {showHint < hints.length && (
            <button onClick={onShowHint} style={{ background:"none", border:"none", color:"#f59e0b", fontSize:12, cursor:"pointer", padding:"4px 0" }}>
              💡 Show hint ({showHint}/{hints.length})
            </button>
          )}
        </div>
      )}

      {/* MCQ */}
      {(!q.type || q.type === 'mcq') && q.options && (
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:10 }}>
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => { setSelected(i); setTimeout(() => onAnswer(i === q.correctIndex, opt, q.options[q.correctIndex]), 300); }} style={{
              padding:"13px 16px", borderRadius:12, border:`2px solid ${selected === i ? (i === q.correctIndex ? C.green : "#ef4444") : C.border}`,
              background: selected === i ? (i === q.correctIndex ? "rgba(34,211,160,0.1)" : "rgba(239,68,68,0.1)") : C.surface,
              color:C.text, fontSize:14, cursor:"pointer", textAlign:"left", transition:"all 0.15s",
            }}>{opt}</button>
          ))}
        </div>
      )}

      {/* Fill in the blank */}
      {q.type === 'fillblank' && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:15, color:C.text, marginBottom:10, lineHeight:1.7, padding:"12px 16px", background:"var(--surface-high)", borderRadius:10 }}>
            {(q.sentence||'').split('___').map((part, i, arr) => (
              <span key={i}>{part}{i < arr.length-1 && <strong style={{ color:C.accent, borderBottom:`2px solid ${C.accent}`, padding:"0 8px", minWidth:80, display:"inline-block", textAlign:"center" }}>{typed || '___'}</strong>}</span>
            ))}
          </div>
          <input value={typed} onChange={e => setTyped(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && typed.trim() && onAnswer(typed.toLowerCase().trim() === q.answer.toLowerCase().trim(), typed, q.answer)}
            placeholder="Type the missing word…" autoFocus
            style={{ width:"100%", padding:"12px 14px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:8 }} />
          <Btn onClick={() => onAnswer(typed.toLowerCase().trim() === q.answer.toLowerCase().trim(), typed, q.answer)} disabled={!typed.trim()} style={{ width:"100%", padding:"11px" }}>Check →</Btn>
        </div>
      )}

      {/* Error spot */}
      {q.type === 'error_spot' && (
        <div style={{ marginBottom:10 }}>
          <div style={{ padding:"12px 16px", borderRadius:10, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", marginBottom:10, fontSize:14, color:C.text, fontStyle:"italic" }}>
            "{q.wrongStatement}"
          </div>
          <textarea value={typed} onChange={e => setTyped(e.target.value)} placeholder="Explain what's wrong and what the correct information is…" rows={3}
            style={{ width:"100%", padding:"12px 14px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, outline:"none", resize:"none", boxSizing:"border-box", marginBottom:8 }} />
          <Btn onClick={() => onAnswer(typed.length > 15, typed, q.answer)} disabled={!typed.trim()} style={{ width:"100%", padding:"11px" }}>Submit →</Btn>
        </div>
      )}

      <button onClick={onSkip} style={{ background:"none", border:"none", color:C.textMuted, fontSize:12, cursor:"pointer", width:"100%", textAlign:"center", padding:"8px" }}>Skip →</button>
    </div>
  );
}

// ── ACTIVE RECALL MODE ────────────────────────────────────────────────────────
function ActiveRecallMode({ lesson, onBack, onExit, onComplete }) {
  const sections = parseSections(lesson.content);
  const allCards = [];
  sections.forEach(sec => sec.paragraphs.forEach((para, pi) => allCards.push({ sectionTitle: sec.title, paragraph: para })));

  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showLeave, setShowLeave] = useState(false);

  const card = allCards[idx];
  const theme = SECTION_THEMES[card?.sectionTitle] || DEFAULT_THEME;
  const total = allCards.length;

  const submit = () => setSubmitted(true);
  const next = () => { setIdx(i => i + 1); setRevealed(false); setTyped(""); setSubmitted(false); };

  if (idx >= total) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🧠</div>
        <h2 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:8 }}>Active recall complete!</h2>
        <p style={{ fontSize:14, color:C.textSec, marginBottom:24 }}>You tested yourself on all {total} paragraphs</p>
        <Btn onClick={() => { onComplete(); onExit(); }} style={{ padding:"14px 32px" }}>Done ✓</Btn>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10, position:"sticky", top:0, background:C.bg, zIndex:50 }}>
        <button onClick={() => setShowLeave(true)} style={{ background:"none", border:"none", color:C.textSec, fontSize:22, cursor:"pointer" }}>×</button>
        <div style={{ flex:1, height:6, background:"var(--surface-high)", borderRadius:100, overflow:"hidden" }}>
          <div style={{ height:"100%", background:`linear-gradient(90deg, #22d3a0, #6c63ff)`, width:`${((idx)/total)*100}%` }} />
        </div>
        <span style={{ fontSize:12, color:C.textMuted }}>{idx+1}/{total}</span>
      </div>

      <div style={{ flex:1, padding:"24px 16px 80px", maxWidth:680, margin:"0 auto", width:"100%" }}>
        <div style={{ padding:"20px", borderRadius:16, background:"rgba(34,211,160,0.06)", border:"1px solid rgba(34,211,160,0.2)", marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:800, color:C.green, textTransform:"uppercase", marginBottom:6 }}>🧠 Recall challenge</div>
          <div style={{ fontSize:14, color:C.text, lineHeight:1.6 }}>Read the section title, then try to recall the content before it's revealed.</div>
        </div>

        <div style={{ fontSize:16, fontWeight:700, color:theme.accent, marginBottom:16 }}>{theme.icon} {card.sectionTitle}</div>

        {!revealed ? (
          <>
            <textarea value={typed} onChange={e => setTyped(e.target.value)} placeholder="What do you remember about this section? Write everything you can recall…" rows={5}
              style={{ width:"100%", padding:"14px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, color:C.text, fontSize:14, lineHeight:1.6, resize:"vertical", outline:"none", boxSizing:"border-box", marginBottom:12 }} />
            <Btn onClick={() => setRevealed(true)} style={{ width:"100%", padding:"13px" }}>
              {typed.length > 10 ? "Reveal content →" : "Skip & reveal →"}
            </Btn>
          </>
        ) : (
          <>
            {typed.length > 10 && (
              <div style={{ padding:"14px", borderRadius:12, background:"rgba(99,102,241,0.08)", border:"1px solid var(--accent-glow)", marginBottom:12 }}>
                <div style={{ fontSize:11, color:C.accent, fontWeight:800, marginBottom:6 }}>YOUR RECALL</div>
                <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{typed}</div>
              </div>
            )}
            <div style={{ padding:"14px", borderRadius:12, background:theme.bg, border:`1px solid ${theme.accent}33`, marginBottom:16 }}>
              <div style={{ fontSize:11, color:theme.accent, fontWeight:800, marginBottom:6 }}>ACTUAL CONTENT</div>
              <div style={{ fontSize:14, color:C.text, lineHeight:1.7 }}>{card.paragraph}</div>
            </div>
            <Btn onClick={next} style={{ width:"100%", padding:"13px" }}>
              {idx >= total - 1 ? "Finish ✓" : "Next section →"}
            </Btn>
          </>
        )}
      </div>
      {showLeave && <LeaveModal onLeave={() => { setShowLeave(false); onExit(); }} onStay={() => setShowLeave(false)} />}
    </div>
  );
}

// ── RAPID FIRE MODE ────────────────────────────────────────────────────────────
function RapidFireMode({ lesson, onExit, onComplete, subtopicId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(15);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    apiFetch('/api/study/boss-battle/' + subtopicId, { method:'POST' })
      .then(d => { setQuestions(d.questions.filter(q => q.type === 'mcq').slice(0, 10)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && questions.length > 0 && !done) {
      setTimer(15);
      timerRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) { handleTimeout(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [idx, loading]);

  const handleTimeout = () => {
    clearInterval(timerRef.current);
    if (!answered) { setAnswered(true); setTimeout(() => advance(false), 800); }
  };

  const handleAnswer = (i) => {
    if (answered) return;
    clearInterval(timerRef.current);
    setSelected(i);
    setAnswered(true);
    const correct = i === questions[idx]?.correctIndex;
    if (correct) setScore(s => s + 1);
    setTimeout(() => advance(correct), 600);
  };

  const advance = (correct) => {
    if (idx >= questions.length - 1) {
      awardXP('rapidfire_completed');
      const pct = Math.round((score / questions.length) * 100);
      if (pct >= 70) awardXP('rapidfire_score_70');
      setDone(true); return;
    }
    setIdx(i => i + 1);
    setSelected(null);
    setAnswered(false);
    setTimer(15);
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner /></div>;

  if (done || questions.length === 0) {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
        <div style={{ fontSize:64, marginBottom:12 }}>⚡</div>
        <h2 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:4 }}>Rapid Fire Done!</h2>
        <div style={{ fontSize:48, fontWeight:900, color: pct >= 70 ? C.green : pct >= 40 ? "#f59e0b" : "#ef4444", marginBottom:4 }}>{pct}%</div>
        <div style={{ fontSize:14, color:C.textSec, marginBottom:24 }}>{score}/{questions.length} correct</div>
        <Btn onClick={onExit} style={{ padding:"14px 32px" }}>Done ✓</Btn>
      </div>
    );
  }

  const q = questions[idx];
  const urgentColor = timer <= 5 ? "#ef4444" : timer <= 10 ? "#f59e0b" : C.green;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10, position:"sticky", top:0, background:C.bg, zIndex:50 }}>
        <button onClick={onExit} style={{ background:"none", border:"none", color:C.textSec, fontSize:22, cursor:"pointer" }}>×</button>
        <div style={{ flex:1, height:6, background:"var(--surface-high)", borderRadius:100, overflow:"hidden" }}>
          <div style={{ height:"100%", background:`linear-gradient(90deg, ${C.accent}, #a78bfa)`, width:`${((idx)/questions.length)*100}%` }} />
        </div>
        <div style={{ padding:"4px 12px", borderRadius:100, background:`${urgentColor}22`, border:`1px solid ${urgentColor}44`, fontSize:14, fontWeight:900, color:urgentColor, minWidth:50, textAlign:"center" }}>
          {timer}s
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:C.accent }}>{score} pts</div>
      </div>

      <div style={{ padding:"24px 16px 80px", maxWidth:640, margin:"0 auto", width:"100%" }}>
        <div style={{ fontSize:11, color:C.textMuted, marginBottom:8 }}>Question {idx+1} of {questions.length}</div>
        <div style={{ fontSize:17, fontWeight:700, color:C.text, marginBottom:20, lineHeight:1.5 }}>{q?.question}</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {(q?.options||[]).map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(i)} disabled={answered} style={{
              padding:"14px 16px", borderRadius:12,
              border:`2px solid ${answered && i === q.correctIndex ? C.green : answered && selected === i && i !== q.correctIndex ? "#ef4444" : C.border}`,
              background: answered && i === q.correctIndex ? "rgba(34,211,160,0.12)" : answered && selected === i ? "rgba(239,68,68,0.1)" : C.surface,
              color:C.text, fontSize:14, cursor: answered ? "default" : "pointer", textAlign:"left", transition:"all 0.15s",
            }}>{opt}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── BOSS BATTLE MODE ──────────────────────────────────────────────────────────
function BossBattleMode({ lesson, onExit, onComplete, subtopicId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    apiFetch('/api/study/boss-battle/' + subtopicId, { method:'POST' })
      .then(d => { setQuestions(d.questions); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>⚔️</div>
      <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:8 }}>Preparing boss battle…</div>
      <Spinner />
    </div>
  );

  if (done || questions.length === 0) {
    const total = questions.reduce((sum, q) => sum + (q.marks||1), 0);
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
        <div style={{ fontSize:64, marginBottom:12 }}>{pct >= 70 ? "🏆" : pct >= 40 ? "⚔️" : "💀"}</div>
        <h2 style={{ fontSize:26, fontWeight:800, color:C.text, marginBottom:4 }}>{pct >= 70 ? "Boss defeated!" : pct >= 40 ? "Good fight!" : "Defeated…"}</h2>
        <div style={{ fontSize:48, fontWeight:900, color: pct >= 70 ? C.green : pct >= 40 ? "#f59e0b" : "#ef4444", marginBottom:4 }}>{pct}%</div>
        <div style={{ fontSize:14, color:C.textSec, marginBottom:24 }}>{score}/{total} marks</div>
        <Btn onClick={onExit} style={{ padding:"14px 32px" }}>Done ✓</Btn>
      </div>
    );
  }

  const q = questions[idx];
  const isSubmitted = !!submitted[idx];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid rgba(239,68,68,0.3)`, background:"rgba(239,68,68,0.04)", position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onExit} style={{ background:"none", border:"none", color:C.textSec, fontSize:22, cursor:"pointer" }}>×</button>
        <div style={{ flex:1, height:6, background:"var(--surface-high)", borderRadius:100, overflow:"hidden" }}>
          <div style={{ height:"100%", background:"linear-gradient(90deg, #ef4444, #f97316)", width:`${((idx)/questions.length)*100}%` }} />
        </div>
        <span style={{ fontSize:12, color:C.textMuted }}>{idx+1}/{questions.length}</span>
        <span style={{ fontSize:13, fontWeight:700, color:"#ef4444" }}>⚔️ {score} pts</span>
      </div>

      <div style={{ padding:"24px 16px 80px", maxWidth:680, margin:"0 auto", width:"100%" }}>
        <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
          <span style={{ padding:"4px 10px", borderRadius:100, fontSize:11, fontWeight:700, background:"rgba(239,68,68,0.1)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.3)" }}>
            {q.difficulty || 'medium'}
          </span>
          <span style={{ padding:"4px 10px", borderRadius:100, fontSize:11, fontWeight:700, background:"var(--surface-high)", color:C.textSec }}>
            {q.marks || 1} mark{q.marks !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ fontSize:17, fontWeight:600, color:C.text, marginBottom:20, lineHeight:1.5 }}>{q.question}</div>

        {q.wrongStatement && (
          <div style={{ padding:"12px 14px", borderRadius:10, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", marginBottom:14, fontSize:14, color:C.text, fontStyle:"italic" }}>
            "{q.wrongStatement}"
          </div>
        )}

        {!isSubmitted ? (
          <>
            {q.type === 'mcq' && q.options ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                {q.options.map((opt, i) => (
                  <button key={i} onClick={() => {
                    const correct = i === q.correctIndex;
                    setSubmitted(p => ({...p, [idx]: { correct, chosen: i }}));
                    if (correct) setScore(s => s + (q.marks||1));
                  }} style={{
                    padding:"14px 16px", borderRadius:12, border:`1px solid ${C.border}`,
                    background:C.surface, color:C.text, fontSize:14, cursor:"pointer", textAlign:"left",
                  }}>{opt}</button>
                ))}
              </div>
            ) : (
              <>
                <textarea value={typed} onChange={e => setTyped(e.target.value)} placeholder="Write your answer…" rows={4}
                  style={{ width:"100%", padding:"14px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, color:C.text, fontSize:14, lineHeight:1.6, resize:"vertical", outline:"none", boxSizing:"border-box", marginBottom:12 }} />
                <Btn onClick={() => {
                  setSubmitted(p => ({...p, [idx]: { correct: typed.length > 20, typed }}));
                  if (typed.length > 20) setScore(s => s + Math.floor((q.marks||1)/2));
                }} disabled={!typed.trim()} style={{ width:"100%", padding:"13px" }}>Submit answer →</Btn>
              </>
            )}
          </>
        ) : (
          <div>
            {submitted[idx].correct !== undefined && (
              <div style={{ padding:"12px 14px", borderRadius:10, background: submitted[idx].correct ? "rgba(34,211,160,0.1)" : "rgba(239,68,68,0.1)", border:`1px solid ${submitted[idx].correct ? C.green : "#ef4444"}`, marginBottom:10 }}>
                <div style={{ fontSize:13, fontWeight:800, color: submitted[idx].correct ? C.green : "#ef4444", marginBottom:6 }}>
                  {submitted[idx].correct ? "✓ Correct!" : "✗ Incorrect"}
                </div>
                <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{q.explanation || q.answer}</div>
              </div>
            )}
            <Btn onClick={() => {
              if (idx >= questions.length - 1) setDone(true);
              else { setIdx(i => i + 1); setTyped(""); }
            }} style={{ width:"100%", padding:"13px" }}>
              {idx >= questions.length - 1 ? "See results →" : "Next question →"}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── BLURT MODE ────────────────────────────────────────────────────────────────
function BlurtMode({ lesson, onBack, onExit, onComplete }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const submit = async () => {
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/ai/blurt', { method:'POST', body: JSON.stringify({ subtopicId: lesson.subtopic_id, userText: text }) });
      setResult(res);
      await awardXP('blurt_submitted');
      if (res.score >= 95) await awardXP('blurt_perfect');
      else if (res.score >= 80) await awardXP('blurt_score_80');
      else if (res.score >= 50) await awardXP('blurt_score_50');
    } catch(e) { alert("Couldn't grade your answer"); }
    setSubmitting(false);
  };

  const mins = Math.floor(timer / 60);
  const secs = timer % 60;

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10, position:"sticky", top:0, zIndex:50, background:C.bg }}>
        <button onClick={onExit} style={{ background:"none", border:"none", color:C.textSec, fontSize:22, cursor:"pointer" }}>×</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.text }}>✍️ Blurt Mode</div>
          <div style={{ fontSize:11, color:C.textMuted }}>{lesson.title}</div>
        </div>
        <div style={{ fontSize:12, color:C.textMuted }}>{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</div>
      </div>

      <div style={{ padding:"24px 16px 80px", maxWidth:680, margin:"0 auto" }}>
        {!result ? (
          <>
            <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:8, fontFamily:"var(--font-serif)" }}>Write everything you know</h2>
            <p style={{ fontSize:13, color:C.textSec, marginBottom:20, lineHeight:1.6 }}>Don't look at the lesson. Write every fact, concept, and detail you can recall. The AI will identify what you got right, missed, or got wrong.</p>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Start writing…" rows={14}
              style={{ width:"100%", padding:"16px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, color:C.text, fontSize:15, lineHeight:1.7, resize:"vertical", outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
            <div style={{ fontSize:12, color:C.textMuted, marginTop:6, marginBottom:12 }}>{text.split(/\s+/).filter(Boolean).length} words</div>
            <Btn onClick={submit} disabled={!text.trim() || submitting} style={{ width:"100%", padding:"14px" }}>
              {submitting ? "Marking…" : "Mark my answer →"}
            </Btn>
          </>
        ) : (
          <BlurtResult result={result} timeSeconds={timer} onRetry={() => { setResult(null); setText(""); setTimer(0); timerRef.current = setInterval(() => setTimer(t => t+1), 1000); }} onFinish={() => { onComplete(); onExit(); }} />
        )}
      </div>
    </div>
  );
}

function BlurtResult({ result, timeSeconds, onRetry, onFinish }) {
  const score = result.score || 0;
  const color = score >= 80 ? C.green : score >= 50 ? "#f59e0b" : "#ef4444";
  const mins = Math.floor(timeSeconds / 60);
  const secs = timeSeconds % 60;
  return (
    <div>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:60, fontWeight:900, color, lineHeight:1 }}>{score}</div>
        <div style={{ fontSize:12, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:4 }}>out of 100</div>
        <div style={{ fontSize:12, color:C.textMuted, marginTop:4 }}>⏱ {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</div>
      </div>
      {result.wellRecalled?.length > 0 && <ResultSection title="✓ Well recalled" color={C.green}>{result.wellRecalled.map((p,i) => <li key={i} style={{ fontSize:13, color:C.text, marginBottom:5 }}>{p}</li>)}</ResultSection>}
      {result.missingKeyPoints?.length > 0 && <ResultSection title="✗ Missing" color="#ef4444">{result.missingKeyPoints.map((p,i) => <li key={i} style={{ fontSize:13, color:C.text, marginBottom:5 }}>{p}</li>)}</ResultSection>}
      {result.incorrectIdeas?.length > 0 && <ResultSection title="⚠ Incorrect" color="#f59e0b">{result.incorrectIdeas.map((p,i) => <li key={i} style={{ fontSize:13, color:C.text, marginBottom:5 }}>{p}</li>)}</ResultSection>}
      {result.knowledgeGapReport && <div style={{ padding:"14px 16px", borderRadius:12, background:"var(--surface-high)", border:`1px solid ${C.border}`, marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:800, color:C.accent, marginBottom:6, textTransform:"uppercase" }}>Summary</div>
        <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{result.knowledgeGapReport}</div>
      </div>}
      <div style={{ display:"flex", gap:10, marginTop:16 }}>
        <Btn variant="ghost" onClick={onRetry} style={{ flex:1, padding:"12px" }}>Try again</Btn>
        <Btn onClick={onFinish} style={{ flex:2, padding:"12px" }}>Done ✓</Btn>
      </div>
    </div>
  );
}

function ResultSection({ title, color, children }) {
  return (
    <div style={{ padding:"12px 14px", borderRadius:12, background:`${color}15`, border:`1px solid ${color}44`, marginBottom:10 }}>
      <div style={{ fontSize:11, fontWeight:800, color, marginBottom:6, textTransform:"uppercase" }}>{title}</div>
      <ul style={{ margin:0, paddingLeft:18 }}>{children}</ul>
    </div>
  );
}

// ── MIND MAP MODE ─────────────────────────────────────────────────────────────
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
    setNewNodeText(""); setShowAdd(null);
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
      if (parent) { const pn = nodes.find(nn => nn.id === parent.from); return `${pn?.text} → ${n.text}`; }
      return n.text;
    }).join('\n');
    try {
      const res = await apiFetch('/api/ai/mindmap-grade', { method:'POST', body: JSON.stringify({ subtopicId: lesson.subtopic_id, mindmap: mindmapText }) });
      setResult(res);
    } catch(e) { setResult({ score: 0, feedback: "Couldn't grade your mind map right now." }); }
    setSubmitting(false);
  };

  if (result) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, padding:"20px 16px 80px" }}>
        <div style={{ maxWidth:680, margin:"0 auto" }}>
          <button onClick={() => setResult(null)} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:14 }}>← Back to map</button>
          <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:16 }}>Mind Map Graded</h2>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:56, fontWeight:900, color: result.score >= 70 ? C.green : result.score >= 40 ? "#f59e0b" : "#ef4444" }}>{result.score}</div>
            <div style={{ fontSize:12, color:C.textMuted, textTransform:"uppercase" }}>out of 100</div>
          </div>
          {result.feedback && <div style={{ padding:"14px 16px", borderRadius:12, background:"var(--surface-high)", border:`1px solid ${C.border}`, marginBottom:10 }}>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.7 }}>{result.feedback}</div>
          </div>}
          {result.missing?.length > 0 && <ResultSection title="✗ Missing connections" color="#ef4444">{result.missing.map((m,i) => <li key={i} style={{ fontSize:13, color:C.text, marginBottom:5 }}>{m}</li>)}</ResultSection>}
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <Btn variant="ghost" onClick={() => setResult(null)} style={{ flex:1 }}>Keep editing</Btn>
            <Btn onClick={() => { onComplete(); onExit(); }} style={{ flex:2 }}>Done ✓</Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10, position:"sticky", top:0, zIndex:50, background:C.bg }}>
        <button onClick={onExit} style={{ background:"none", border:"none", color:C.textSec, fontSize:22, cursor:"pointer" }}>×</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.text }}>🗺️ Mind Map</div>
          <div style={{ fontSize:11, color:C.textMuted }}>{nodes.length - 1} branches</div>
        </div>
        <Btn onClick={submit} disabled={nodes.length < 3 || submitting} style={{ padding:"8px 16px", fontSize:13 }}>
          {submitting ? "Grading…" : "Grade ✓"}
        </Btn>
      </div>
      <div style={{ padding:"16px 16px", maxWidth:720, margin:"0 auto" }}>
        {nodes.map(n => (
          <div key={n.id} style={{ padding:"12px 14px", borderRadius:12, background: n.isRoot ? "var(--accent-soft)" : C.surface, border:`1px solid ${n.isRoot ? C.accent : C.border}`, marginLeft: n.isRoot ? 0 : 24, marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ flex:1, fontSize:14, fontWeight:n.isRoot ? 800 : 600, color:C.text }}>{n.text}</div>
              <button onClick={() => setShowAdd(showAdd === n.id ? null : n.id)} style={{ padding:"4px 10px", borderRadius:8, background:C.accent, color:"#fff", border:"none", fontSize:12, cursor:"pointer" }}>+ branch</button>
              {!n.isRoot && <button onClick={() => removeNode(n.id)} style={{ padding:"4px 8px", borderRadius:8, background:"transparent", color:"#ef4444", border:"1px solid rgba(239,68,68,0.3)", fontSize:12, cursor:"pointer" }}>×</button>}
            </div>
            {showAdd === n.id && (
              <div style={{ marginTop:8, display:"flex", gap:8 }}>
                <input autoFocus value={newNodeText} onChange={e => setNewNodeText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChild(n.id)}
                  placeholder="What's connected?"
                  style={{ flex:1, padding:"9px 12px", background:"var(--surface-high)", border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:13, outline:"none" }} />
                <Btn onClick={() => addChild(n.id)} style={{ padding:"9px 14px", fontSize:13 }}>Add</Btn>
              </div>
            )}
          </div>
        ))}
        {nodes.length === 1 && <p style={{ textAlign:"center", color:C.textMuted, marginTop:20, fontSize:13 }}>Add your first branch by tapping + above</p>}
      </div>
    </div>
  );
}

// ── SHARED UTILS ──────────────────────────────────────────────────────────────
function LeaveModal({ onLeave, onStay }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:24 }}>
      <div style={{ background:C.surface, borderRadius:16, padding:28, width:"100%", maxWidth:360, border:`1px solid ${C.border}` }}>
        <div style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:8 }}>Leave this lesson?</div>
        <div style={{ fontSize:13, color:C.textMuted, marginBottom:24 }}>Your progress in this session won't be saved.</div>
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={onLeave} variant="ghost" style={{ flex:1, padding:"12px" }}>Leave</Btn>
          <Btn onClick={onStay} style={{ flex:1, padding:"12px" }}>Continue</Btn>
        </div>
      </div>
    </div>
  );
}
