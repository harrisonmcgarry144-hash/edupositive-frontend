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
    // Split body into paragraphs
    const paragraphs = body.split(/\n\n+/).filter(p => p.trim().length > 30);
    sections.push({ title, paragraphs });
  }
  return sections;
}

// Generate a question from a paragraph using simple AI-like logic
async function generateQuestion(paragraph, lessonTitle, examBoard) {
  try {
    const res = await fetch('/api/content/paragraph-quiz-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('ep_token')}` },
      body: JSON.stringify({ paragraph, lessonTitle, examBoard })
    });
    if (res.ok) return await res.json();
  } catch(e) {}
  return null;
}

const SECTION_ICONS = { "Introduction":"🔍", "Core Concepts":"💡", "Key Details":"📌", "Worked Examples":"✏️", "Common Exam Mistakes":"⚠️", "Summary":"📝" };
const SECTION_COLORS = {
  "Introduction": { bg:"rgba(99,102,241,0.06)", border:"rgba(99,102,241,0.2)", accent:"#6c63ff" },
  "Core Concepts": { bg:"rgba(34,211,160,0.06)", border:"rgba(34,211,160,0.2)", accent:"#22d3a0" },
  "Key Details": { bg:"rgba(245,158,11,0.06)", border:"rgba(245,158,11,0.2)", accent:"#f59e0b" },
  "Worked Examples": { bg:"rgba(59,130,246,0.06)", border:"rgba(59,130,246,0.2)", accent:"#3b82f6" },
  "Common Exam Mistakes": { bg:"rgba(239,68,68,0.06)", border:"rgba(239,68,68,0.2)", accent:"#ef4444" },
  "Summary": { bg:"rgba(167,139,250,0.06)", border:"rgba(167,139,250,0.2)", accent:"#a78bfa" },
};
const DEFAULT_COLOR = { bg: C?.surface || "#12121a", border:"rgba(255,255,255,0.1)", accent:"#6c63ff" };

export default function SubtopicPage() {
  const router = useRouter();
  const { subtopicId } = router.query;
  const [lessons, setLessons] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subtopicId) return;
    contentApi.lessons(subtopicId).then(setLessons).catch(() => {}).finally(() => setLoading(false));
  }, [subtopicId]);

  const openLesson = async (id) => {
    const lesson = await contentApi.lesson(id).catch(() => null);
    setSelected(lesson);
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;

  if (selected) return (
    <LessonView lesson={selected} onBack={() => setSelected(null)}
      onComplete={() => { setLessons(p => p.map(l => l.id === selected.id ? {...l, completed:true} : l)); setSelected(null); }} />
  );

  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <button onClick={() => router.back()} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:20 }}>← Back</button>
      <h1 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>Lessons</h1>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:24 }}>{lessons.length} lessons available</p>
      {lessons.length === 0 && <p style={{ color:C.textSec, textAlign:"center", padding:40 }}>No lessons yet</p>}
      {lessons.map(l => (
        <div key={l.id} onClick={() => openLesson(l.id)} style={{ padding:"16px 20px", borderRadius:14, background:C.surface, border:`1px solid ${l.completed ? C.green : C.border}`, marginBottom:10, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{l.title}</div>
            {l.summary && <p style={{ fontSize:13, color:C.textSec, lineHeight:1.5 }}>{l.summary}</p>}
          </div>
          {l.completed && <div style={{ width:28, height:28, borderRadius:"50%", background:C.green, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginLeft:12, fontSize:14 }}>✓</div>}
        </div>
      ))}
    </div>
  );
}

