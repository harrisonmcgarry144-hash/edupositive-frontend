import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { contentApi, authApi } from "../lib/api";
import { Btn, Pill, C } from "../components/ui";

const CAREERS = ["Medicine","Law","Engineering","Architecture","Finance","Teaching","Research","Technology","Design","Other"];

export default function Onboarding() {
  const [step, setStep]         = useState(0);
  const [levelType, setLevel]   = useState("");
  const [subjects, setSubjects] = useState([]);
  const [allSubjects, setAll]   = useState([]);
  const [career, setCareer]     = useState("");
  const [loading, setLoading]   = useState(false);
  const { user, updateUser }    = useAuth();
  const router = useRouter();
useEffect(() => {
  if (user?.role === "admin") router.replace("/dashboard");
}, [user]);
  useEffect(() => {
    contentApi.subjects().then(setAll).catch(() => {});
  }, []);

  const filteredSubjects = levelType ? allSubjects.filter(s => !s.level_type || s.level_type === levelType) : allSubjects;
  const toggle = id => setSubjects(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const finish = async () => {
    setLoading(true);
    try {
      await authApi.onboarding({ levelType, subjectIds: subjects, careerGoal: career });
      updateUser({ level_type: levelType, career_goal: career });
      router.replace("/dashboard");
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const steps = [
    {
      title: "What are you studying?",
      sub: "Choose your qualification level",
      canNext: !!levelType,
      content: (
        <div style={{ display: "flex", gap: 12 }}>
          {["gcse", "a-level"].map(l => (
            <button key={l} onClick={() => setLevel(l)} style={{
              flex: 1, padding: "20px 16px", borderRadius: 14,
              border: `2px solid ${levelType === l ? C.accent : C.border}`,
              background: levelType === l ? "var(--accent-soft)" : C.surface,
              color: levelType === l ? C.accent : C.text,
              fontSize: 16, fontWeight: 700, cursor: "pointer", textTransform: "uppercase",
            }}>{l}</button>
          ))}
        </div>
      ),
    },
    {
      title: "Your subjects",
      sub: "Select all the subjects you study",
      canNext: subjects.length > 0,
      content: (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {filteredSubjects.map(s => (
            <Pill key={s.id} active={subjects.includes(s.id)} onClick={() => toggle(s.id)}>
              {s.icon} {s.name}
            </Pill>
          ))}
          {!filteredSubjects.length && (
            <p style={{ color: C.textSec, fontSize: 14 }}>No subjects found — they'll be added soon!</p>
          )}
        </div>
      ),
    },
    {
      title: "Future aspirations",
      sub: "Optional — helps personalise your learning path",
      canNext: true,
      content: (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CAREERS.map(c => (
            <Pill key={c} active={career === c} onClick={() => setCareer(career === c ? "" : c)}>{c}</Pill>
          ))}
        </div>
      ),
    },
  ];

  const s = steps[step];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: 28, display: "flex", flexDirection: "column" }}>
      {/* Progress */}
      <div style={{ display: "flex", gap: 6, marginBottom: 40 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 100,
            background: i <= step ? C.accent : C.border, transition: "background 0.3s",
          }} />
        ))}
      </div>

      <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 6, fontFamily: "var(--font-serif)" }}>
        {s.title}
      </h2>
      <p style={{ color: C.textSec, fontSize: 14, marginBottom: 28 }}>{s.sub}</p>

      <div style={{ flex: 1 }}>{s.content}</div>

      <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
        {step > 0 && (
          <Btn variant="ghost" onClick={() => setStep(step - 1)} style={{ flex: 1, padding: "14px" }}>Back</Btn>
        )}
        <Btn
          onClick={step < steps.length - 1 ? () => setStep(step + 1) : finish}
          disabled={!s.canNext || loading}
          style={{ flex: 1, padding: "14px", fontSize: 15 }}
        >
          {loading ? "Saving…" : step < steps.length - 1 ? "Continue →" : "Start learning ✦"}
        </Btn>
      </div>
    </div>
  );
}
