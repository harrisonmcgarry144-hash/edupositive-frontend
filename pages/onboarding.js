import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { authApi, contentApi, generateApi } from "../lib/api";
import { SUBJECT_OPTIONS } from "../lib/subject_options_data";
import { Btn, C, Spinner } from "../components/ui";

const EXAM_BOARDS = ["AQA", "Edexcel", "OCR", "WJEC", "Eduqas", "Cambridge"];

export default function Onboarding() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(1); // 1=subjects, 2=exam boards, 3=goals
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState([]);
  const [boardSelections, setBoardSelections] = useState({}); // subjectId -> board
  const [customisations, setCustomisations] = useState({}); // subjectName -> array of choices or object
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [careerGoal, setCareerGoal] = useState("");

  useEffect(() => {
    if (user?.role === "admin") { router.replace("/dashboard"); return; }
    contentApi.subjects().then(setSubjects).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggle = (id) => {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const selectedSubjects = subjects.filter(s => selected.includes(s.id));

  const save = async () => {
    setSaving(true);
    try {
      // Save subject selections with exam boards
      const subjectIds = selected;
      await authApi.onboarding({ subjectIds, boardSelections, customisations, careerGoal, levelType: "a-level" });
      updateUser({ level_type: "a-level", career_goal: careerGoal });
      router.replace("/generating");
    } catch (e) {
      alert(e.message);
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"20px 16px 100px" }}>
      <div style={{ maxWidth:560, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>✦</div>
          <h1 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>
            {step === 1 ? "Choose your A-Level subjects" : step === 2 ? "Select your exam boards" : step === 3 ? "Your specific texts & topics" : "Almost there"}
          </h1>
          <p style={{ fontSize:13, color:C.textSec }}>
            {step === 1 ? `${selected.length} selected` : step === 2 ? "Pick the exam board for each subject" : step === 3 ? "Only for subjects that vary by school" : "One last thing"}
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:28 }}>
          {[1,2,3,4].map(s => (
            <div key={s} style={{ width:32, height:4, borderRadius:100, background: step >= s ? C.accent : C.border, transition:"background 0.2s" }} />
          ))}
        </div>

        {/* Step 1 — Subject selection */}
        {step === 1 && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:24 }}>
              {subjects.map(s => {
                const sel = selected.includes(s.id);
                return (
                  <button key={s.id} onClick={() => toggle(s.id)} style={{
                    padding:"12px 14px", borderRadius:12, cursor:"pointer", textAlign:"left",
                    background: sel ? "var(--accent-soft)" : C.surface,
                    border:`2px solid ${sel ? C.accent : C.border}`,
                    transition:"all 0.15s",
                  }}>
                    <div style={{ fontSize:13, fontWeight:600, color: sel ? C.accent : C.text }}>{s.name}</div>
                  </button>
                );
              })}
            </div>
            <Btn
              onClick={() => setStep(2)}
              disabled={selected.length === 0}
              style={{ width:"100%", padding:"13px", fontSize:15 }}
            >
              Next: Choose exam boards →
            </Btn>
          </>
        )}

        {/* Step 2 — Exam board selection */}
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
            <div style={{ display:"flex", gap:10 }}>
              <Btn variant="ghost" onClick={() => setStep(1)} style={{ flex:1, padding:"13px" }}>Back</Btn>
              <Btn
                onClick={() => {
                  const needsCustom = selectedSubjects.some(s => SUBJECT_OPTIONS[s.name]);
                  setStep(needsCustom ? 3 : 4);
                }}
                disabled={selectedSubjects.some(s => !boardSelections[s.id])}
                style={{ flex:2, padding:"13px", fontSize:15 }}
              >
                Next →
              </Btn>
            </div>
          </>
        )}

        {/* Step 3 — Subject-specific customisation */}
        {step === 3 && (
          <>
            <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:24 }}>
              {selectedSubjects.filter(s => SUBJECT_OPTIONS[s.name]).map(s => {
                const opts = SUBJECT_OPTIONS[s.name];
                const current = customisations[s.name] || {};

                return (
                  <div key={s.id} style={{ padding:"16px 18px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>{s.name}</div>
                    <div style={{ fontSize:12, color:C.textSec, marginBottom:12 }}>Pick your {opts.label.toLowerCase()}</div>

                    {opts.type === "multi-select" && (
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {opts.options.map(opt => {
                          const sel = (current.selected || []).includes(opt);
                          return (
                            <button key={opt} onClick={() => {
                              const curr = current.selected || [];
                              const next = sel ? curr.filter(x => x !== opt) : [...curr, opt];
                              setCustomisations(p => ({ ...p, [s.name]: { selected: next } }));
                            }} style={{
                              padding:"6px 12px", borderRadius:100, fontSize:12, fontWeight:600, cursor:"pointer",
                              background: sel ? "var(--accent-soft)" : "transparent",
                              border:`1px solid ${sel ? C.accent : C.border}`,
                              color: sel ? C.accent : C.textSec,
                            }}>{opt}</button>
                          );
                        })}
                      </div>
                    )}

                    {opts.type === "single-select" && (
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {opts.options.map(opt => {
                          const sel = current.selected === opt;
                          return (
                            <button key={opt} onClick={() => {
                              setCustomisations(p => ({ ...p, [s.name]: { selected: opt } }));
                            }} style={{
                              padding:"6px 12px", borderRadius:100, fontSize:12, fontWeight:600, cursor:"pointer",
                              background: sel ? "var(--accent-soft)" : "transparent",
                              border:`1px solid ${sel ? C.accent : C.border}`,
                              color: sel ? C.accent : C.textSec,
                            }}>{opt}</button>
                          );
                        })}
                      </div>
                    )}

                    {opts.type === "multi-category" && opts.categories.map(cat => {
                      const catSel = (current[cat.name] || []);
                      return (
                        <div key={cat.name} style={{ marginBottom:10 }}>
                          <div style={{ fontSize:11, color:C.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>{cat.name}</div>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            {cat.options.map(opt => {
                              const sel = catSel.includes(opt);
                              return (
                                <button key={opt} onClick={() => {
                                  const next = sel ? catSel.filter(x => x !== opt) : [...catSel, opt];
                                  setCustomisations(p => ({ ...p, [s.name]: { ...p[s.name], [cat.name]: next } }));
                                }} style={{
                                  padding:"5px 10px", borderRadius:100, fontSize:11, fontWeight:600, cursor:"pointer",
                                  background: sel ? "var(--accent-soft)" : "transparent",
                                  border:`1px solid ${sel ? C.accent : C.border}`,
                                  color: sel ? C.accent : C.textSec,
                                }}>{opt}</button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <Btn variant="ghost" onClick={() => setStep(2)} style={{ flex:1, padding:"13px" }}>Back</Btn>
              <Btn onClick={() => setStep(4)} style={{ flex:2, padding:"13px", fontSize:15 }}>Next →</Btn>
            </div>
          </>
        )}

        {/* Step 4 — Career goal */}
        {step === 4 && (
          <>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:13, color:C.textSec, marginBottom:12 }}>What are you aiming for? (optional)</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
                {["Medicine","Law","Engineering","Business","Sciences","Arts & Humanities","Computing","Other"].map(goal => {
                  const sel = careerGoal === goal;
                  return (
                    <button key={goal} onClick={() => setCareerGoal(g => g === goal ? "" : goal)} style={{
                      padding:"12px", borderRadius:12, cursor:"pointer", textAlign:"left",
                      background: sel ? "var(--accent-soft)" : C.surface,
                      border:`2px solid ${sel ? C.accent : C.border}`,
                      fontSize:13, fontWeight:600, color: sel ? C.accent : C.text,
                    }}>{goal}</button>
                  );
                })}
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <Btn variant="ghost" onClick={() => setStep(3)} style={{ flex:1, padding:"13px" }}>Back</Btn>
              <Btn onClick={save} disabled={saving} style={{ flex:2, padding:"13px", fontSize:15 }}>
                {saving ? "Setting up…" : "Start learning →"}
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
