import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { contentApi } from "../../lib/api";
import { Card, Tag, Btn, C, Spinner } from "../../components/ui";
import Link from "next/link";

// Parse lesson markdown into structured sections
function parseSections(content) {
  if (!content) return [];
  const sections = [];
  const parts = content.split(/^##\s+/m);
  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split('\n');
    const title = lines[0].trim();
    const body = lines.slice(1).join('\n').trim();
    if (title && body) sections.push({ title, body });
  }
  return sections.length > 0 ? sections : [{ title: "Lesson", body: content }];
}

// Get a free image from Unsplash based on search term
function getImageUrl(query) {
  const encoded = encodeURIComponent(query);
  return `https://source.unsplash.com/800x400/?${encoded}`;
}

// Highlight purple key terms in text - wrapped in clickable spans
function HighlightedText({ text, keyTerms = [], onTermClick }) {
  if (!keyTerms.length) return <span>{text}</span>;
  
  const parts = [];
  let remaining = text;
  let i = 0;
  
  // Simple approach: find any word that looks like a key term
  const words = text.split(/(\s+)/);
  
  return (
    <span>
      {words.map((word, idx) => {
        const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
        const isKey = keyTerms.some(t => t.toLowerCase().includes(clean) || clean.includes(t.toLowerCase().replace(/[^a-z]/g,'')));
        if (isKey && clean.length > 3) {
          return (
            <span key={idx} onClick={() => onTermClick && onTermClick(word.trim())} style={{
              color: '#a78bfa', fontWeight: 600, cursor: 'pointer',
              borderBottom: '1px dotted #a78bfa', textDecoration: 'none',
            }}>{word}</span>
          );
        }
        return <span key={idx}>{word}</span>;
      })}
    </span>
  );
}

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
    <LessonView
      lesson={selected}
      onBack={() => setSelected(null)}
      onComplete={() => {
        setLessons(p => p.map(l => l.id === selected.id ? {...l, completed: true} : l));
        setSelected(null);
      }}
    />
  );

  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <button onClick={() => router.back()} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:20 }}>← Back</button>
      <h1 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>Lessons</h1>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:24 }}>{lessons.length} lessons available</p>
      {lessons.length === 0 && <p style={{ color:C.textSec, textAlign:"center", padding:40 }}>No lessons yet — check back soon!</p>}
      {lessons.map(l => (
        <div key={l.id} onClick={() => openLesson(l.id)} style={{
          padding:"16px 20px", borderRadius:14,
          background:C.surface, border:`1px solid ${l.completed ? C.green : C.border}`,
          marginBottom:10, cursor:"pointer",
          display:"flex", justifyContent:"space-between", alignItems:"center",
        }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:6 }}>{l.title}</div>
            {l.summary && <p style={{ fontSize:13, color:C.textSec, lineHeight:1.5 }}>{l.summary}</p>}
          </div>
          {l.completed && (
            <div style={{ width:28, height:28, borderRadius:"50%", background:C.green, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginLeft:12, fontSize:14 }}>✓</div>
          )}
        </div>
      ))}
    </div>
  );
}

