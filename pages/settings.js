import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../lib/api";
import { Btn, C, Spinner } from "../components/ui";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || 'https://edupositive-backend.onrender.com';

const THEMES = [
  { id:"default",    label:"Dark Purple",   vars:{"--accent":"#6c63ff","--accent-soft":"rgba(108,99,255,0.12)","--bg":"#0a0a0f","--surface":"#12121a","--text":"#f0f0f8"} },
  { id:"midnight",   label:"Midnight Blue",  vars:{"--accent":"#3b82f6","--accent-soft":"rgba(59,130,246,0.12)","--bg":"#070b14","--surface":"#0d1424","--text":"#e8f0fe"} },
  { id:"forest",     label:"Forest Green",   vars:{"--accent":"#22c55e","--accent-soft":"rgba(34,197,94,0.12)","--bg":"#071409","--surface":"#0d1f10","--text":"#e8f5e9"} },
  { id:"sunset",     label:"Sunset Orange",  vars:{"--accent":"#f97316","--accent-soft":"rgba(249,115,22,0.12)","--bg":"#100803","--surface":"#1a0f05","--text":"#fff7ed"} },
  { id:"rose",       label:"Rose Pink",      vars:{"--accent":"#ec4899","--accent-soft":"rgba(236,72,153,0.12)","--bg":"#0f0509","--surface":"#1a0910","--text":"#fdf2f8"} },
  { id:"ocean",      label:"Ocean Teal",     vars:{"--accent":"#14b8a6","--accent-soft":"rgba(20,184,166,0.12)","--bg":"#030f0f","--surface":"#071919","--text":"#f0fdfa"} },
  { id:"gold",       label:"Gold",           vars:{"--accent":"#f59e0b","--accent-soft":"rgba(245,158,11,0.12)","--bg":"#0f0a00","--surface":"#1a1200","--text":"#fffbeb"} },
  { id:"light",      label:"Light Mode",     vars:{"--accent":"#6c63ff","--accent-soft":"rgba(108,99,255,0.1)","--bg":"#f8f8ff","--surface":"#ffffff","--text":"#1a1a2e"} },
];

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState({ fullName:"", bio:"", school:"" });
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState("default");
  const [exams, setExams] = useState([]);
  const [newExam, setNewExam] = useState({ subjectName:"", examBoard:"", examDate:"", paperName:"" });
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (user) setForm({ fullName: user.full_name || "", bio: user.bio || "", school: user.school || "" });
    const saved = localStorage.getItem('ep_theme') || 'default';
    setTheme(saved);
    loadExams();
    checkPushStatus();
  }, [user]);

  const loadExams = async () => {
    try {
      const token = localStorage.getItem('ep_token');
      const res = await fetch(`${API}/api/exams/countdown`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setExams(await res.json());
    } catch(e) {}
  };

  const checkPushStatus = async () => {
    if ('Notification' in window) setPushEnabled(Notification.permission === 'granted');
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('ep_token');
      const res = await fetch(`${API}/api/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ fullName: form.fullName, bio: form.bio, school: form.school }),
      });
      if (res.ok) { updateUser({ full_name: form.fullName, bio: form.bio, school: form.school }); setMsg("Saved!"); setTimeout(() => setMsg(""), 2000); }
    } catch(e) { setMsg("Failed to save"); }
    setSaving(false);
  };

  const applyTheme = (themeId) => {
    const t = THEMES.find(x => x.id === themeId);
    if (!t) return;
    setTheme(themeId);
    localStorage.setItem('ep_theme', themeId);
    Object.entries(t.vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  };

  const addExam = async () => {
    if (!newExam.subjectName || !newExam.examDate) return;
    try {
      const token = localStorage.getItem('ep_token');
      const res = await fetch(`${API}/api/exams/countdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newExam),
      });
      if (res.ok) { loadExams(); setNewExam({ subjectName:"", examBoard:"", examDate:"", paperName:"" }); }
    } catch(e) {}
  };

  const removeExam = async (id) => {
    try {
      const token = localStorage.getItem('ep_token');
      await fetch(`${API}/api/exams/countdown/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      loadExams();
    } catch(e) {}
  };

  const enablePush = async () => {
    if (!('Notification' in window)) return alert("Push notifications not supported in this browser.");
    const permission = await Notification.requestPermission();
    if (permission === 'granted') { setPushEnabled(true); setMsg("Notifications enabled!"); setTimeout(() => setMsg(""), 2000); }
    else setMsg("Notification permission denied.");
  };

  const logoutAll = async () => {
    try {
      const token = localStorage.getItem('ep_token');
      await fetch(`${API}/api/auth/logout-all`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      logout();
    } catch(e) {}
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('ep_token');
      const res = await fetch(`${API}/api/auth/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (res.ok) { localStorage.removeItem('ep_token'); router.replace('/'); }
      else { const d = await res.json(); setMsg(d.error || "Failed to delete account"); }
    } catch(e) { setMsg("Failed to delete account"); }
    setDeleting(false);
  };

  const TABS = [
    { id:"profile", label:"Profile" },
    { id:"appearance", label:"Appearance" },
    { id:"exams", label:"Exam Dates" },
    { id:"notifications", label:"Notifications" },
    { id:"account", label:"Account" },
  ];

  return (
    <div style={{ padding:"20px 16px 100px", maxWidth:600, margin:"0 auto" }}>
      <h1 style={{ fontSize:26, fontWeight:800, color:C.text, marginBottom:20, fontFamily:"var(--font-serif)" }}>Settings</h1>

      {msg && <div style={{ padding:"10px 14px", borderRadius:10, background: msg.includes("ailed") ? "rgba(239,68,68,0.1)" : "rgba(34,211,160,0.1)", border:`1px solid ${msg.includes("ailed") ? C.red : C.green}`, marginBottom:16, fontSize:13, color: msg.includes("ailed") ? C.red : C.green }}>{msg}</div>}

      <div style={{ display:"flex", gap:8, marginBottom:24, overflowX:"auto", borderBottom:`1px solid ${C.border}` }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:"10px 14px", background:"none", border:"none", borderBottom:`2px solid ${tab===t.id?C.accent:"transparent"}`, color:tab===t.id?C.accent:C.textSec, fontSize:13, fontWeight:tab===t.id?700:500, cursor:"pointer", marginBottom:-1, whiteSpace:"nowrap" }}>{t.label}</button>
        ))}
      </div>

      {/* PROFILE */}
      {tab === "profile" && (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24, padding:"16px 18px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}` }}>
            <div style={{ width:60, height:60, borderRadius:14, background:"linear-gradient(135deg,var(--accent),#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"#fff" }}>
              {user?.username?.slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{user?.username}</div>
              <div style={{ fontSize:12, color:C.textMuted }}>{user?.email}</div>
              <div style={{ fontSize:11, color:C.accent, marginTop:2 }}>L{user?.level} · {user?.xp?.toLocaleString()} XP</div>
            </div>
          </div>
          {[
            { label:"Full name", key:"fullName", placeholder:"Your full name" },
            { label:"School / College", key:"school", placeholder:"Your school or college" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, color:C.textMuted, marginBottom:6, fontWeight:600 }}>{f.label}</div>
              <input value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} placeholder={f.placeholder}
                style={{ width:"100%", padding:"12px 14px", borderRadius:10, background:C.surface, border:`1px solid ${C.border}`, color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }} />
            </div>
          ))}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:6, fontWeight:600 }}>Bio</div>
            <textarea value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} placeholder="Tell others about yourself" rows={3}
              style={{ width:"100%", padding:"12px 14px", borderRadius:10, background:C.surface, border:`1px solid ${C.border}`, color:C.text, fontSize:14, outline:"none", resize:"vertical", boxSizing:"border-box" }} />
          </div>
          <Btn onClick={saveProfile} disabled={saving} style={{ width:"100%", padding:"13px" }}>
            {saving ? "Saving…" : "Save Changes"}
          </Btn>
        </div>
      )}

      {/* APPEARANCE */}
      {tab === "appearance" && (
        <div>
          <div style={{ fontSize:13, color:C.textSec, marginBottom:16 }}>Choose your colour scheme</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
            {THEMES.map(t => (
              <button key={t.id} onClick={() => applyTheme(t.id)} style={{
                padding:"14px 16px", borderRadius:12, cursor:"pointer", textAlign:"left",
                background: theme===t.id ? "var(--accent-soft)" : C.surface,
                border:`2px solid ${theme===t.id ? C.accent : C.border}`,
              }}>
                <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                  {["--accent","--bg","--surface"].map(v => (
                    <div key={v} style={{ width:18, height:18, borderRadius:4, background:t.vars[v] || "#333" }} />
                  ))}
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:theme===t.id?C.accent:C.text }}>{t.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* EXAM DATES */}
      {tab === "exams" && (
        <div>
          <div style={{ fontSize:13, color:C.textSec, marginBottom:16, lineHeight:1.6 }}>Add your exam dates to see countdowns on the dashboard.</div>
          <div style={{ padding:"16px 18px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:12 }}>Add exam</div>
            <input value={newExam.subjectName} onChange={e => setNewExam(p => ({...p, subjectName: e.target.value}))} placeholder="Subject (e.g. AQA Biology)"
              style={{ width:"100%", padding:"10px 12px", borderRadius:8, background:"var(--surface-high)", border:`1px solid ${C.border}`, color:C.text, fontSize:13, outline:"none", marginBottom:8, boxSizing:"border-box" }} />
            <input value={newExam.paperName} onChange={e => setNewExam(p => ({...p, paperName: e.target.value}))} placeholder="Paper name (e.g. Paper 1)"
              style={{ width:"100%", padding:"10px 12px", borderRadius:8, background:"var(--surface-high)", border:`1px solid ${C.border}`, color:C.text, fontSize:13, outline:"none", marginBottom:8, boxSizing:"border-box" }} />
            <input type="date" value={newExam.examDate} onChange={e => setNewExam(p => ({...p, examDate: e.target.value}))}
              style={{ width:"100%", padding:"10px 12px", borderRadius:8, background:"var(--surface-high)", border:`1px solid ${C.border}`, color:C.text, fontSize:13, outline:"none", marginBottom:12, boxSizing:"border-box" }} />
            <Btn onClick={addExam} disabled={!newExam.subjectName || !newExam.examDate} style={{ width:"100%", padding:"10px" }}>Add Exam Date</Btn>
          </div>
          {exams.map(e => (
            <div key={e.id} style={{ padding:"14px 16px", borderRadius:12, background:C.surface, border:`1px solid ${e.daysUntil <= 7 ? C.red : e.daysUntil <= 30 ? "#f59e0b" : C.border}`, marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{e.subject_name}{e.paper_name ? ` — ${e.paper_name}` : ''}</div>
                <div style={{ fontSize:12, color:C.textMuted }}>{new Date(e.exam_date).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                <div style={{ fontSize:16, fontWeight:900, color: e.daysUntil <= 7 ? C.red : e.daysUntil <= 30 ? "#f59e0b" : C.accent }}>
                  {e.daysUntil === 0 ? "Today!" : e.daysUntil === 1 ? "Tomorrow!" : `${e.daysUntil}d`}
                </div>
                <button onClick={() => removeExam(e.id)} style={{ padding:"4px 8px", borderRadius:6, background:"transparent", border:`1px solid ${C.border}`, color:C.red, fontSize:12, cursor:"pointer" }}>×</button>
              </div>
            </div>
          ))}
          {exams.length === 0 && <div style={{ padding:32, textAlign:"center", color:C.textMuted, fontSize:13 }}>No exam dates added yet.</div>}
        </div>
      )}

      {/* NOTIFICATIONS */}
      {tab === "notifications" && (
        <div>
          <div style={{ padding:"18px 20px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>Study reminders</div>
                <div style={{ fontSize:12, color:C.textSec, marginTop:2 }}>Daily reminders to revise and keep your streak</div>
              </div>
              {pushEnabled
                ? <span style={{ fontSize:12, color:C.green, fontWeight:700 }}>✓ On</span>
                : <Btn onClick={enablePush} style={{ padding:"8px 14px", fontSize:12 }}>Enable</Btn>
              }
            </div>
          </div>
          <div style={{ padding:"18px 20px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>Email notifications</div>
            <div style={{ fontSize:12, color:C.textSec }}>Daily revision emails are sent at 4pm GMT to {user?.email}</div>
          </div>
        </div>
      )}

      {/* ACCOUNT */}
      {tab === "account" && (
        <div>
          <div style={{ padding:"16px 18px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>Log out all devices</div>
            <div style={{ fontSize:12, color:C.textSec, marginBottom:12 }}>Invalidates all active sessions. Use if you think your account has been compromised.</div>
            <button onClick={logoutAll} style={{ padding:"10px 16px", borderRadius:10, background:"transparent", border:`1px solid ${C.border}`, color:C.textSec, fontSize:13, cursor:"pointer" }}>Log out all devices</button>
          </div>

          <div style={{ padding:"16px 18px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, marginBottom:12 }}>
            <Link href="/privacy" style={{ fontSize:13, color:C.accent }}>Privacy Policy →</Link>
          </div>

          <div style={{ padding:"16px 18px", borderRadius:14, background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.25)" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#ef4444", marginBottom:4 }}>Delete account</div>
            <div style={{ fontSize:12, color:C.textSec, marginBottom:12, lineHeight:1.6 }}>
              Permanently deletes your account and all data. This cannot be undone. Any active Premium subscription will be cancelled.
            </div>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} style={{ padding:"10px 16px", borderRadius:10, background:"transparent", border:"1px solid rgba(239,68,68,0.5)", color:"#ef4444", fontSize:13, cursor:"pointer" }}>
                Delete my account
              </button>
            ) : (
              <div>
                <div style={{ fontSize:12, color:"#ef4444", marginBottom:8, fontWeight:600 }}>Enter your password to confirm:</div>
                <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="Your password"
                  style={{ width:"100%", padding:"10px 12px", borderRadius:8, background:"var(--surface-high)", border:"1px solid rgba(239,68,68,0.5)", color:C.text, fontSize:13, outline:"none", marginBottom:10, boxSizing:"border-box" }} />
                {msg && <div style={{ fontSize:12, color:"#ef4444", marginBottom:8 }}>{msg}</div>}
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); }} style={{ flex:1, padding:"10px", borderRadius:10, background:"transparent", border:`1px solid ${C.border}`, color:C.textSec, fontSize:13, cursor:"pointer" }}>Cancel</button>
                  <button onClick={deleteAccount} disabled={deleting || !deletePassword} style={{ flex:2, padding:"10px", borderRadius:10, background:"#ef4444", color:"#fff", border:"none", fontSize:13, cursor:"pointer", fontWeight:700 }}>
                    {deleting ? "Deleting…" : "Permanently delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
