import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { generateApi } from "../lib/api";
import { C } from "../components/ui";

export default function Generating() {
  const router = useRouter();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [overall, setOverall] = useState({ done: 0, total: 0 });
  const [currentSubject, setCurrentSubject] = useState("");
  const [allDone, setAllDone] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    startGeneration();
    return () => clearInterval(pollRef.current);
  }, [user]);

  const startGeneration = async () => {
    try {
      const statuses = await generateApi.userSubjectsStatus();
      setSubjects(statuses);

      // Start generation for any not yet started
      for (const s of statuses) {
        if (s.status !== 'complete') {
          await generateApi.start(s.subjectId, s.board).catch(() => {});
        }
      }

      // Poll for progress
      pollRef.current = setInterval(async () => {
        const updated = await generateApi.userSubjectsStatus().catch(() => statuses);
        setSubjects(updated);

        const totalAll = updated.reduce((a, s) => a + (s.total || 0), 0);
        const doneAll = updated.reduce((a, s) => a + (s.progress || 0), 0);
        setOverall({ done: doneAll, total: totalAll });

        const current = updated.find(s => s.status === 'running');
        if (current) setCurrentSubject(current.name);

        const allComplete = updated.every(s => s.status === 'complete');
        if (allComplete) {
          clearInterval(pollRef.current);
          setAllDone(true);
          setTimeout(() => router.replace('/dashboard'), 2000);
        }
      }, 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const pct = overall.total > 0 ? Math.round((overall.done / overall.total) * 100) : 0;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 32,
      background: C.bg, textAlign: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 8, fontFamily: "var(--font-serif)" }}>
          {allDone ? "Your lessons are ready!" : "Building your lessons…"}
        </h1>
        <p style={{ fontSize: 14, color: C.textSec, marginBottom: 32, lineHeight: 1.6 }}>
          {allDone
            ? "Everything is set up. Taking you to your dashboard now."
            : "We're generating personalised lessons for your subjects. This only happens once — future students get instant access."
          }
        </p>

        {/* Overall progress bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.textSec }}>
              {allDone ? "Complete!" : currentSubject ? `Generating ${currentSubject}…` : "Starting…"}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: "var(--surface-high)", borderRadius: 100, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 100,
              background: allDone ? C.green : `linear-gradient(90deg, var(--accent), #a78bfa)`,
              width: `${pct}%`,
              transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>
            {overall.done} of {overall.total} lessons generated
          </div>
        </div>

        {/* Per-subject progress */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {subjects.map(s => {
            const sPct = s.total > 0 ? Math.round((s.progress / s.total) * 100) : 0;
            return (
              <div key={s.subjectId} style={{
                padding: "14px 16px", borderRadius: 12,
                background: C.surface, border: `1px solid ${s.status === 'complete' ? C.green : C.border}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{s.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{s.board}</span>
                    {s.status === 'complete'
                      ? <span style={{ fontSize: 14, color: C.green }}>✓</span>
                      : s.status === 'running'
                      ? <div style={{ width: 14, height: 14, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      : <span style={{ fontSize: 11, color: C.textMuted }}>Queued</span>
                    }
                  </div>
                </div>
                <div style={{ height: 4, background: "var(--surface-high)", borderRadius: 100, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 100,
                    background: s.status === 'complete' ? C.green : C.accent,
                    width: `${sPct}%`, transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 12, color: C.textMuted, marginTop: 24 }}>
          Please don't close this page. This usually takes 2-5 minutes.
        </p>
      </div>
    </div>
  );
}