function LessonView({ lesson, onBack, onComplete }) {
  const [completed, setCompleted] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [tab, setTab] = useState("lesson");
  const [activeTerm, setActiveTerm] = useState(null);
  const [termDef, setTermDef] = useState(null);
  const [loadingTerm, setLoadingTerm] = useState(false);
  const [showMark, setShowMark] = useState({});
  const [userAnswer, setUserAnswer] = useState({});
  const [sectionImages, setSectionImages] = useState({});
  const endRef = useRef(null);
  const reachedEnd = useRef(false);

  const sections = parseSections(lesson.content);
  const questions = lesson.questions || [];
  const keyTerms = lesson.keywords || [];

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) reachedEnd.current = true; }, { threshold: 0.5 });
    if (endRef.current) obs.observe(endRef.current);
    return () => obs.disconnect();
  }, []);

  const handleTermClick = async (term) => {
    if (activeTerm === term) { setActiveTerm(null); setTermDef(null); return; }
    setActiveTerm(term);
    setTermDef(null);
    setLoadingTerm(true);
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`);
      if (res.ok) {
        const data = await res.json();
        const def = data[0]?.meanings?.[0]?.definitions?.[0]?.definition;
        if (def) { setTermDef(def); setLoadingTerm(false); return; }
      }
    } catch(e) {}
    // Fallback: just show the term is highlighted
    setTermDef(`Key term from this lesson. Look out for this in your ${lesson.exam_board || ''} exam.`);
    setLoadingTerm(false);
  };

  const handleComplete = async () => {
    try { await contentApi.completeLesson(lesson.id); } catch(e) {}
    setCompleted(true);
    setTimeout(() => onComplete(), 800);
  };

  const handleBack = () => {
    if (!completed && !reachedEnd.current) setShowLeave(true);
    else onBack();
  };

  const SECTION_ICONS = { "Introduction":"🔍", "Core Concepts":"💡", "Key Details":"📌", "Worked Examples":"✏️", "Common Exam Mistakes":"⚠️", "Summary":"📝" };
  const SECTION_COLORS = { "Introduction":"rgba(99,102,241,0.08)", "Core Concepts":"rgba(34,211,160,0.06)", "Key Details":"rgba(245,158,11,0.06)", "Worked Examples":"rgba(59,130,246,0.06)", "Common Exam Mistakes":"rgba(239,68,68,0.06)", "Summary":"rgba(167,139,250,0.08)" };
  const SECTION_BORDER = { "Introduction":"rgba(99,102,241,0.2)", "Core Concepts":"rgba(34,211,160,0.2)", "Key Details":"rgba(245,158,11,0.2)", "Worked Examples":"rgba(59,130,246,0.2)", "Common Exam Mistakes":"rgba(239,68,68,0.2)", "Summary":"rgba(167,139,250,0.2)" };

  return (
    <div style={{ padding:"20px 16px 100px" }}>
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

      {/* Term popup */}
      {activeTerm && (
        <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", width:"calc(100% - 32px)", maxWidth:500, background:"#1e1a2e", border:`1px solid #a78bfa`, borderRadius:14, padding:"14px 16px", zIndex:150, boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#a78bfa" }}>{activeTerm}</div>
            <button onClick={() => { setActiveTerm(null); setTermDef(null); }} style={{ background:"none", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer", lineHeight:1 }}>×</button>
          </div>
          {loadingTerm ? <div style={{ fontSize:13, color:C.textMuted }}>Loading...</div> : <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{termDef}</div>}
        </div>
      )}

      <button onClick={handleBack} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:16 }}>← Back</button>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, color:C.textMuted, marginBottom:4 }}>{lesson.subject_name} · {lesson.topic_name} {lesson.exam_board && `· ${lesson.exam_board}`}</div>
        <h1 style={{ fontSize:26, fontWeight:800, color:C.text, marginBottom:8, fontFamily:"var(--font-serif)", lineHeight:1.2 }}>{lesson.title}</h1>
        {keyTerms.length > 0 && (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {keyTerms.map(k => <span key={k} onClick={() => handleTermClick(k)} style={{ fontSize:11, padding:"3px 10px", borderRadius:100, background:"rgba(167,139,250,0.12)", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.3)", cursor:"pointer", fontWeight:600 }}>{k}</span>)}
          </div>
        )}
      </div>

      {/* Tabs */}
      {questions.length > 0 && (
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {[["lesson","📖 Lesson"],["practice","📝 Practice"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding:"7px 16px", borderRadius:100, fontSize:13, fontWeight:600, cursor:"pointer",
              background: tab===id ? "var(--accent-soft)" : "transparent",
              border:`1px solid ${tab===id ? C.accent : C.border}`,
              color: tab===id ? C.accent : C.textSec,
            }}>{label}</button>
          ))}
        </div>
      )}

      {tab === "lesson" && (
        <>
          {/* Hero image */}
          <div style={{ width:"100%", height:180, borderRadius:16, overflow:"hidden", marginBottom:24, background:C.surface }}>
            <img
              src={`https://source.unsplash.com/800x400/?${encodeURIComponent((lesson.topic_name || lesson.title) + ' education science')}`}
              alt={lesson.title}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
              onError={e => { e.target.style.display='none'; }}
            />
          </div>

          {/* Purple term hint */}
          {keyTerms.length > 0 && (
            <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)", marginBottom:20, fontSize:12, color:"#a78bfa" }}>
              💡 Tap any <span style={{ fontWeight:700 }}>purple word</span> for a quick explanation
            </div>
          )}

          {/* Sections */}
          {sections.map((section, i) => (
            <div key={i} style={{
              marginBottom:16, borderRadius:16, overflow:"hidden",
              background: SECTION_COLORS[section.title] || C.surface,
              border:`1px solid ${SECTION_BORDER[section.title] || C.border}`,
            }}>
              <div style={{ padding:"14px 16px 12px", borderBottom:`1px solid ${SECTION_BORDER[section.title] || C.border}`, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:18 }}>{SECTION_ICONS[section.title] || "📄"}</span>
                <span style={{ fontSize:15, fontWeight:700, color:C.text }}>{section.title}</span>
              </div>

              {/* Section image for key sections */}
              {(section.title === "Core Concepts" || section.title === "Worked Examples") && (
                <div style={{ width:"100%", height:140, overflow:"hidden", background:C.surface }}>
                  <img
                    src={`https://source.unsplash.com/800x300/?${encodeURIComponent(section.title + ' ' + (lesson.topic_name || '') + ' diagram')}`}
                    alt={section.title}
                    style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.85 }}
                    onError={e => { e.target.style.display='none'; }}
                  />
                </div>
              )}

              <div style={{ padding:"14px 16px" }}>
                {section.body.split('\n\n').filter(p => p.trim()).map((para, pi) => (
                  <p key={pi} style={{ fontSize:15, color:C.text, lineHeight:1.8, marginBottom:pi < section.body.split('\n\n').length - 1 ? 14 : 0 }}>
                    <HighlightedText text={para} keyTerms={keyTerms} onTermClick={handleTermClick} />
                  </p>
                ))}
              </div>
            </div>
          ))}

          {/* Action buttons */}
          <div style={{ display:"flex", gap:10, marginBottom:16, marginTop:8 }}>
            <Link href="/ai" style={{ flex:1 }}><Btn variant="ghost" style={{ width:"100%", fontSize:13 }}>✦ Ask AI</Btn></Link>
            <Link href="/flashcards" style={{ flex:1 }}><Btn variant="ghost" style={{ width:"100%", fontSize:13 }}>🗂 Flashcards</Btn></Link>
          </div>

          {questions.length > 0 && (
            <button onClick={() => setTab("practice")} style={{ width:"100%", padding:"14px", borderRadius:12, marginBottom:16, background:"rgba(99,102,241,0.1)", border:`1px solid var(--accent-glow)`, color:C.accent, fontSize:14, fontWeight:700, cursor:"pointer" }}>
              📝 {questions.length} practice questions →
            </button>
          )}

          {/* Complete */}
          <div ref={endRef} style={{ padding:"24px", background: completed ? "rgba(34,211,160,0.1)" : "var(--surface-high)", borderRadius:16, textAlign:"center", border:`1px solid ${completed ? C.green : C.border}` }}>
            {completed ? (
              <div>
                <div style={{ fontSize:36, marginBottom:8 }}>🎉</div>
                <div style={{ fontSize:16, fontWeight:700, color:C.green }}>Lesson complete!</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize:13, color:C.textSec, marginBottom:16 }}>Finished? Mark this lesson as complete to track your progress.</div>
                <Btn onClick={handleComplete} style={{ padding:"12px 32px", fontSize:15 }}>✓ Mark Complete</Btn>
              </div>
            )}
          </div>
        </>
      )}

      {/* Practice tab */}
      {tab === "practice" && (
        <div>
          <p style={{ fontSize:13, color:C.textSec, marginBottom:20 }}>Questions from Grade C to A*.</p>
          {questions.map((q, i) => {
            const GRADE_COLORS = { "C":"#f59e0b","B":"#3b82f6","A":"#8b5cf6","A*":"#22d3a0" };
            const gc = GRADE_COLORS[q.grade] || C.accent;
            return (
              <div key={q.id} style={{ marginBottom:16, padding:"16px", borderRadius:14, background:C.surface, border:`1px solid ${gc}33` }}>
                <div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center" }}>
                  <span style={{ padding:"3px 10px", borderRadius:100, fontSize:11, fontWeight:800, background:`${gc}22`, color:gc, border:`1px solid ${gc}` }}>Grade {q.grade}</span>
                  <span style={{ fontSize:11, color:C.textMuted }}>{q.marks} marks</span>
                  {q.command_word && <span style={{ fontSize:11, color:C.textMuted }}>{q.command_word}</span>}
                </div>
                <div style={{ fontSize:15, fontWeight:600, color:C.text, marginBottom:14, lineHeight:1.5 }}>{q.question}</div>
                {!showMark[q.id] ? (
                  <div>
                    <textarea value={userAnswer[q.id]||""} onChange={e=>setUserAnswer(p=>({...p,[q.id]:e.target.value}))} placeholder="Write your answer..." rows={3} style={{ width:"100%", padding:"10px 12px", background:"var(--surface-high)", border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, lineHeight:1.6, resize:"vertical", outline:"none", boxSizing:"border-box" }} />
                    <Btn onClick={()=>setShowMark(p=>({...p,[q.id]:true}))} disabled={!userAnswer[q.id]?.trim()} style={{ width:"100%", padding:"10px", marginTop:8, fontSize:13 }}>Reveal mark scheme →</Btn>
                  </div>
                ) : (
                  <div>
                    <div style={{ padding:"12px", background:"rgba(34,211,160,0.08)", borderRadius:10, marginBottom:10, border:`1px solid rgba(34,211,160,0.2)` }}>
                      <div style={{ fontSize:11, fontWeight:700, color:C.green, marginBottom:6, textTransform:"uppercase" }}>Mark Scheme</div>
                      <div style={{ fontSize:13, color:C.text, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{q.mark_scheme}</div>
                    </div>
                    {q.model_answer && <div style={{ padding:"12px", background:"rgba(99,102,241,0.08)", borderRadius:10, marginBottom:10, border:`1px solid var(--accent-glow)` }}>
                      <div style={{ fontSize:11, fontWeight:700, color:C.accent, marginBottom:6, textTransform:"uppercase" }}>Model Answer</div>
                      <div style={{ fontSize:13, color:C.text, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{q.model_answer}</div>
                    </div>}
                    {q.examiner_tip && <div style={{ padding:"10px 12px", background:"rgba(245,158,11,0.08)", borderRadius:8, border:`1px solid rgba(245,158,11,0.2)` }}><div style={{ fontSize:12, color:C.amber }}>💡 {q.examiner_tip}</div></div>}
                    <button onClick={()=>{setShowMark(p=>({...p,[q.id]:false}));setUserAnswer(p=>({...p,[q.id]:""}));}} style={{ background:"none", border:"none", color:C.textMuted, fontSize:12, cursor:"pointer", marginTop:8 }}>Try again ↺</button>
                  </div>
                )}
              </div>
            );
          })}
          <Btn onClick={()=>setTab("lesson")} variant="ghost" style={{ width:"100%", padding:"12px", marginTop:8 }}>← Back to lesson</Btn>
        </div>
      )}
    </div>
  );
}