function LessonView({ lesson, onBack, onComplete }) {
  const sections = parseSections(lesson.content);
  // Flatten all paragraphs into a sequence of cards
  const allCards = [];
  sections.forEach(sec => {
    sec.paragraphs.forEach((para, pi) => {
      allCards.push({ sectionTitle: sec.title, paragraph: para, isFirst: pi === 0, isLastInSection: pi === sec.paragraphs.length - 1 });
    });
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [unlockedIdx, setUnlockedIdx] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [questions, setQuestions] = useState({}); // cardIdx -> question obj
  const [loadingQ, setLoadingQ] = useState({});
  const [userAnswer, setUserAnswer] = useState({});
  const [answerState, setAnswerState] = useState({}); // correct | wrong | null
  const [showExplanation, setShowExplanation] = useState({});
  const containerRef = useRef(null);

  const total = allCards.length;
  const progress = Math.round(((unlockedIdx) / total) * 100);

  // Load question for current card when it becomes unlocked
  useEffect(() => {
    if (unlockedIdx > 0 && unlockedIdx < total) {
      const prevIdx = unlockedIdx - 1;
      if (!questions[prevIdx] && !loadingQ[prevIdx]) {
        loadQuestion(prevIdx);
      }
    }
  }, [unlockedIdx]);

  const loadQuestion = async (idx) => {
    setLoadingQ(p => ({...p, [idx]: true}));
    try {
      const card = allCards[idx];
      const token = localStorage.getItem('ep_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://edupositive-backend.onrender.com'}/api/content/lessons/${lesson.id}/paragraph-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ paragraph: card.paragraph, paragraphIndex: idx })
      });
      if (res.ok) {
        const q = await res.json();
        setQuestions(p => ({...p, [idx]: q}));
      }
    } catch(e) {}
    setLoadingQ(p => ({...p, [idx]: false}));
  };

  const handleAnswer = (idx, answer) => {
    const q = questions[idx];
    if (!q) { unlockNext(idx); return; }
    setUserAnswer(p => ({...p, [idx]: answer}));
    // Check answer - simple contains check
    const correct = q.answer?.toLowerCase().includes(answer.toLowerCase().slice(0,20)) ||
                    answer.toLowerCase().includes(q.answer?.toLowerCase().slice(0,20) || '');
    setAnswerState(p => ({...p, [idx]: correct ? 'correct' : 'wrong'}));
    if (correct) {
      setTimeout(() => unlockNext(idx), 1200);
    }
  };

  const handleMCAnswer = (idx, chosen, correct) => {
    setUserAnswer(p => ({...p, [idx]: chosen}));
    setAnswerState(p => ({...p, [idx]: correct ? 'correct' : 'wrong'}));
    if (correct) setTimeout(() => unlockNext(idx), 1200);
  };

  const unlockNext = (idx) => {
    const next = idx + 1;
    if (next >= total) {
      setUnlockedIdx(total);
    } else {
      setUnlockedIdx(next + 1);
      setCurrentIdx(next);
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const skipQuestion = (idx) => {
    setShowExplanation(p => ({...p, [idx]: true}));
    unlockNext(idx);
  };

  const handleComplete = async () => {
    try { await contentApi.completeLesson(lesson.id); } catch(e) {}
    setCompleted(true);
    setTimeout(() => onComplete(), 800);
  };

  return (
    <div style={{ maxWidth:680, margin:"0 auto", padding:"0 16px 100px" }} ref={containerRef}>
      {showLeave && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:24 }}>
          <div style={{ background:C.surface, borderRadius:16, padding:28, width:"100%", maxWidth:360, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:8 }}>Leave this lesson?</div>
            <div style={{ fontSize:13, color:C.textMuted, marginBottom:24 }}>You won't get completion credit if you leave early.</div>
            <div style={{ display:"flex", gap:12 }}>
              <Btn onClick={() => { setShowLeave(false); onBack(); }} variant="ghost" style={{ flex:1, padding:"12px" }}>Leave</Btn>
              <Btn onClick={() => setShowLeave(false)} style={{ flex:1, padding:"12px" }}>Continue</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:C.bg, padding:"12px 0 10px", marginBottom:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <button onClick={() => unlockedIdx === 0 ? onBack() : setShowLeave(true)} style={{ background:"none", border:"none", color:C.textSec, fontSize:20, cursor:"pointer", lineHeight:1 }}>×</button>
          <div style={{ flex:1, height:6, background:"var(--surface-high)", borderRadius:100, overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:100, background:`linear-gradient(90deg, ${C.accent}, #a78bfa)`, width:`${progress}%`, transition:"width 0.4s ease" }} />
          </div>
          <span style={{ fontSize:12, color:C.textMuted, minWidth:32 }}>{Math.min(unlockedIdx, total)}/{total}</span>
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{lesson.title}</div>
        <div style={{ fontSize:11, color:C.textMuted }}>{lesson.subject_name} · {lesson.exam_board}</div>
      </div>

      {/* Cards */}
      {allCards.map((card, idx) => {
        const isUnlocked = idx < unlockedIdx;
        const isCurrent = idx === unlockedIdx - 1;
        const isNext = idx === unlockedIdx;
        const q = questions[idx];
        const answered = answerState[idx];
        const sc = SECTION_COLORS[card.sectionTitle] || DEFAULT_COLOR;

        if (!isUnlocked && !isNext) return null; // Don't render far future cards

        return (
          <div key={idx} style={{ marginBottom:20, opacity: isNext && !isUnlocked ? 0.4 : 1, transition:"opacity 0.3s", filter: isNext ? "blur(2px)" : "none", pointerEvents: isNext ? "none" : "auto" }}>

            {/* Section header */}
            {card.isFirst && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, marginTop: idx > 0 ? 24 : 0 }}>
                <span style={{ fontSize:20 }}>{SECTION_ICONS[card.sectionTitle] || "📄"}</span>
                <span style={{ fontSize:16, fontWeight:800, color:C.text }}>{card.sectionTitle}</span>
              </div>
            )}

            {/* Knowledge card */}
            <KnowledgeCard card={card} idx={idx} sc={sc} />

            {/* Question block - shows after card is read */}
            {isUnlocked && idx < total - 1 && (
              <QuestionBlock
                idx={idx}
                q={q}
                loading={loadingQ[idx]}
                userAnswer={userAnswer[idx]}
                answerState={answerState[idx]}
                showExplanation={showExplanation[idx]}
                onAnswer={(ans) => handleAnswer(idx, ans)}
                onMCAnswer={(chosen, correct) => handleMCAnswer(idx, chosen, correct)}
                onSkip={() => skipQuestion(idx)}
              />
            )}
          </div>
        );
      })}

      {/* Complete */}
      {unlockedIdx >= total && (
        <div style={{ padding:"32px 24px", background:"rgba(34,211,160,0.08)", borderRadius:20, textAlign:"center", border:`1px solid rgba(34,211,160,0.3)`, marginTop:16 }}>
          {completed ? (
            <div>
              <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
              <div style={{ fontSize:20, fontWeight:800, color:C.green }}>Lesson complete!</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
              <div style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:8 }}>You've finished!</div>
              <div style={{ fontSize:13, color:C.textSec, marginBottom:20 }}>Mark this lesson as complete to earn XP and track your progress.</div>
              <Btn onClick={handleComplete} style={{ padding:"13px 36px", fontSize:15 }}>Mark Complete →</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KnowledgeCard({ card, idx, sc }) {
  // Alternate between different card styles
  const style = idx % 4;

  if (style === 0) {
    // Standard text card with colored left border
    return (
      <div style={{ borderRadius:16, background:sc.bg, border:`1px solid ${sc.border}`, overflow:"hidden" }}>
        <div style={{ width:4, background:sc.accent, position:"absolute", top:0, bottom:0, left:0, borderRadius:"4px 0 0 4px" }} />
        <div style={{ padding:"20px 20px 20px 24px", position:"relative" }}>
          <p style={{ fontSize:16, color:C.text, lineHeight:1.85, margin:0 }}>{card.paragraph}</p>
        </div>
      </div>
    );
  }

  if (style === 1) {
    // Card with image on side (desktop) or top (mobile)
    return (
      <div style={{ borderRadius:16, background:C.surface, border:`1px solid ${C.border}`, overflow:"hidden" }}>
        <div style={{ width:"100%", height:160, overflow:"hidden", background:"var(--surface-high)" }}>
          <img
            src={`https://source.unsplash.com/800x320/?${encodeURIComponent(card.sectionTitle + ' science biology')}`}
            alt=""
            style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.7 }}
            onError={e => e.target.style.display='none'}
          />
        </div>
        <div style={{ padding:"18px 20px" }}>
          <p style={{ fontSize:16, color:C.text, lineHeight:1.85, margin:0 }}>{card.paragraph}</p>
        </div>
      </div>
    );
  }

  if (style === 2) {
    // Quote/highlight style
    return (
      <div style={{ borderRadius:16, background:"var(--surface-high)", border:`2px solid ${sc.accent}`, padding:"20px 24px", position:"relative" }}>
        <div style={{ fontSize:40, color:sc.accent, opacity:0.3, position:"absolute", top:8, left:16, lineHeight:1, fontFamily:"Georgia" }}>"</div>
        <p style={{ fontSize:16, color:C.text, lineHeight:1.85, margin:0, paddingTop:16 }}>{card.paragraph}</p>
      </div>
    );
  }

  // Style 3: Clean white-ish card with subtle shadow
  return (
    <div style={{ borderRadius:16, background:C.surface, border:`1px solid ${C.border}`, padding:"20px 22px" }}>
      <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
        <div style={{ width:32, height:32, borderRadius:8, background:sc.bg, border:`1px solid ${sc.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
          {idx + 1}
        </div>
        <p style={{ fontSize:16, color:C.text, lineHeight:1.85, margin:0 }}>{card.paragraph}</p>
      </div>
    </div>
  );
}

function QuestionBlock({ idx, q, loading, userAnswer, answerState, showExplanation, onAnswer, onMCAnswer, onSkip }) {
  const [typed, setTyped] = useState("");

  if (loading) return (
    <div style={{ marginTop:12, padding:"16px 18px", borderRadius:14, background:"var(--surface-high)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${C.accent}`, borderTopColor:"transparent", animation:"spin 0.7s linear infinite", flexShrink:0 }} />
      <span style={{ fontSize:13, color:C.textMuted }}>Generating question…</span>
    </div>
  );

  if (!q) return null;

  const hasMC = q.options && Array.isArray(q.options) && q.options.length > 0;

  return (
    <div style={{ marginTop:12, borderRadius:14, background:"rgba(99,102,241,0.05)", border:`1px solid rgba(99,102,241,0.2)`, overflow:"hidden" }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid rgba(99,102,241,0.15)`, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:14 }}>✦</span>
        <span style={{ fontSize:12, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:"0.06em" }}>Quick Check</span>
      </div>

      <div style={{ padding:"14px 16px" }}>
        <div style={{ fontSize:15, fontWeight:600, color:C.text, marginBottom:14, lineHeight:1.5 }}>{q.question}</div>

        {answerState ? (
          <div>
            {/* Result */}
            <div style={{ padding:"12px 14px", borderRadius:10, marginBottom:10, background: answerState === 'correct' ? "rgba(34,211,160,0.1)" : "rgba(239,68,68,0.1)", border:`1px solid ${answerState === 'correct' ? "rgba(34,211,160,0.3)" : "rgba(239,68,68,0.3)"}` }}>
              <div style={{ fontSize:13, fontWeight:700, color: answerState === 'correct' ? C.green : C.red, marginBottom:6 }}>
                {answerState === 'correct' ? "✓ Correct!" : "✗ Not quite"}
              </div>
              <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{q.answer}</div>
            </div>
            {answerState === 'wrong' && (
              <Btn onClick={() => onAnswer(q.answer)} style={{ width:"100%", padding:"10px", fontSize:13 }}>
                Got it, continue →
              </Btn>
            )}
          </div>
        ) : hasMC ? (
          // Multiple choice
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => onMCAnswer(opt, opt === q.correctOption || i === q.correctIndex)} style={{
                padding:"12px 16px", borderRadius:10, border:`1px solid ${C.border}`,
                background:"var(--surface-high)", color:C.text, fontSize:14, cursor:"pointer",
                textAlign:"left", transition:"all 0.15s",
              }}
              onMouseEnter={e => e.target.style.borderColor = C.accent}
              onMouseLeave={e => e.target.style.borderColor = C.border}
              >{opt}</button>
            ))}
            <button onClick={onSkip} style={{ background:"none", border:"none", color:C.textMuted, fontSize:12, cursor:"pointer", marginTop:4, padding:4 }}>Skip →</button>
          </div>
        ) : (
          // Short answer
          <div>
            {q.hint && <div style={{ fontSize:12, color:C.textMuted, marginBottom:8 }}>Hint: {q.hint}</div>}
            <textarea
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder="Type your answer…"
              rows={2}
              style={{ width:"100%", padding:"10px 12px", background:"var(--surface-high)", border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, lineHeight:1.6, resize:"none", outline:"none", boxSizing:"border-box" }}
            />
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <Btn onClick={() => onAnswer(typed)} disabled={!typed.trim()} style={{ flex:1, padding:"10px", fontSize:13 }}>Check →</Btn>
              <button onClick={onSkip} style={{ padding:"10px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:"none", color:C.textMuted, fontSize:12, cursor:"pointer" }}>Skip</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
