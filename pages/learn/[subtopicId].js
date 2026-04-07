import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { contentApi } from "../../lib/api";
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
    contentApi.lessons(subtopicId)
      .then(setLessons)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subtopicId]);

  const openLesson = async (id) => {
    const lesson = await contentApi.lesson(id).catch(() => null);
    setSelected(lesson);
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding: 60 }}><Spinner size={32}/></div>;

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
    <div style={{ padding: "20px 16px 100px" }}>
      <button onClick={() => router.back()} style={{ background:"none", border:"none", color: C.accent, fontSize: 14, cursor:"pointer", marginBottom: 20 }}>
        ← Back
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4, fontFamily: "var(--font-serif)" }}>Lessons</h1>
      <p style={{ fontSize: 13, color: C.textSec, marginBottom: 24 }}>{lessons.length} lessons available</p>

      {lessons.length === 0 && <p style={{ color: C.textSec, textAlign:"center", padding: 40 }}>No lessons yet — check back soon!</p>}
      {lessons.map(l => (
        <div key={l.id} onClick={() => openLesson(l.id)} style={{
          padding: "16px 20px", borderRadius: 14,
          background: C.surface, border: `1px solid ${l.completed ? C.green : C.border}`,
          marginBottom: 10, cursor: "pointer", transition: "border-color 0.2s",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{l.title}</div>
            {l.summary && <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5 }}>{l.summary}</p>}
          </div>
          {l.completed && (
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12, fontSize: 14 }}>✓</div>
          )}
        </div>
      ))}
    </div>
  );
}

function LessonView({ lesson, onBack, onComplete }) {
  const [showAnswer, setShowAnswer] = useState({});
  const [completed, setCompleted]   = useState(false);
  const [showLeave, setShowLeave]   = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const endRef = useRef(null);
  const containerRef = useRef(null);

  // Detect when user scrolls to end
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setReachedEnd(true);
    }, { threshold: 0.5 });
    if (endRef.current) obs.observe(endRef.current);
    return () => obs.disconnect();
  }, []);

  const handleComplete = async () => {
    try {
      await contentApi.completeLesson(lesson.id);
    } catch(e) {}
    setCompleted(true);
    setTimeout(() => onComplete(), 1000);
  };

  const handleBack = () => {
    if (!completed && !reachedEnd) {
      setShowLeave(true);
    } else {
      onBack();
    }
  };

  return (
    <div style={{ padding: "20px 16px 100px" }} ref={containerRef}>
      {/* Leave warning modal */}
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

      <button onClick={handleBack} style={{ background:"none", border:"none", color: C.accent, fontSize: 14, cursor:"pointer", marginBottom: 20 }}>
        ← Back to lessons
      </button>

      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: C.textSec }}>{lesson.subject_name} · {lesson.topic_name}</span>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, fontFamily: "var(--font-serif)" }}>{lesson.title}</h1>

      {lesson.keywords?.length > 0 && (
        <div style={{ display:"flex", gap: 6, flexWrap:"wrap", marginBottom: 20 }}>
          {lesson.keywords.map(k => <Tag key={k}>{k}</Tag>)}
        </div>
      )}

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: C.text, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
          {lesson.content}
        </div>
      </Card>

      {lesson.modelAnswers?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 12, letterSpacing:"0.08em", textTransform:"uppercase" }}>Model Answers</div>
          {lesson.modelAnswers.map(ma => (
            <Card key={ma.id} style={{ marginBottom: 10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{ma.title}</div>
                <div style={{ display:"flex", gap: 8 }}>
                  {ma.grade && <Tag color={C.green}>{ma.grade}</Tag>}
                  {ma.marks && <Tag color={C.amber}>{ma.marks} marks</Tag>}
                </div>
              </div>
              {showAnswer[ma.id] ? (
                <>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 8 }}>{ma.content}</div>
                  {ma.annotations && <div style={{ fontSize: 12, color: C.accent, padding: "8px 12px", background: "var(--accent-soft)", borderRadius: 8 }}>💡 {ma.annotations}</div>}
                  <button onClick={() => setShowAnswer(p => ({ ...p, [ma.id]: false }))} style={{ background:"none", border:"none", color: C.textMuted, fontSize: 13, cursor:"pointer", marginTop: 8 }}>Hide ▲</button>
                </>
              ) : (
                <button onClick={() => setShowAnswer(p => ({ ...p, [ma.id]: true }))} style={{ background:"none", border:`1px solid ${C.border}`, color: C.textSec, fontSize: 13, padding:"8px 16px", borderRadius: 8, cursor:"pointer" }}>
                  Reveal model answer →
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      <div style={{ display:"flex", gap: 10, marginBottom: 20 }}>
        <Link href="/ai" style={{ flex: 1 }}>
          <Btn variant="ghost" style={{ width:"100%" }}>✦ Ask AI about this</Btn>
        </Link>
        <Link href="/flashcards" style={{ flex: 1 }}>
          <Btn style={{ width:"100%" }}>🗂 Make flashcards</Btn>
        </Link>
      </div>

      {/* End of lesson marker + complete button */}
      <div ref={endRef} style={{ padding:"24px", background: completed ? "rgba(34,211,160,0.1)" : "var(--surface-high)", borderRadius:16, textAlign:"center", border:`1px solid ${completed ? C.green : C.border}` }}>
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
    </div>
  );
}
