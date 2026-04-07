import { useState, useEffect } from "react";
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

  if (selected) return <LessonView lesson={selected} onBack={() => setSelected(null)} />;

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <button onClick={() => router.back()} style={{ background:"none", border:"none", color: C.accent, fontSize: 14, cursor:"pointer", marginBottom: 20, display:"flex", alignItems:"center", gap: 6 }}>
        ← Back
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4, fontFamily: "var(--font-serif)" }}>Lessons</h1>
      <p style={{ fontSize: 13, color: C.textSec, marginBottom: 24 }}>{lessons.length} lessons available</p>

      {lessons.length === 0 && <p style={{ color: C.textSec, textAlign:"center", padding: 40 }}>No lessons yet</p>}
      {lessons.map(l => (
        <div key={l.id} onClick={() => openLesson(l.id)} style={{
          padding: "16px 20px", borderRadius: 14,
          background: C.surface, border: `1px solid ${C.border}`,
          marginBottom: 10, cursor: "pointer", transition: "border-color 0.2s",
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{l.title}</div>
          {l.summary && <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5, marginBottom: 8 }}>{l.summary}</p>}
          {l.keywords?.length > 0 && (
            <div style={{ display:"flex", gap: 6, flexWrap:"wrap" }}>
              {l.keywords.slice(0,4).map(k => <Tag key={k}>{k}</Tag>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LessonView({ lesson, onBack }) {
  const [showAnswer, setShowAnswer] = useState({});

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color: C.accent, fontSize: 14, cursor:"pointer", marginBottom: 20 }}>
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

      <div style={{ display:"flex", gap: 10 }}>
        <Link href="/ai" style={{ flex: 1 }}>
          <Btn variant="ghost" style={{ width:"100%" }}>✦ Ask AI about this</Btn>
        </Link>
        <Link href="/flashcards" style={{ flex: 1 }}>
          <Btn style={{ width:"100%" }}>🗂 Make flashcards</Btn>
        </Link>
      </div>
    </div>
  );
}
