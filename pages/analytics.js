import { useState, useEffect } from "react";
import { C, Spinner } from "../components/ui";
import PremiumGate from "../components/PremiumGate";
import { paymentsApi } from "../lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || 'https://edupositive-backend.onrender.com';

async function fetchAnalytics() {
  const token = localStorage.getItem('ep_token');
  const res = await fetch(`${API}/api/analytics/advanced`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

export default function Analytics() {
  const [isPremium, setIsPremium] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentsApi.status().then(s => {
      setIsPremium(s.isPremium);
      if (s.isPremium) {
        fetchAnalytics().then(setData).catch(() => {}).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (isPremium === false) return <PremiumGate feature="Advanced Analytics" icon="📊" />;
  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner /></div>;
  if (!data) return <div style={{ padding:40, color:C.textSec }}>Couldn't load analytics.</div>;

  const { totals, streakInfo, dailyStudy, xpGrowth, subjectPerf, weakAreas, strongAreas, examAttempts, bestHour } = data;

  return (
    <div style={{ padding:"20px 16px 100px", maxWidth:900, margin:"0 auto" }}>
      <div style={{ fontSize:11, color:C.accent, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>✦ Premium</div>
      <h1 style={{ fontSize:28, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>Advanced Analytics</h1>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:24 }}>Deep insights into your study patterns and performance</p>

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:10, marginBottom:24 }}>
        <StatCard label="Total Study Time" value={`${Math.round((totals?.total_minutes || 0) / 60)}h`} icon="⏱" color="#6c63ff" />
        <StatCard label="Lessons Done" value={totals?.lessons_done || 0} icon="📖" color="#22d3a0" />
        <StatCard label="Flashcards Reviewed" value={totals?.flashcards_reviewed || 0} icon="🗂" color="#f59e0b" />
        <StatCard label="AI Chats" value={totals?.ai_chats || 0} icon="💬" color="#a78bfa" />
        <StatCard label="Pomodoros" value={totals?.pomodoros || 0} icon="🍅" color="#ef4444" />
        <StatCard label="Current Streak" value={`${streakInfo?.streak || 0}🔥`} icon="" color="#f97316" />
      </div>

      {/* Best study hour insight */}
      {bestHour && (
        <div style={{ padding:"16px 18px", borderRadius:14, background:"var(--accent-soft)", border:`1px solid var(--accent-glow)`, marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.accent, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>💡 Insight</div>
          <div style={{ fontSize:14, color:C.text, lineHeight:1.6 }}>
            You study best at <strong style={{ color: C.accent }}>{bestHour.hour}:00</strong>. You earn the most XP at this hour of the day.
          </div>
        </div>
      )}

      {/* Study time chart */}
      {dailyStudy?.length > 0 && (
        <Section title="Study Time (Last 30 Days)">
          <BarChart data={dailyStudy.map(d => ({ label: new Date(d.date).toLocaleDateString('en-GB', { day:'numeric', month:'short' }), value: d.minutes }))} unit="min" color="#6c63ff" />
        </Section>
      )}

      {/* XP growth */}
      {xpGrowth?.length > 0 && (
        <Section title="XP Earned (Last 30 Days)">
          <BarChart data={xpGrowth.map(d => ({ label: new Date(d.date).toLocaleDateString('en-GB', { day:'numeric', month:'short' }), value: d.xp }))} unit="XP" color="#22d3a0" />
        </Section>
      )}

      {/* Subject performance */}
      {subjectPerf?.length > 0 && (
        <Section title="Subject Performance">
          {subjectPerf.map(s => (
            <div key={s.subject} style={{ padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{s.subject}</div>
                <div style={{ fontSize:13, fontWeight:700, color: s.avg_score >= 70 ? C.green : s.avg_score >= 40 ? C.amber : C.red }}>
                  {s.avg_score}%
                </div>
              </div>
              <div style={{ height:6, background:"var(--surface-high)", borderRadius:100, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:100, background: s.avg_score >= 70 ? C.green : s.avg_score >= 40 ? "#f59e0b" : C.red, width:`${s.avg_score}%`, transition:"width 0.5s" }} />
              </div>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>{s.topics_studied} subtopics studied</div>
            </div>
          ))}
        </Section>
      )}

      {/* Weak areas */}
      {weakAreas?.length > 0 && (
        <Section title="⚠ Focus Areas" color={C.red}>
          {weakAreas.map((w, i) => (
            <div key={i} style={{ padding:"10px 0", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{w.subtopic}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>{w.subject} · {w.topic}</div>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:C.red }}>{w.score}%</div>
            </div>
          ))}
        </Section>
      )}

      {/* Strong areas */}
      {strongAreas?.length > 0 && (
        <Section title="✓ Strong Areas" color={C.green}>
          {strongAreas.map((w, i) => (
            <div key={i} style={{ padding:"10px 0", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{w.subtopic}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>{w.subject} · {w.topic}</div>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:C.green }}>{w.score}%</div>
            </div>
          ))}
        </Section>
      )}

      {/* Exam history */}
      {examAttempts?.length > 0 && (
        <Section title="Recent Exam Attempts">
          {examAttempts.map((e, i) => (
            <div key={i} style={{ padding:"10px 0", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{e.title}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>{new Date(e.submitted_at).toLocaleDateString('en-GB')}</div>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{e.total_score}</div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ padding:"14px 16px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
        {icon && <span style={{ fontSize:14 }}>{icon}</span>}
        <span style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>{label}</span>
      </div>
      <div style={{ fontSize:22, fontWeight:900, color, fontFamily:"var(--font-serif)" }}>{value}</div>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom:20, padding:"16px 18px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}` }}>
      <div style={{ fontSize:13, fontWeight:700, color: color || C.text, marginBottom:10 }}>{title}</div>
      {children}
    </div>
  );
}

function BarChart({ data, unit, color }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:120, padding:"8px 0", overflowX:"auto" }}>
      {data.map((d, i) => {
        const h = (d.value / max) * 100;
        return (
          <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, minWidth:18 }}>
            <div title={`${d.label}: ${d.value} ${unit}`} style={{
              width:14, height:`${Math.max(h, 2)}%`,
              background: color, borderRadius:3,
              transition:"height 0.5s",
            }} />
          </div>
        );
      })}
    </div>
  );
}
