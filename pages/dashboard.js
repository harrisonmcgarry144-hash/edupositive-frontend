import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { analyticsApi, gamificationApi, usersApi, aiApi, flashcardsApi } from "../lib/api";
import { Card, XPBar, Tag, Btn, C, Spinner } from "../components/ui";
import Link from "next/link";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData]         = useState(null);
  const [leaderboard, setLB]    = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [guidance, setGuidance] = useState(null);
  const [daily, setDaily]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [revisingNow, setRevisingNow] = useState(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      analyticsApi.dashboard().catch(() => null),
      gamificationApi.leaderboard("global").catch(() => []),
      usersApi.schedule().catch(() => []),
      aiApi.studyGuidance().catch(() => null),
      flashcardsApi.daily().catch(() => null),
      usersApi.revisingNow().catch(() => null),
    ]).then(([d, lb, sched, g, df, rn]) => {
      setData(d); setLB(lb || []); setSchedule(sched || []); setGuidance(g); setDaily(df); setRevisingNow(rn?.count || null);
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, background: C.bg }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 8, fontFamily: "var(--font-serif)" }}>EduPositive</h1>
      <p style={{ color: C.textSec, marginBottom: 32, textAlign: "center" }}>Sign in to track your progress</p>
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/login"><Btn variant="ghost">Sign In</Btn></Link>
        <Link href="/register"><Btn>Get Started</Btn></Link>
      </div>
    </div>
  );

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={32} /></div>;

  const upcoming = data?.upcomingExams || [];
  const nextExam = upcoming[0];

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(180deg, ${C.surface} 0%, transparent 100%)`,
        padding: "28px 20px 20px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 2 }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "var(--font-serif)" }}>
              Hey, {user.username} {user.role === "admin" && <span style={{ color: C.accent, fontSize: 14 }}>✦ Admin</span>}
            </h1>
          </div>
          <Link href="/settings">
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: "linear-gradient(135deg, var(--accent), #a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, color: "#fff", cursor: "pointer",
            }}>{(user.username || "?").slice(0,2).toUpperCase()}</div>
          </Link>
        </div>
        <XPBar xp={user.xp} level={user.level} />
        {revisingNow && (
          <div style={{ marginTop:12, padding:"8px 14px", borderRadius:100, background:"rgba(34,211,160,0.1)", border:"1px solid rgba(34,211,160,0.2)", display:"inline-flex", alignItems:"center", gap:6 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:C.green, animation:"pulse 2s infinite" }}/>
            <span style={{ fontSize:12, color:C.green, fontWeight:600 }}>{revisingNow.toLocaleString()} people revising right now</span>
          </div>
        )}
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* Stats */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Streak",   value: `${user.streak || 0}🔥`, color: C.amber },
            { label: "XP Today", value: `+${data?.user?.xp ? Math.round((data.user.xp % 500) * 0.1) : 0}`, color: C.green },
            { label: "Memory",   value: `${data?.memory?.overall || 0}%`, color: C.accent },
          ].map(s => (
            <Card key={s.label} style={{ flex: 1, textAlign: "center", padding: "14px 8px" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Daily flashcards */}
        {daily && daily.totalDue > 0 && (
          <Link href="/flashcards?tab=daily" style={{ textDecoration: "none", display: "block", marginBottom: 16 }}>
            <div style={{
              padding: "16px 20px", borderRadius: 14,
              background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(167,139,250,0.1))",
              border: `1px solid var(--accent-glow)`, cursor: "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>🗂 Daily Flashcards</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                  {daily.totalDue} card{daily.totalDue !== 1 ? "s" : ""} due today
                </div>
                <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>
                  {daily.reviewCards > 0 && `${daily.reviewCards} reviews`}
                  {daily.reviewCards > 0 && daily.newCards > 0 && " · "}
                  {daily.newCards > 0 && `${daily.newCards} new`}
                  {" · "}{daily.estimatedMins} min
                </div>
              </div>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: C.accent, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>🗂</div>
            </div>
          </Link>
        )}

        {/* Next exam */}
        {nextExam && (
          <Card style={{ marginBottom: 16, background: "linear-gradient(135deg, var(--accent-soft), var(--surface-high))", glow: true }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Tag>Upcoming Exam</Tag>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: 8 }}>
                  {nextExam.paper_name || nextExam.subject_name}
                </div>
                <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>
                  {new Date(nextExam.exam_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: C.accent }}>{nextExam.days_until}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>days left</div>
              </div>
            </div>
          </Card>
        )}

        {/* AI guidance */}
        {guidance && (
          <Card style={{ marginBottom: 20, borderColor: "var(--accent-glow)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>✦ AI Study Guidance</div>
            <p style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 6 }}>{guidance.todayFocus}</p>
            <p style={{ fontSize: 13, color: C.textSec }}>{guidance.encouragement}</p>
            {guidance.estimatedTime && (
              <div style={{ marginTop: 8 }}>
                <Tag color={C.amber}>⏱ {guidance.estimatedTime}</Tag>
              </div>
            )}
          </Card>
        )}

        {/* Today's flashcards by subject */}
        {daily && daily.totalDue > 0 && Object.keys(daily.bySubject || {}).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>Today's Flashcards by Subject</div>
            {Object.entries(daily.bySubject).map(([subject, cards]) => (
              <div key={subject} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", borderRadius: 12,
                background: C.surface, border: `1px solid ${C.border}`, marginBottom: 8,
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{subject}</div>
                <Tag color={C.accent}>{cards.length} cards</Tag>
              </div>
            ))}
            <Link href="/flashcards?tab=daily">
              <Btn style={{ width: "100%", padding: "12px", marginTop: 4 }}>Start Today's Review →</Btn>
            </Link>
          </div>
        )}

        {/* Today's schedule */}
        {schedule.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>Today's Plan</div>
            {schedule.slice(0, 4).map((item) => (
              <div key={item.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 12,
                background: item.completed ? "rgba(34,211,160,0.08)" : "var(--surface-high)",
                border: `1px solid ${item.completed ? "rgba(34,211,160,0.3)" : C.border}`,
                marginBottom: 8,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: item.completed ? C.green : "transparent",
                  border: `2px solid ${item.completed ? C.green : C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: "#fff", flexShrink: 0,
                }}>{item.completed ? "✓" : ""}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: item.completed ? C.textMuted : C.text }}>{item.subtopic_name}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{item.subject_name} · {item.duration_mins} min</div>
                </div>
                <Tag color={C.amber}>{item.priority >= 8 ? "High" : "Normal"}</Tag>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>Leaderboard</div>
            <Card>
              {leaderboard.slice(0, 5).map((u, i) => (
                <div key={u.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 8px",
                  background: u.isMe ? "var(--accent-soft)" : "transparent",
                  borderRadius: u.isMe ? 8 : 0,
                  borderBottom: i < 4 ? `1px solid ${C.border}` : "none",
                }}>
                  <div style={{ width: 20, fontSize: 13, fontWeight: 700, color: ["#f59e0b","#94a3b8","#cd7f32"][i] || C.textMuted, textAlign: "center" }}>
                    {i + 1}
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: u.isMe ? C.accent : "var(--surface-high)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: u.isMe ? "#fff" : C.textSec,
                  }}>{(u.username || "?").slice(0,2).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: u.isMe ? C.accent : C.text }}>{u.username}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{u.streak}🔥</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.textSec }}>{u.xp?.toLocaleString()}</div>
                </div>
              ))}
            </Card>
          </div>
        )}
{/* Bawdu Board widget */}
        <Link href="/bawdu" style={{ textDecoration: "none", display: "block", marginBottom: 16 }}>
          <div style={{ padding: "16px 20px", borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>Bawdu Board</div>
              <div style={{ fontSize: 12, color: C.textSec }}>Play chess vs computer</div>
            </div>
            <div style={{ fontSize: 32 }}>♞</div>
          </div>
        </Link>
        {/* Admin panel */}
        {user.role === "admin" && (
          <Card glow style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>✦ Admin Controls</div>
            <p style={{ fontSize: 13, color: C.textSec, marginBottom: 12 }}>Full editorial access enabled.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href="/admin"><Btn variant="ghost" style={{ fontSize: 12, padding: "8px 14px" }}>Admin Panel</Btn></Link>
              <Link href="/admin/upload-papers"><Btn variant="ghost" style={{ fontSize: 12, padding: "8px 14px" }}>Upload Papers</Btn></Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
