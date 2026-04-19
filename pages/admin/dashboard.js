import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { Btn, C, Spinner } from "../../components/ui";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || 'https://edupositive-backend.onrender.com';

async function adminFetch(path, options = {}) {
  const token = localStorage.getItem('ep_token');
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [regenStatus, setRegenStatus] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/dashboard');
  }, [user]);

  useEffect(() => {
    loadStats();
    loadRegenStatus();
    const interval = setInterval(loadRegenStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { if (tab === 'users') loadUsers(); }, [tab]);
  useEffect(() => { if (tab === 'revenue' && !revenue) adminFetch('/api/admin/revenue').then(setRevenue).catch(() => setRevenue({error: 'Could not load'})); }, [tab]);

  const loadStats = async () => {
    try { setStats(await adminFetch('/api/admin/stats')); } catch(e) {}
  };
  const loadUsers = async () => {
    try { setUsers(await adminFetch('/api/admin/users')); } catch(e) {}
  };
  const loadRegenStatus = async () => {
    try { setRegenStatus(await adminFetch('/api/admin/regenerate-status')); } catch(e) {}
  };

  const startRegen = async () => {
    if (!confirm("This will DELETE all existing lessons and regenerate every lesson for every subtopic. This takes several hours. Continue?")) return;
    try {
      await adminFetch('/api/admin/regenerate-all', { method: 'POST' });
      loadRegenStatus();
    } catch(e) { alert(e.message); }
  };

  const grantPremium = async (userId) => {
    try {
      await adminFetch(`/api/admin/users/${userId}/grant-premium`, { method: 'POST' });
      loadUsers();
    } catch(e) { alert(e.message); }
  };
  const revokePremium = async (userId) => {
    try {
      await adminFetch(`/api/admin/users/${userId}/revoke-premium`, { method: 'POST' });
      loadUsers();
    } catch(e) { alert(e.message); }
  };
  const deleteUser = async (userId, username) => {
    if (!confirm(`Delete user ${username}? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      loadUsers();
    } catch(e) { alert(e.message); }
  };

  const filteredUsers = users.filter(u =>
    !userSearch ||
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (user?.role !== 'admin') return <div style={{padding:40,textAlign:"center"}}><Spinner /></div>;

  return (
    <div style={{ padding:"20px 16px 100px", maxWidth:1000, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:11, color:C.accent, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em" }}>✦ Admin</div>
          <h1 style={{ fontSize:28, fontWeight:800, color:C.text, fontFamily:"var(--font-serif)" }}>Dashboard</h1>
        </div>
        <Link href="/admin" style={{ fontSize:13, color:C.textSec }}>Legacy panel →</Link>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:24, borderBottom:`1px solid ${C.border}`, overflowX:"auto" }}>
        {[
          {id:"overview",label:"📊 Overview"},
          {id:"content",label:"📚 Content"},
          {id:"users",label:"👥 Users"},
          {id:"regen",label:"🔄 Regeneration"},
          {id:"revenue",label:"💰 Revenue"},
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:"10px 16px", background:"none", border:"none",
            borderBottom:`2px solid ${tab===t.id?C.accent:"transparent"}`,
            color: tab===t.id ? C.accent : C.textSec,
            fontSize:13, fontWeight: tab===t.id ? 700 : 500, cursor:"pointer",
            marginBottom:-1, whiteSpace:"nowrap",
          }}>{t.label}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div>
          {!stats ? <Spinner /> : (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:12, marginBottom:24 }}>
                <StatCard label="Users" value={stats.users} icon="👥" color="#6c63ff" />
                <StatCard label="Premium" value={stats.premiumUsers} icon="✦" color="#22d3a0" />
                <StatCard label="Lessons" value={stats.lessons} icon="📖" color="#f59e0b" />
                <StatCard label="AI Lessons" value={stats.aiGeneratedLessons} icon="🤖" color="#a78bfa" />
                <StatCard label="Subjects" value={stats.subjects} icon="🎓" color="#3b82f6" />
                <StatCard label="Topics" value={stats.topics} icon="📑" color="#ef4444" />
                <StatCard label="Subtopics" value={stats.subtopics} icon="📌" color="#14b8a6" />
                <StatCard label="Chat Sessions" value={stats.chatSessions} icon="💬" color="#ec4899" />
              </div>

              {/* Coverage bar */}
              <div style={{ padding:"18px 20px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, marginBottom:24 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text }}>Subtopic coverage</div>
                  <div style={{ fontSize:14, fontWeight:800, color:C.accent }}>{stats.coverage.percentage}%</div>
                </div>
                <div style={{ height:10, background:"var(--surface-high)", borderRadius:100, overflow:"hidden", marginBottom:8 }}>
                  <div style={{ height:"100%", borderRadius:100, background:`linear-gradient(90deg, ${C.accent}, #a78bfa)`, width:`${stats.coverage.percentage}%`, transition:"width 0.5s" }} />
                </div>
                <div style={{ fontSize:12, color:C.textMuted }}>
                  {stats.coverage.covered} of {stats.coverage.total} subtopics have lessons
                </div>
              </div>

              {/* Recent signups */}
              <div style={{ padding:"18px 20px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:12 }}>Recent signups</div>
                {stats.recentSignups.map(u => (
                  <div key={u.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{u.username}</div>
                      <div style={{ fontSize:11, color:C.textMuted }}>{u.email}</div>
                    </div>
                    <div style={{ fontSize:11, color:C.textMuted }}>{new Date(u.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* REGEN */}
      {tab === "regen" && (
        <div>
          <div style={{ padding:"20px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:8 }}>Lesson Regeneration</div>
            <p style={{ fontSize:13, color:C.textSec, marginBottom:16, lineHeight:1.6 }}>
              Wipes all existing lessons and regenerates every lesson for every subtopic using AI. Runs in the background — takes several hours to complete.
            </p>

            {regenStatus?.isRegenerating ? (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <div style={{ fontSize:12, color:C.textSec }}>
                    {regenStatus.progress.current && `Currently: ${regenStatus.progress.current}`}
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.accent }}>
                    {regenStatus.progress.done} / {regenStatus.progress.total}
                  </div>
                </div>
                <div style={{ height:8, background:"var(--surface-high)", borderRadius:100, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:100, background:`linear-gradient(90deg, ${C.accent}, #a78bfa)`,
                    width:`${regenStatus.progress.total > 0 ? (regenStatus.progress.done / regenStatus.progress.total) * 100 : 0}%`,
                    transition:"width 0.5s" }} />
                </div>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:8 }}>🟢 Running in background</div>
              </div>
            ) : (
              <Btn onClick={startRegen} style={{ padding:"12px 20px" }}>🔄 Regenerate all lessons</Btn>
            )}
          </div>
        </div>
      )}

      {/* CONTENT */}
      {tab === "content" && (
        <div>
          <div style={{ padding:"20px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:12 }}>Content shortcuts</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:10 }}>
              <Link href="/admin" style={{ textDecoration:"none" }}>
                <div style={{ padding:"14px 16px", background:"var(--surface-high)", borderRadius:12, border:`1px solid ${C.border}`, cursor:"pointer" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>📚 Legacy content editor</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>Manual lesson editing</div>
                </div>
              </Link>
              <Link href="/admin/upload-papers" style={{ textDecoration:"none" }}>
                <div style={{ padding:"14px 16px", background:"var(--surface-high)", borderRadius:12, border:`1px solid ${C.border}`, cursor:"pointer" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>📝 Upload past papers</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>PDF upload</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div>
          <input
            type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
            placeholder="Search users..."
            style={{ width:"100%", padding:"12px 16px", borderRadius:12, background:C.surface, border:`1px solid ${C.border}`, color:C.text, fontSize:14, outline:"none", marginBottom:16, boxSizing:"border-box" }}
          />
          <div style={{ borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, overflow:"hidden" }}>
            {filteredUsers.map(u => (
              <div key={u.id} style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:8, background:"var(--accent-soft)", color:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, flexShrink:0 }}>
                  {u.username?.slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                    <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{u.username}</span>
                    {u.role === 'admin' && <span style={{ fontSize:10, padding:"2px 6px", borderRadius:4, background:"rgba(99,102,241,0.15)", color:C.accent, fontWeight:700 }}>ADMIN</span>}
                    {u.is_premium && <span style={{ fontSize:10, padding:"2px 6px", borderRadius:4, background:"rgba(34,211,160,0.15)", color:C.green, fontWeight:700 }}>PREMIUM</span>}
                    {!u.is_verified && <span style={{ fontSize:10, padding:"2px 6px", borderRadius:4, background:"rgba(245,158,11,0.15)", color:"#f59e0b", fontWeight:700 }}>UNVERIFIED</span>}
                  </div>
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{u.email} · L{u.level} · {u.xp?.toLocaleString()} XP</div>
                </div>
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  {u.is_premium ? (
                    <button onClick={() => revokePremium(u.id)} style={{ padding:"5px 10px", background:"transparent", color:"#f59e0b", border:"1px solid #f59e0b33", borderRadius:6, fontSize:11, cursor:"pointer" }}>Revoke ✦</button>
                  ) : (
                    <button onClick={() => grantPremium(u.id)} style={{ padding:"5px 10px", background:"transparent", color:C.green, border:`1px solid ${C.green}33`, borderRadius:6, fontSize:11, cursor:"pointer" }}>Grant ✦</button>
                  )}
                  {u.role !== 'admin' && (
                    <button onClick={() => deleteUser(u.id, u.username)} style={{ padding:"5px 10px", background:"transparent", color:C.red, border:`1px solid ${C.red}33`, borderRadius:6, fontSize:11, cursor:"pointer" }}>Delete</button>
                  )}
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && <div style={{ padding:40, textAlign:"center", color:C.textMuted }}>No users found</div>}
          </div>
        </div>
      )}
    </div>
  );
}

      {/* REVENUE */}
      {tab === "revenue" && (
        <div>
          {!revenue ? <Spinner /> : revenue.error ? <div style={{ padding:20, color:C.red }}>{revenue.error}</div> : (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:12, marginBottom:20 }}>
                <StatCard label="Gross Revenue" value={`£${(revenue.grossRevenue || 0).toFixed(2)}`} icon="💷" color="#22d3a0" />
                <StatCard label="Stripe Fees" value={`£${(revenue.stripeFees || 0).toFixed(2)}`} icon="💳" color="#f59e0b" />
                <StatCard label="Net Revenue" value={`£${(revenue.netRevenue || 0).toFixed(2)}`} icon="💰" color="#6c63ff" />
                <StatCard label="Total Charges" value={revenue.totalCharges || 0} icon="🧾" color="#a78bfa" />
              </div>

              <div style={{ padding:"18px 20px", borderRadius:14, background:"rgba(239,68,68,0.06)", border:`1px solid rgba(239,68,68,0.25)`, marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:800, color:C.red, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>⚠ Set Aside for Tax (33%)</div>
                <div style={{ fontSize:32, fontWeight:900, color:C.red, fontFamily:"var(--font-serif)" }}>£{(revenue.taxSetAside || 0).toFixed(2)}</div>
                <div style={{ fontSize:12, color:C.textSec, marginTop:4 }}>Move this amount to a separate savings account before spending anything.</div>
              </div>

              <div style={{ padding:"18px 20px", borderRadius:14, background:"rgba(34,211,160,0.06)", border:`1px solid rgba(34,211,160,0.25)`, marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:800, color:C.green, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>✓ Safe to Spend</div>
                <div style={{ fontSize:32, fontWeight:900, color:C.green, fontFamily:"var(--font-serif)" }}>£{(revenue.availableToSpend || 0).toFixed(2)}</div>
                <div style={{ fontSize:12, color:C.textSec, marginTop:4 }}>Net revenue minus 33% tax reserve.</div>
              </div>

              {revenue.monthly?.length > 0 && (
                <div style={{ padding:"18px 20px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:12 }}>Monthly Revenue (Last 12 Months)</div>
                  <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:120, marginBottom:8 }}>
                    {revenue.monthly.map((m, i) => {
                      const max = Math.max(...revenue.monthly.map(x => x.gross), 1);
                      const h = (m.gross / max) * 100;
                      return (
                        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                          <div style={{ fontSize:10, color:C.textMuted }}>{m.gross > 0 ? `£${m.gross.toFixed(0)}` : ''}</div>
                          <div title={`${m.month}: £${m.gross.toFixed(2)} (${m.count} charges)`} style={{
                            width:"100%", height:`${Math.max(h, 1)}%`,
                            background: `linear-gradient(180deg, ${C.accent}, #a78bfa)`, borderRadius:4,
                            transition:"height 0.5s",
                          }} />
                          <div style={{ fontSize:10, color:C.textMuted }}>{m.month}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ padding:"16px 18px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <span style={{ fontSize:11, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>{label}</span>
      </div>
      <div style={{ fontSize:26, fontWeight:900, color, fontFamily:"var(--font-serif)" }}>
        {value?.toLocaleString() || 0}
      </div>
    </div>
  );
}
