import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { paymentsApi } from "../lib/api";
import PremiumGate from "../components/PremiumGate";
import { C, Btn, Spinner } from "../components/ui";

const API = process.env.NEXT_PUBLIC_API_URL || 'https://edupositive-backend.onrender.com';

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('ep_token');
  const res = await fetch(`${API}${path}`, {
    ...opts, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(opts.headers||{}) }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed');
  return res.json();
}

const TYPE_ICONS = { book:"📚", website:"🌐", video:"🎥", course:"🎓", competition:"🏆", podcast:"🎙️" };
const DIFF_COLORS = { easy:"#22d3a0", medium:"#f59e0b", hard:"#ef4444" };
const IMPACT_COLORS = { high:"#22d3a0", medium:"#f59e0b", low:C?.textMuted||"#888" };

export default function SuperCurricular() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedGuides, setSavedGuides] = useState([]);
  const [activeTab, setActiveTab] = useState("steps");
  const [customActivity, setCustomActivity] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    paymentsApi.status()
      .then(d => { setIsPremium(d.isPremium || user?.role === 'admin'); })
      .catch(() => setIsPremium(false));
    apiFetch('/api/supercurricular/activities').then(setActivities).catch(() => {});
    apiFetch('/api/supercurricular/saved').then(setSavedGuides).catch(() => {});
  }, []);

  const generate = async (activity) => {
    setSelected(activity);
    setGuide(null);
    setLoading(true);
    setActiveTab("steps");
    try {
      const subjects = user?.subjects?.map(s => s.name) || [];
      const g = await apiFetch('/api/supercurricular/generate', {
        method: 'POST',
        body: JSON.stringify({ activity, subjects, careerGoal: user?.career_goal })
      });
      setGuide(g);
      setSavedGuides(p => { const filtered = p.filter(x => x.activity !== activity); return [{ activity, updated_at: new Date() }, ...filtered]; });
    } catch(e) { alert("Failed to generate guide. Try again."); }
    setLoading(false);
  };

  const loadSaved = async (activity) => {
    setSelected(activity);
    setGuide(null);
    setLoading(true);
    try {
      const g = await apiFetch(`/api/supercurricular/saved/${encodeURIComponent(activity)}`);
      setGuide(g);
    } catch(e) { await generate(activity); return; }
    setLoading(false);
  };

  if (isPremium === null) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;
  if (!isPremium) return <PremiumGate feature="Super Curricular" icon="🌍" />;

  if (guide && selected) return <GuideView guide={guide} activity={selected} activeTab={activeTab} setActiveTab={setActiveTab} onBack={() => { setGuide(null); setSelected(null); }} onRegenerate={() => generate(selected)} />;

  if (loading) return (
    <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:40, textAlign:"center" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🚀</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:8 }}>Building your guide…</h2>
      <p style={{ fontSize:14, color:C.textSec, marginBottom:24, maxWidth:400 }}>Creating a comprehensive, personalised super-curricular roadmap for <strong style={{ color:C.accent }}>{selected}</strong>. This takes about 30 seconds.</p>
      <Spinner size={32} />
    </div>
  );

  return (
    <div style={{ padding:"20px 16px 100px", maxWidth:800, margin:"0 auto" }}>
      <div style={{ fontSize:11, color:C.accent, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>✦ Premium</div>
      <h1 style={{ fontSize:28, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>Super Curricular</h1>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:24 }}>AI-generated roadmaps for getting into your chosen field — step by step, with real resources.</p>

      {/* Saved guides */}
      {savedGuides.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Your Guides</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {savedGuides.map(g => {
              const act = activities.find(a => a.id === g.activity);
              return (
                <button key={g.activity} onClick={() => loadSaved(g.activity)} style={{
                  padding:"10px 16px", borderRadius:12, background:C.surface, border:`1px solid ${C.accent}`,
                  cursor:"pointer", fontSize:13, fontWeight:600, color:C.accent, display:"flex", alignItems:"center", gap:6,
                }}>
                  {act?.icon || '📋'} {g.activity}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity grid */}
      <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>Choose a field</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:10, marginBottom:16 }}>
        {activities.map(a => (
          <button key={a.id} onClick={() => generate(a.id)} style={{
            padding:"16px 14px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`,
            cursor:"pointer", textAlign:"left", transition:"all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = "var(--accent-soft)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{a.icon}</div>
            <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>{a.id}</div>
            <div style={{ fontSize:11, color:C.textMuted }}>{a.desc}</div>
          </button>
        ))}
      </div>

      {/* Custom activity */}
      {!showCustom ? (
        <button onClick={() => setShowCustom(true)} style={{ padding:"12px 20px", borderRadius:12, background:"transparent", border:`1px dashed ${C.border}`, color:C.textSec, fontSize:13, cursor:"pointer", width:"100%" }}>
          + My field isn't listed — enter it
        </button>
      ) : (
        <div style={{ display:"flex", gap:8 }}>
          <input value={customActivity} onChange={e => setCustomActivity(e.target.value)} placeholder="e.g. Classics, Anthropology, Nursing…"
            style={{ flex:1, padding:"12px 14px", borderRadius:12, background:C.surface, border:`1px solid ${C.border}`, color:C.text, fontSize:14, outline:"none" }} />
          <Btn onClick={() => { if (customActivity.trim()) generate(customActivity.trim()); }} disabled={!customActivity.trim()} style={{ padding:"12px 20px" }}>Generate →</Btn>
        </div>
      )}
    </div>
  );
}

// ── GUIDE VIEW ────────────────────────────────────────────────────────────────
function GuideView({ guide, activity, activeTab, setActiveTab, onBack, onRegenerate }) {
  const TABS = [
    { id:"steps", label:"🗺 Roadmap" },
    { id:"timeline", label:"📅 Timeline" },
    { id:"resources", label:"📚 Resources" },
    { id:"competitions", label:"🏆 Competitions" },
    { id:"experience", label:"💼 Experience" },
    { id:"statement", label:"✍️ Personal Statement" },
    { id:"tips", label:"💬 Student Tips" },
  ];

  return (
    <div style={{ padding:"0 0 100px" }}>
      {/* Header */}
      <div style={{ padding:"16px 16px 0", maxWidth:800, margin:"0 auto" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.accent, fontSize:13, cursor:"pointer", marginBottom:12 }}>← Back</button>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <h1 style={{ fontSize:26, fontWeight:800, color:C.text, margin:0, fontFamily:"var(--font-serif)" }}>{activity}</h1>
            <p style={{ fontSize:13, color:C.textSec, marginTop:4, maxWidth:500 }}>{guide.overview}</p>
          </div>
          <button onClick={onRegenerate} style={{ padding:"8px 14px", borderRadius:10, background:"transparent", border:`1px solid ${C.border}`, color:C.textSec, fontSize:12, cursor:"pointer", flexShrink:0 }}>🔄 Refresh</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:0, overflowX:"auto", borderBottom:`1px solid ${C.border}`, padding:"0 16px" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding:"12px 14px", background:"none", border:"none",
            borderBottom:`2px solid ${activeTab === t.id ? C.accent : "transparent"}`,
            color: activeTab === t.id ? C.accent : C.textSec,
            fontSize:12, fontWeight: activeTab === t.id ? 700 : 500, cursor:"pointer",
            marginBottom:-1, whiteSpace:"nowrap",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding:"20px 16px", maxWidth:800, margin:"0 auto" }}>

        {/* ROADMAP */}
        {activeTab === "steps" && (
          <div>
            {(guide.steps||[]).map((step, i) => (
              <StepCard key={i} step={step} index={i} />
            ))}
            {guide.commonMistakes?.length > 0 && (
              <div style={{ padding:"16px 18px", borderRadius:14, background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", marginTop:20 }}>
                <div style={{ fontSize:12, fontWeight:800, color:"#ef4444", textTransform:"uppercase", marginBottom:10 }}>⚠ Common Mistakes to Avoid</div>
                {guide.commonMistakes.map((m, i) => <div key={i} style={{ fontSize:13, color:C.text, marginBottom:6, display:"flex", gap:8 }}><span>•</span><span>{m}</span></div>)}
              </div>
            )}
            {guide.uniqueIdeas?.length > 0 && (
              <div style={{ padding:"16px 18px", borderRadius:14, background:"rgba(108,99,255,0.06)", border:"1px solid rgba(108,99,255,0.2)", marginTop:12 }}>
                <div style={{ fontSize:12, fontWeight:800, color:C.accent, textTransform:"uppercase", marginBottom:10 }}>💡 Standout Ideas</div>
                {guide.uniqueIdeas.map((u, i) => <div key={i} style={{ fontSize:13, color:C.text, marginBottom:6, display:"flex", gap:8 }}><span>✦</span><span>{u}</span></div>)}
              </div>
            )}
          </div>
        )}

        {/* TIMELINE */}
        {activeTab === "timeline" && guide.timeline && (
          <div>
            {[
              { key:"year12", label:"Year 12", color:"#6c63ff" },
              { key:"year13_autumn", label:"Year 13 — Autumn", color:"#f59e0b" },
              { key:"year13_spring", label:"Year 13 — Spring/Summer", color:"#22d3a0" },
            ].map(period => (
              <div key={period.key} style={{ marginBottom:24 }}>
                <div style={{ fontSize:14, fontWeight:800, color:period.color, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:12, height:12, borderRadius:"50%", background:period.color }} />
                  {period.label}
                </div>
                {(guide.timeline[period.key]||[]).map((item, i) => (
                  <div key={i} style={{ display:"flex", gap:12, marginBottom:10, paddingLeft:10, borderLeft:`2px solid ${period.color}33` }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:`${period.color}22`, border:`1px solid ${period.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:period.color, flexShrink:0 }}>{i+1}</div>
                    <div style={{ fontSize:13, color:C.text, lineHeight:1.6, paddingTop:3 }}>{item}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* RESOURCES */}
        {activeTab === "resources" && (
          <div>
            {guide.reading?.length > 0 && (
              <Section title="📚 Essential Reading">
                {guide.reading.map((b, i) => (
                  <div key={i} style={{ padding:"14px 16px", borderRadius:12, background:C.surface, border:`1px solid ${C.border}`, marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:2 }}>{b.title}</div>
                        <div style={{ fontSize:12, color:C.textSec, marginBottom:4 }}>by {b.author}</div>
                        <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.5 }}>{b.why}</div>
                      </div>
                      <span style={{ padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:700, background:`${DIFF_COLORS[b.difficulty]||C.accent}22`, color:DIFF_COLORS[b.difficulty]||C.accent, flexShrink:0 }}>{b.difficulty}</span>
                    </div>
                  </div>
                ))}
              </Section>
            )}
            {guide.onlineCourses?.length > 0 && (
              <Section title="🎓 Online Courses">
                {guide.onlineCourses.map((c, i) => (
                  <ResourceCard key={i} title={c.name} subtitle={`${c.provider} · ${c.duration}`} description={c.why} url={c.url} free={c.free} type="course" />
                ))}
              </Section>
            )}
            {guide.podcasts?.length > 0 && (
              <Section title="🎙️ Podcasts">
                {guide.podcasts.map((p, i) => (
                  <ResourceCard key={i} title={p.name} subtitle={p.platform} description={p.why} url={p.url} type="podcast" />
                ))}
              </Section>
            )}
            {guide.journals?.length > 0 && (
              <Section title="📰 Journals & Publications">
                {guide.journals.map((j, i) => (
                  <ResourceCard key={i} title={j.name} description={j.why} url={j.url} free={j.free} type="website" />
                ))}
              </Section>
            )}
          </div>
        )}

        {/* COMPETITIONS */}
        {activeTab === "competitions" && (
          <div>
            {(guide.competitions||[]).map((comp, i) => (
              <div key={i} style={{ padding:"16px 18px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{comp.name}</div>
                  <div style={{ display:"flex", gap:6 }}>
                    <span style={{ padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:700, background:`${DIFF_COLORS[comp.difficulty]||C.accent}22`, color:DIFF_COLORS[comp.difficulty]||C.accent }}>{comp.difficulty}</span>
                    <span style={{ padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:700, background:"rgba(245,158,11,0.12)", color:"#f59e0b" }}>{comp.prestige} prestige</span>
                  </div>
                </div>
                <div style={{ fontSize:13, color:C.textSec, marginBottom:8, lineHeight:1.5 }}>{comp.description}</div>
                {comp.deadline && <div style={{ fontSize:12, color:C.textMuted, marginBottom:6 }}>📅 Typical deadline: {comp.deadline}</div>}
                {comp.how_to_prepare && (
                  <div style={{ padding:"10px 12px", borderRadius:8, background:"var(--surface-high)", marginBottom:10 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.accent, marginBottom:4 }}>HOW TO PREPARE</div>
                    <div style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>{comp.how_to_prepare}</div>
                  </div>
                )}
                {comp.url && <a href={comp.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:13, color:C.accent, fontWeight:600 }}>Visit website →</a>}
              </div>
            ))}
          </div>
        )}

        {/* WORK EXPERIENCE */}
        {activeTab === "experience" && (
          <div>
            {(guide.workExperience||[]).map((exp, i) => (
              <div key={i} style={{ padding:"16px 18px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, marginBottom:12 }}>
                <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:6 }}>{exp.type}</div>
                <div style={{ fontSize:13, color:C.textSec, marginBottom:8 }}>{exp.how}</div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:10 }}>
                  {exp.where && <span style={{ fontSize:12, color:C.textMuted }}>📍 {exp.where}</span>}
                  {exp.when && <span style={{ fontSize:12, color:C.textMuted }}>📅 {exp.when}</span>}
                </div>
                {exp.what_to_say && (
                  <div style={{ padding:"10px 12px", borderRadius:8, background:"rgba(34,211,160,0.06)", border:"1px solid rgba(34,211,160,0.2)" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.green, marginBottom:4 }}>EMAIL OPENER TEMPLATE</div>
                    <div style={{ fontSize:13, color:C.text, lineHeight:1.5, fontStyle:"italic" }}>"{exp.what_to_say}"</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PERSONAL STATEMENT */}
        {activeTab === "statement" && guide.personalStatement && (
          <div>
            {guide.personalStatement.topUniversities?.length > 0 && (
              <div style={{ padding:"14px 16px", borderRadius:12, background:"var(--accent-soft)", border:`1px solid var(--accent-glow)`, marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:800, color:C.accent, textTransform:"uppercase", marginBottom:8 }}>Top Universities</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {guide.personalStatement.topUniversities.map((u, i) => (
                    <span key={i} style={{ padding:"4px 10px", borderRadius:8, background:C.surface, fontSize:13, color:C.text, border:`1px solid ${C.border}` }}>{u}</span>
                  ))}
                </div>
              </div>
            )}
            {guide.personalStatement.keyThemes?.length > 0 && (
              <div style={{ padding:"14px 16px", borderRadius:12, background:C.surface, border:`1px solid ${C.border}`, marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:8 }}>Key Themes to Cover</div>
                {guide.personalStatement.keyThemes.map((t, i) => <div key={i} style={{ fontSize:13, color:C.text, marginBottom:5, display:"flex", gap:8 }}><span style={{ color:C.accent }}>✦</span><span>{t}</span></div>)}
              </div>
            )}
            {guide.personalStatement.openingIdeas?.length > 0 && (
              <div style={{ padding:"14px 16px", borderRadius:12, background:C.surface, border:`1px solid ${C.border}`, marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:8 }}>Opening Line Ideas</div>
                {guide.personalStatement.openingIdeas.map((o, i) => (
                  <div key={i} style={{ padding:"10px 12px", borderRadius:8, background:"var(--surface-high)", marginBottom:6, fontSize:13, color:C.text, fontStyle:"italic", lineHeight:1.5 }}>"{o}"</div>
                ))}
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              {guide.personalStatement.dos?.length > 0 && (
                <div style={{ padding:"14px 16px", borderRadius:12, background:"rgba(34,211,160,0.06)", border:"1px solid rgba(34,211,160,0.2)" }}>
                  <div style={{ fontSize:11, fontWeight:800, color:C.green, marginBottom:8 }}>✓ DO</div>
                  {guide.personalStatement.dos.map((d, i) => <div key={i} style={{ fontSize:12, color:C.text, marginBottom:5 }}>{d}</div>)}
                </div>
              )}
              {guide.personalStatement.donts?.length > 0 && (
                <div style={{ padding:"14px 16px", borderRadius:12, background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)" }}>
                  <div style={{ fontSize:11, fontWeight:800, color:"#ef4444", marginBottom:8 }}>✗ DON'T</div>
                  {guide.personalStatement.donts.map((d, i) => <div key={i} style={{ fontSize:12, color:C.text, marginBottom:5 }}>{d}</div>)}
                </div>
              )}
            </div>
            {guide.personalStatement.interviewTopics?.length > 0 && (
              <div style={{ padding:"14px 16px", borderRadius:12, background:C.surface, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:8 }}>🎤 Likely Interview Topics</div>
                {guide.personalStatement.interviewTopics.map((t, i) => <div key={i} style={{ fontSize:13, color:C.text, marginBottom:5, display:"flex", gap:8 }}><span>•</span><span>{t}</span></div>)}
              </div>
            )}
          </div>
        )}

        {/* STUDENT TIPS */}
        {activeTab === "tips" && (
          <div>
            <div style={{ padding:"12px 14px", borderRadius:10, background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", marginBottom:16, fontSize:12, color:"#f59e0b" }}>
              💡 Tips are compiled from real student experiences and university admissions data.
            </div>
            {(guide.pastStudentTips||[]).map((tip, i) => (
              <div key={i} style={{ padding:"16px 18px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, marginBottom:10 }}>
                <div style={{ fontSize:14, color:C.text, lineHeight:1.7, marginBottom:8 }}>"{tip.tip}"</div>
                <div style={{ fontSize:11, color:C.textMuted, fontWeight:600 }}>— {tip.source}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StepCard({ step, index }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div style={{ marginBottom:12, borderRadius:16, background:C.surface, border:`1px solid ${C.border}`, overflow:"hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding:"16px 18px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:"var(--accent-soft)", color:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, flexShrink:0 }}>
          {step.number || index + 1}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:2 }}>{step.title}</div>
          <div style={{ display:"flex", gap:6 }}>
            {step.timeframe && <span style={{ fontSize:11, color:C.textMuted }}>📅 {step.timeframe}</span>}
            {step.difficulty && <span style={{ fontSize:11, color:DIFF_COLORS[step.difficulty]||C.accent, fontWeight:700 }}>{step.difficulty}</span>}
            {step.impact && <span style={{ fontSize:11, color:IMPACT_COLORS[step.impact]||C.textMuted, fontWeight:700 }}>{step.impact} impact</span>}
          </div>
        </div>
        <span style={{ color:C.textMuted, fontSize:16, transform: open ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}>▾</span>
      </div>
      {open && (
        <div style={{ padding:"0 18px 18px", borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13, color:C.text, lineHeight:1.7, marginBottom:12, marginTop:12 }}>{step.description}</div>
          {step.actions?.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:800, color:C.accent, textTransform:"uppercase", marginBottom:8 }}>Actions</div>
              {step.actions.map((a, i) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:6, fontSize:13, color:C.text }}>
                  <span style={{ color:C.accent, flexShrink:0 }}>→</span><span>{a}</span>
                </div>
              ))}
            </div>
          )}
          {step.resources?.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:C.accent, textTransform:"uppercase", marginBottom:8 }}>Resources</div>
              {step.resources.map((r, i) => (
                <ResourceCard key={i} title={r.name} description={r.description} url={r.url} free={r.free} type={r.type} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResourceCard({ title, subtitle, description, url, free, type }) {
  return (
    <div style={{ padding:"12px 14px", borderRadius:10, background:"var(--surface-high)", border:`1px solid ${C.border}`, marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:14 }}>{TYPE_ICONS[type] || '🔗'}</span>
          <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{title}</span>
        </div>
        <div style={{ display:"flex", gap:4, flexShrink:0 }}>
          {free !== undefined && <span style={{ fontSize:10, padding:"2px 6px", borderRadius:4, background: free ? "rgba(34,211,160,0.12)" : "rgba(245,158,11,0.12)", color: free ? C.green : "#f59e0b", fontWeight:700 }}>{free ? "FREE" : "PAID"}</span>}
        </div>
      </div>
      {subtitle && <div style={{ fontSize:11, color:C.textMuted, marginBottom:4 }}>{subtitle}</div>}
      {description && <div style={{ fontSize:12, color:C.textSec, lineHeight:1.5, marginBottom:6 }}>{description}</div>}
      {url && <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:C.accent, fontWeight:600 }}>Visit →</a>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:10 }}>{title}</div>
      {children}
    </div>
  );
}
