import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { analyticsApi } from "../lib/api";
import { Card, ProgressBar, C, Spinner, Empty, Btn, Input } from "../components/ui";
import Link from "next/link";

export default function Analytics() {
  const { user }          = useAuth();
  const [data, setData]   = useState(null);
  const [xp, setXP]       = useState([]);
  const [loading, setLoad]= useState(true);
  const [target, setTgt]  = useState("");
  const [roadmap, setRmap]= useState(null);
  const [calcing, setCalc]= useState(false);

  useEffect(() => {
    if (!user) { setLoad(false); return; }
    Promise.all([
      analyticsApi.dashboard().catch(()=>null),
      analyticsApi.xpHistory().catch(()=>[]),
    ]).then(([d,x]) => { setData(d); setXP(x||[]); }).finally(()=>setLoad(false));
  }, [user]);

  const calcTarget = async () => {
    if (!target) return;
    setCalc(true);
    const res = await analyticsApi.targetGrade({ targetGrade: target }).catch(()=>null);
    setRmap(res); setCalc(false);
  };

  if (!user) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32 }}>
      <p style={{ color:C.textSec, marginBottom:16 }}>Sign in to view analytics</p>
      <Link href="/login"><Btn>Sign In</Btn></Link>
    </div>
  );

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;

  const memory  = data?.memory || {};
  const strong  = memory.strong || [];
  const weak    = memory.weak || [];

  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <h1 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>Analytics</h1>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:24 }}>Track your progress and identify weak areas</p>

      {/* Overview */}
      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        {[
          { label:"Memory", value:`${memory.overall||0}%`, color:C.accent },
          { label:"Exams", value:data?.exams?.total||0, color:C.green },
          { label:"Avg Score", value:data?.exams?.avg_score ? `${data.exams.avg_score}%` : "—", color:C.amber },
        ].map(s => (
          <Card key={s.label} style={{ flex:1, textAlign:"center", padding:"14px 8px" }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, marginBottom:2 }}>{s.value}</div>
            <div style={{ fontSize:11, color:C.textMuted }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* XP chart */}
      {xp.length > 0 && (
        <Card style={{ marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.textSec, marginBottom:14 }}>XP Last 14 Days</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:60 }}>
            {xp.slice(0,14).reverse().map((d,i) => {
              const max = Math.max(...xp.map(x=>x.xp_earned));
              const h   = max > 0 ? Math.max(4, (d.xp_earned/max)*60) : 4;
              return (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ width:"100%", height:h, borderRadius:4, background:C.accent, opacity:0.7+i/20 }} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Weak areas */}
      {weak.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:12, letterSpacing:"0.08em", textTransform:"uppercase" }}>⚠️ Weak Areas</div>
          <Card>
            {weak.slice(0,5).map((item, i) => (
              <div key={i} style={{ marginBottom: i < weak.length-1 ? 14 : 0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:13, color:C.text }}>{item.subtopic}</span>
                  <span style={{ fontSize:12, color:C.red, fontWeight:700 }}>{Math.round(item.score)}%</span>
                </div>
                <ProgressBar value={item.score} color={C.red} />
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Strong areas */}
      {strong.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:12, letterSpacing:"0.08em", textTransform:"uppercase" }}>✅ Strong Areas</div>
          <Card>
            {strong.slice(0,5).map((item, i) => (
              <div key={i} style={{ marginBottom: i < strong.length-1 ? 14 : 0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:13, color:C.text }}>{item.subtopic}</span>
                  <span style={{ fontSize:12, color:C.green, fontWeight:700 }}>{Math.round(item.score)}%</span>
                </div>
                <ProgressBar value={item.score} color={C.green} />
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Target grade */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:12, letterSpacing:"0.08em", textTransform:"uppercase" }}>🎯 Target Grade</div>
        <Card>
          <div style={{ display:"flex", gap:10, marginBottom:roadmap?16:0 }}>
            <select value={target} onChange={e => setTarget(e.target.value)} style={{ flex:1, padding:"11px 14px", background:"var(--surface-high)", border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14 }}>
              <option value="">Select target grade…</option>
              {["A*","A","B","C","9","8","7","6","5"].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <Btn onClick={calcTarget} disabled={!target||calcing} style={{ padding:"11px 20px" }}>
              {calcing ? "…" : "Calculate"}
            </Btn>
          </div>

          {roadmap && (
            <div style={{ paddingTop:16, borderTop:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", gap:10, marginBottom:12 }}>
                <div style={{ flex:1, textAlign:"center", padding:"12px 8px", background:"var(--surface-high)", borderRadius:10 }}>
                  <div style={{ fontSize:20, fontWeight:800, color:C.accent }}>{roadmap.currentEstimate}%</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>Current</div>
                </div>
                <div style={{ flex:1, textAlign:"center", padding:"12px 8px", background:"var(--surface-high)", borderRadius:10 }}>
                  <div style={{ fontSize:20, fontWeight:800, color:C.amber }}>{roadmap.required}%</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>Needed</div>
                </div>
                <div style={{ flex:1, textAlign:"center", padding:"12px 8px", background:"var(--surface-high)", borderRadius:10 }}>
                  <div style={{ fontSize:20, fontWeight:800, color:roadmap.onTrack?C.green:C.red }}>{roadmap.onTrack?"✓":"✗"}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>On track</div>
                </div>
              </div>
              <p style={{ fontSize:13, color:C.textSec, lineHeight:1.6 }}>{roadmap.roadmap}</p>
              {roadmap.priorityTopics?.length > 0 && (
                <div style={{ marginTop:12 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:8 }}>FOCUS ON:</div>
                  {roadmap.priorityTopics.map((t,i) => (
                    <div key={i} style={{ padding:"8px 12px", background:"rgba(239,68,68,0.08)", borderRadius:8, marginBottom:4, fontSize:13, color:C.text, borderLeft:`3px solid ${C.red}` }}>
                      {t.name} — {Math.round(t.score)}%
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
