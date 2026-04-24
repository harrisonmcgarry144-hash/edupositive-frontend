import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { contentApi, authApi } from "../lib/api";
import { Btn, C, Spinner } from "../components/ui";

const EXAM_BOARDS = ["AQA", "Edexcel", "OCR", "WJEC", "Eduqas", "Cambridge"];

export default function EditSubjects() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [allSubjects, setAllSubjects] = useState([]);
  const [selected, setSelected] = useState([]);
  const [boardSelections, setBoardSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    Promise.all([
      contentApi.subjects(),
      contentApi.mySubjects().catch(() => []),
    ]).then(([all, mine]) => {
      setAllSubjects(all || []);
      const selectedIds = mine.map(s => s.id);
      setSelected(selectedIds);
      const boards = {};
      mine.forEach(s => { if (s.exam_board) boards[s.id] = s.exam_board; });
      setBoardSelections(boards);
    }).finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const selectedSubjects = allSubjects.filter(s => selected.includes(s.id));

  const save = async () => {
    setSaving(true);
    try {
      await authApi.onboarding({ subjectIds: selected, boardSelections, levelType: user?.level_type || 'a-level' });
      router.replace('/learn');
    } catch(e) { alert(e.message); }
    setSaving(false);
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;

  return (
    <div style={{ padding:"20px 16px 100px", maxWidth:560, margin:"0 auto" }}>
      <button onClick={() => step === 1 ? router.back() : setStep(1)} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:20 }}>← Back</button>

      <h1 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>
        {step === 1 ? "Edit your subjects" : "Update exam boards"}
      </h1>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:20 }}>
        {step === 1 ? `${selected.length} selected` : "Pick the exam board for each subject"}
      </p>

      {/* Step indicator */}
      <div style={{ display:"flex", gap:6, marginBottom:24 }}>
        {[1,2].map(s => <div key={s} style={{ width:32, height:4, borderRadius:100, background: step >= s ? C.accent : C.border }} />)}
      </div>

      {step === 1 && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:24 }}>
            {allSubjects.map(s => {
              const sel = selected.includes(s.id);
              return (
                <button key={s.id} onClick={() => toggle(s.id)} style={{
                  padding:"12px 14px", borderRadius:12, cursor:"pointer", textAlign:"left",
                  background: sel ? "var(--accent-soft)" : C.surface,
                  border:`2px solid ${sel ? C.accent : C.border}`,
                }}>
                  <div style={{ fontSize:13, fontWeight:600, color: sel ? C.accent : C.text }}>{s.name}</div>
                </button>
              );
            })}
          </div>
          <Btn onClick={() => setStep(2)} disabled={selected.length === 0} style={{ width:"100%", padding:"13px", fontSize:15 }}>
            Next: Exam boards →
          </Btn>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
            {selectedSubjects.map(s => (
              <div key={s.id} style={{ padding:"14px 16px", borderRadius:12, background:C.surface, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:10 }}>{s.name}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {(s.exam_boards || EXAM_BOARDS).map(board => {
                    const sel = boardSelections[s.id] === board;
                    return (
                      <button key={board} onClick={() => setBoardSelections(p => ({...p, [s.id]: board}))} style={{
                        padding:"6px 14px", borderRadius:100, fontSize:12, fontWeight:600, cursor:"pointer",
                        background: sel ? "var(--accent-soft)" : "transparent",
                        border:`1px solid ${sel ? C.accent : C.border}`,
                        color: sel ? C.accent : C.textSec,
                      }}>{board}</button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <Btn onClick={save} disabled={saving || selectedSubjects.some(s => !boardSelections[s.id])} style={{ width:"100%", padding:"13px", fontSize:15 }}>
            {saving ? "Saving…" : "Save changes →"}
          </Btn>
        </>
      )}
    </div>
  );
}
