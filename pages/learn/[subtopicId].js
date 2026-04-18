import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { contentApi } from "../../lib/api";
import { useStudyLimit, StudyLimitWall, StudyLimitBanner } from "../../components/StudyTimer";
import { Card, Tag, Btn, C, Spinner } from "../../components/ui";
import Link from "next/link";

export default function SubtopicPage() {
  const router = useRouter();
  const { subtopicId } = router.query;
  const [lessons, setLessons]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);

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

const GRADE_COLORS = { "C": "#f59e0b", "B": "#3b82f6", "A": "#8b5cf6", "A*": "#22d3a0" };

// Split lesson content into paragraphs (major ones only)
function splitIntoParagraphs(content) {
  if (!content) return [];
  // Split by double newlines or single newlines followed by capital letters
  const raw = content.split(/\n\n+/).filter(p => p.trim().length > 80);
  return raw;
}

function LessonView({ lesson, onBack, onComplete }) {
  const studyLimit = useStudyLimit();
  const minutesUsed = studyLimit?.minutesUsed || 0;
  const isPremium = studyLimit?.isPremium !== false;
  const isLimited = studyLimit?.isLimited || false;
  const [showAnswer, setShowAnswer]   = useState({});
  const [completed, setCompleted]     = useState(false);
  const [showLeave, setShowLeave]     = useState(false);
  const [reachedEnd, setReachedEnd]   = useState(false);
  const [tab, setTab]                 = useState("lesson");
  const [activeQ, setActiveQ]         = useState(null);
  const [userAnswer, setUserAnswer]   = useState({});
  const [showMark, setShowMark]       = useState({});

  // Paragraph quiz state
  const [paragraphQuizzes, setPQuizzes] = useState({}); // { paragraphIndex: quiz }
  const [loadingQuiz, setLoadingQuiz]   = useState({});
  const [userPAnswer, setUserPAnswer]   = useState({});
  const [showPAnswer, setShowPAnswer]   = useState({});
  const [unlockedPara, setUnlocked]     = useState(0); // which paragraph index is unlocked

  const endRef = useRef(null);
  const paraRefs = useRef({});

  const paragraphs = splitIntoParagraphs(lesson.content);
  const questions  = lesson.questions || [];

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setReachedEnd(true);
    }, { threshold: 0.5 });
    if (endRef.current) obs.observe(endRef.current);
    return () => obs.disconnect();
  }, []);

  const loadParagraphQuiz = async (index, paraText) => {
    if (paragraphQuizzes[index] || loadingQuiz[index]) return;
    setLoadingQuiz(p => ({...p, [index]: true}));
    try {
      const quiz = await contentApi.paragraphQuiz(lesson.id, paraText, index);
      setPQuizzes(p => ({...p, [index]: quiz}));
    } catch(e) {
      // silently fail — just don't show quiz
    } finally {
      setLoadingQuiz(p => ({...p, [index]: false}));
    }
  };

  const submitPAnswer = (index) => {
    setShowPAnswer(p => ({...p, [index]: true}));
    // Unlock next paragraph
    setUnlocked(Math.max(unlockedPara, index + 1));
    // Scroll to next paragraph after a moment
    setTimeout(() => {
      paraRefs.current[index + 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 500);
  };

  const handleComplete = async () => {
    try { await contentApi.completeLesson(lesson.id); } catch(e) {}
    setCompleted(true);
    setTimeout(() => onComplete(), 1000);
  };

  const handleBack = () => {
    if (!completed && !reachedEnd) setShowLeave(true);
    else onBack();
  };

  return (
    <div style={{ padding:"20px 16px 100px" }}>
      {/* Leave warning */}
      {showLeave && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:24 }}>
          <div style={{ background:C.surface, borderRadius:16, padding:28, width:"100%", maxWidth:360, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:8 }}>Are you sure you want to leave?</div>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:24 }}>If you leave before finishing, you don't get completion credit</div>
            <div style={{ display:"flex", gap:12 }}>
              <Btn onClick={() => { setShowLeave(false); onBack(); }} variant="ghost" style={{ flex:1, padding:"12px" }}>Leave</Btn>
              <Btn onClick={() => setShowLeave(false)} style={{ flex:1, padding:"12px" }}>Continue</Btn>
            </div>
          </div>
        </div>
      )}

      <button onClick={handleBack} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:20 }}>← Back to lessons</button>

      <div style={{ marginBottom:8 }}>
        <span style={{ fontSize:12, color:C.textSec }}>{lesson.subject_name} · {lesson.topic_name}</span>
      </div>
      <h1 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:16, fontFamily:"var(--font-serif)" }}>{lesson.title}</h1>

      {/* Tab bar */}
      {questions.length > 0 && (
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {[["lesson","📖 Lesson"],["practice","📝 Practice Questions"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding:"8px 16px", borderRadius:100, fontSize:13, fontWeight:600, cursor:"pointer",
              background: tab===id ? "var(--accent-soft)" : "transparent",
              border:`1px solid ${tab===id ? C.accent : C.border}`,
              color: tab===id ? C.accent : C.textSec,
            }}>{label}</button>
          ))}
        </div>
      )}

      {/* Lesson content with paragraph quizzes */}
      {tab === "lesson" && (
        <>
          {lesson.keywords?.length > 0 && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }}>
              {lesson.keywords.map(k => <Tag key={k}>{k}</Tag>)}
            </div>
          )}

          {/* Render paragraphs with quizzes between them */}
          {paragraphs.length > 0 ? (
            paragraphs.map((para, i) => {
              const isUnlocked = i <= unlockedPara;
              const quiz = paragraphQuizzes[i];
              const isLastPara = i === paragraphs.length - 1;

              return (
                <div key={i} ref={el => paraRefs.current[i] = el}>
                  {/* Paragraph text */}
                  <div style={{
                    fontSize:14, color:C.text, lineHeight:1.8,
                    marginBottom:16, whiteSpace:"pre-wrap",
                    opacity: isUnlocked ? 1 : 0.3,
                    transition:"opacity 0.4s",
                    filter: isUnlocked ? "none" : "blur(2px)",
                    pointerEvents: isUnlocked ? "auto" : "none",
                  }}>
                    {para}
                  </div>

                  {/* Quiz after each paragraph (except possibly last) */}
                  {isUnlocked && !isLastPara && (
                    <ParagraphQuiz
                      index={i}
                      para={para}
                      quiz={quiz}
                      loading={loadingQuiz[i]}
                      userAnswer={userPAnswer[i] || ""}
                      setUserAnswer={v => setUserPAnswer(p => ({...p,[i]:v}))}
                      showAnswer={showPAnswer[i]}
                      onSubmit={() => submitPAnswer(i)}
                      onLoad={() => loadParagraphQuiz(i, para)}
                    />
                  )}

                  {/* Divider */}
                  {!isLastPara && isUnlocked && (
                    <div style={{ height:1, background:C.border, margin:"20px 0" }} />
                  )}
                </div>
              );
            })
          ) : (
            // Fallback: show full content without paragraph splitting
            <Card style={{ marginBottom:20 }}>
              <div style={{ fontSize:14, color:C.text, lineHeight:1.8, whiteSpace:"pre-wrap" }}>
                {lesson.content}
              </div>
            </Card>
          )}

          {/* Model answers */}
          {lesson.modelAnswers?.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:12, letterSpacing:"0.08em", textTransform:"uppercase" }}>Model Answers</div>
              {lesson.modelAnswers.map(ma => (
                <Card key={ma.id} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{ma.title}</div>
                    <div style={{ display:"flex", gap:8 }}>
                      {ma.grade && <Tag color={C.green}>{ma.grade}</Tag>}
                      {ma.marks && <Tag color={C.amber}>{ma.marks} marks</Tag>}
                    </div>
                  </div>
                  {showAnswer[ma.id] ? (
                    <>
                      <div style={{ fontSize:13, color:C.text, lineHeight:1.7, marginBottom:8 }}>{ma.content}</div>
                      {ma.annotations && <div style={{ fontSize:12, color:C.accent, padding:"8px 12px", background:"var(--accent-soft)", borderRadius:8 }}>💡 {ma.annotations}</div>}
                      <button onClick={() => setShowAnswer(p => ({...p,[ma.id]:false}))} style={{ background:"none", border:"none", color:C.textMuted, fontSize:13, cursor:"pointer", marginTop:8 }}>Hide ▲</button>
                    </>
                  ) : (
                    <button onClick={() => setShowAnswer(p => ({...p,[ma.id]:true}))} style={{ background:"none", border:`1px solid ${C.border}`, color:C.textSec, fontSize:13, padding:"8px 16px", borderRadius:8, cursor:"pointer" }}>
                      Reveal model answer →
                    </button>
                  )}
                </Card>
              ))}
            </div>
          )}

          <div style={{ display:"flex", gap:10, marginBottom:20 }}>
            <Link href="/ai" style={{ flex:1 }}><Btn variant="ghost" style={{ width:"100%" }}>✦ Ask AI about this</Btn></Link>
            <Link href="/flashcards" style={{ flex:1 }}><Btn style={{ width:"100%" }}>🗂 Make flashcards</Btn></Link>
          </div>

          {questions.length > 0 && (
            <button onClick={() => setTab("practice")} style={{
              width:"100%", padding:"14px", borderRadius:12, marginBottom:20,
              background:"rgba(99,102,241,0.1)", border:`1px solid var(--accent-glow)`,
              color:C.accent, fontSize:14, fontWeight:700, cursor:"pointer",
            }}>
              📝 {questions.length} practice questions available →
            </button>
          )}

          {/* Complete button */}
          <div ref={endRef} style={{ padding:"24px", background:completed ? "rgba(34,211,160,0.1)" : "var(--surface-high)", borderRadius:16, textAlign:"center", border:`1px solid ${completed ? C.green : C.border}` }}>
            {completed ? (
              <div>
                <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
                <div style={{ fontSize:16, fontWeight:700, color:C.green }}>Lesson complete!</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize:14, color:C.textSec, marginBottom:16 }}>Finished reading? Mark this lesson as complete.</div>
                <Btn onClick={handleComplete} style={{ padding:"12px 32px", fontSize:15 }}>✓ Mark as Complete</Btn>
              </div>
            )}
          </div>
        </>
      )}

      {/* Practice questions tab */}
      {tab === "practice" && (
        <div>
          <p style={{ fontSize:13, color:C.textSec, marginBottom:20 }}>Questions progress from Grade C to Grade A*.</p>
          {questions.map((q, i) => (
            <div key={q.id} style={{ marginBottom:16 }}>
              <Card style={{ borderColor: GRADE_COLORS[q.grade] || C.border }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <div style={{ padding:"3px 10px", borderRadius:100, fontSize:12, fontWeight:800, background:`${GRADE_COLORS[q.grade] || C.accent}22`, color:GRADE_COLORS[q.grade] || C.accent, border:`1px solid ${GRADE_COLORS[q.grade] || C.accent}` }}>Grade {q.grade}</div>
                    <Tag color={C.amber}>{q.marks} marks</Tag>
                    {q.command_word && <Tag>{q.command_word}</Tag>}
                  </div>
                  <div style={{ fontSize:12, color:C.textMuted }}>Q{i+1}</div>
                </div>
                <div style={{ fontSize:15, fontWeight:600, color:C.text, marginBottom:16, lineHeight:1.5 }}>{q.question}</div>
                {!showMark[q.id] && (
                  <div style={{ marginBottom:12 }}>
                    <textarea value={userAnswer[q.id] || ""} onChange={e => setUserAnswer(p => ({...p,[q.id]:e.target.value}))} placeholder="Write your answer here..." rows={4} style={{ width:"100%", padding:"12px", background:"var(--surface-high)", border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, lineHeight:1.6, resize:"vertical", outline:"none", boxSizing:"border-box" }} />
                    <Btn onClick={() => setShowMark(p => ({...p,[q.id]:true}))} disabled={!userAnswer[q.id]?.trim()} style={{ width:"100%", padding:"11px", marginTop:8, fontSize:14 }}>Reveal mark scheme →</Btn>
                  </div>
                )}
                {showMark[q.id] && (
                  <div>
                    <div style={{ padding:"14px", background:"rgba(34,211,160,0.08)", borderRadius:10, marginBottom:12, border:`1px solid rgba(34,211,160,0.2)` }}>
                      <div style={{ fontSize:11, fontWeight:700, color:C.green, marginBottom:8, letterSpacing:"0.06em", textTransform:"uppercase" }}>Mark Scheme</div>
                      <div style={{ fontSize:13, color:C.text, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{q.mark_scheme}</div>
                    </div>
                    {q.model_answer && (
                      <div style={{ padding:"14px", background:"rgba(99,102,241,0.08)", borderRadius:10, marginBottom:12, border:`1px solid var(--accent-glow)` }}>
                        <div style={{ fontSize:11, fontWeight:700, color:C.accent, marginBottom:8, letterSpacing:"0.06em", textTransform:"uppercase" }}>Model Answer (Grade {q.grade})</div>
                        <div style={{ fontSize:13, color:C.text, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{q.model_answer}</div>
                      </div>
                    )}
                    {q.examiner_tip && <div style={{ padding:"10px 14px", background:"rgba(245,158,11,0.08)", borderRadius:8, border:`1px solid rgba(245,158,11,0.2)` }}><div style={{ fontSize:12, color:C.amber }}>💡 {q.examiner_tip}</div></div>}
                    <button onClick={() => { setShowMark(p => ({...p,[q.id]:false})); setUserAnswer(p => ({...p,[q.id]:""})); }} style={{ background:"none", border:"none", color:C.textMuted, fontSize:12, cursor:"pointer", marginTop:10 }}>Try again ↺</button>
                  </div>
                )}
              </Card>
            </div>
          ))}
          <Btn onClick={() => setTab("lesson")} variant="ghost" style={{ width:"100%", padding:"12px", marginTop:8 }}>← Back to lesson</Btn>
        </div>
      )}
    </div>
  );
}

function ParagraphQuiz({ index, para, quiz, loading, userAnswer, setUserAnswer, showAnswer, onSubmit, onLoad }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Auto-load quiz when paragraph becomes visible
    onLoad();
  }, []);

  if (loading) return (
    <div style={{ padding:"16px", background:"var(--surface-high)", borderRadius:12, marginBottom:8, display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${C.accent}`, borderTopColor:"transparent", animation:"spin 0.7s linear infinite" }} />
      <span style={{ fontSize:13, color:C.textMuted }}>Generating quiz…</span>
    </div>
  );

  if (!quiz) return null;

  return (
    <div style={{ padding:"16px", background:"rgba(99,102,241,0.06)", border:`1px solid var(--accent-glow)`, borderRadius:14, marginBottom:8 }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.accent, marginBottom:10, letterSpacing:"0.06em", textTransform:"uppercase" }}>✦ Quick Check</div>

      {/* Diagram if present */}
      {quiz.diagram && (
        <div style={{ marginBottom:14, padding:"12px 14px", background:"var(--surface-high)", borderRadius:10, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.textSec, marginBottom:8 }}>{quiz.diagram.title}</div>
          <pre style={{ fontSize:12, color:C.text, lineHeight:1.6, fontFamily:"monospace", whiteSpace:"pre-wrap", margin:0 }}>
            {quiz.diagram.content}
          </pre>
        </div>
      )}

      <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:12, lineHeight:1.5 }}>{quiz.question}</div>

      {!showAnswer ? (
        <div>
          <textarea
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            placeholder="Type your answer…"
            rows={2}
            style={{ width:"100%", padding:"10px 12px", background:"var(--surface-high)", border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:13, lineHeight:1.6, resize:"none", outline:"none", boxSizing:"border-box" }}
          />
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Btn onClick={onSubmit} disabled={!userAnswer?.trim()} style={{ flex:1, padding:"9px", fontSize:13 }}>
              Check answer →
            </Btn>
            <button onClick={onSubmit} style={{ padding:"9px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:"none", color:C.textMuted, fontSize:12, cursor:"pointer" }}>
              Skip
            </button>
          </div>
        </div>
      ) : (
        <div>
          {userAnswer && (
            <div style={{ padding:"10px 12px", background:"var(--surface-high)", borderRadius:10, marginBottom:10, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:11, color:C.textMuted, marginBottom:4 }}>Your answer:</div>
              <div style={{ fontSize:13, color:C.text }}>{userAnswer}</div>
            </div>
          )}
          <div style={{ padding:"12px 14px", background:"rgba(34,211,160,0.08)", borderRadius:10, border:`1px solid rgba(34,211,160,0.2)` }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.green, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Model Answer</div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{quiz.answer}</div>
          </div>
          <div style={{ fontSize:12, color:C.accent, marginTop:10, fontWeight:600 }}>✓ Continue reading below →</div>
        </div>
      )}
    </div>
  );
}
