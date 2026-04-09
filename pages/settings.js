import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme, THEMES } from "../context/ThemeContext";
import { usersApi, api } from "../lib/api";
import { Card, Btn, Input, C, Avatar, Modal, Tag } from "../components/ui";
import Link from "next/link";

export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const { theme, setTheme }          = useTheme();
  const [saving, setSaving]          = useState(false);
  const [saved, setSaved]            = useState(false);
  const [showSupport, setSupport]    = useState(false);
  const [form, setForm]              = useState({
    fullName:    user?.full_name || "",
    bio:         user?.bio || "",
    school:      user?.school || "",
    isPublic:    user?.is_public ?? true,
    pomodoroMins:user?.pomodoro_mins || 25,
    pomodoroOn:  user?.pomodoro_on ?? true,
  });
  const fileRef = useRef(null);

  if (!user) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32 }}>
      <p style={{ color:C.textSec, marginBottom:16 }}>Sign in to access settings</p>
      <Link href="/login"><Btn>Sign In</Btn></Link>
    </div>
  );

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const updated = await usersApi.updateMe({
        fullName: form.fullName, bio: form.bio, school: form.school,
        isPublic: form.isPublic, pomodoroMins: form.pomodoroMins, pomodoroOn: form.pomodoroOn,
      });
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      const res = await api.upload("/api/upload/avatar", fd);
      updateUser({ avatar_url: res.avatarUrl });
    } catch (e) { alert("Upload failed: " + e.message); }
  };

  const Toggle = ({ value, onChange }) => (
    <div onClick={() => onChange(!value)} style={{
      width:46, height:26, borderRadius:13,
      background: value ? C.accent : C.border,
      position:"relative", cursor:"pointer", transition:"background 0.2s",
    }}>
      <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute", top:3, left: value ? 23 : 3, transition:"left 0.2s" }} />
    </div>
  );

  const Row = ({ label, sub, right }) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", borderBottom:`1px solid ${C.border}` }}>
      <div>
        <div style={{ fontSize:14, color:C.text }}>{label}</div>
        {sub && <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );

  return (
    <div style={{ padding:"20px 0 100px" }}>
      <h1 style={{ fontSize:24, fontWeight:800, color:C.text, padding:"0 16px", marginBottom:24, fontFamily:"var(--font-serif)" }}>Settings</h1>

      {/* Profile */}
      <div style={{ margin:"0 16px 24px" }}>
        <Card style={{ padding:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
            <div style={{ position:"relative", cursor:"pointer" }} onClick={() => fileRef.current?.click()}>
              <Avatar user={user} size={56} />
              <div style={{ position:"absolute", bottom:-2, right:-2, width:18, height:18, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>✏️</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={uploadAvatar} style={{ display:"none" }} />
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{user.full_name || user.username}</div>
              <div style={{ fontSize:13, color:C.textMuted }}>{user.email}</div>
              {user.role === "admin" && <Tag color={C.accent} style={{ marginTop:4 }}>Admin</Tag>}
              {user.role === "teacher" && <Tag color={C.green} style={{ marginTop:4 }}>Teacher</Tag>}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Input label="Full name" value={form.fullName} onChange={e => set("fullName")(e.target.value)} placeholder="Your name" />
            <Input label="Bio" value={form.bio} onChange={e => set("bio")(e.target.value)} placeholder="Tell others about yourself" rows={2} />
            <Input label="School" value={form.school} onChange={e => set("school")(e.target.value)} placeholder="Your school or college" />
          </div>
        </Card>
      </div>

      {/* Colour Scheme */}
      <div style={{ margin:"0 16px 24px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:10, letterSpacing:"0.1em", textTransform:"uppercase" }}>Colour Scheme</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:10 }}>
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setTheme(t.id)} style={{
              padding:"14px 16px", borderRadius:14, cursor:"pointer",
              background: theme === t.id ? "var(--accent-soft)" : C.surface,
              border: `2px solid ${theme === t.id ? C.accent : C.border}`,
              display:"flex", alignItems:"center", gap:10, textAlign:"left",
            }}>
              {/* Colour preview dots */}
              <div style={{ display:"flex", gap:3, flexShrink:0 }}>
                {t.preview.map((col, i) => (
                  <div key={i} style={{ width:12, height:12, borderRadius:"50%", background:col, border:"1px solid rgba(255,255,255,0.1)" }} />
                ))}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color: theme === t.id ? C.accent : C.text }}>{t.name}</div>
              </div>
              {theme === t.id && <div style={{ marginLeft:"auto", fontSize:12, color:C.accent }}>✓</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div style={{ margin:"0 16px 24px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:10, letterSpacing:"0.1em", textTransform:"uppercase" }}>Privacy</div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
          <Row label="Public Profile" sub="Allow others to find and view your profile" right={<Toggle value={form.isPublic} onChange={set("isPublic")} />} />
        </div>
      </div>

      {/* Focus Timer */}
      <div style={{ margin:"0 16px 24px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:10, letterSpacing:"0.1em", textTransform:"uppercase" }}>Focus Timer</div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
          <Row label="Pomodoro Timer" sub="Auto-starts during study sessions" right={<Toggle value={form.pomodoroOn} onChange={set("pomodoroOn")} />} />
          <div style={{ padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:14, color:C.text }}>Work Duration</div>
              <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>Minutes per session</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={() => set("pomodoroMins")(Math.max(5, form.pomodoroMins - 5))} style={{ width:28, height:28, borderRadius:8, background:"var(--surface-high)", border:`1px solid ${C.border}`, color:C.text, cursor:"pointer", fontSize:16 }}>−</button>
              <span style={{ fontSize:16, fontWeight:700, color:C.text, minWidth:32, textAlign:"center" }}>{form.pomodoroMins}</span>
              <button onClick={() => set("pomodoroMins")(Math.min(60, form.pomodoroMins + 5))} style={{ width:28, height:28, borderRadius:8, background:"var(--surface-high)", border:`1px solid ${C.border}`, color:C.text, cursor:"pointer", fontSize:16 }}>+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Account */}
      <div style={{ margin:"0 16px 24px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:10, letterSpacing:"0.1em", textTransform:"uppercase" }}>Account</div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:2 }}>Username</div>
            <div style={{ fontSize:14, color:C.text }}>@{user.username}</div>
          </div>
          <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:2 }}>Career Goal</div>
            <div style={{ fontSize:14, color:C.text }}>{user.career_goal || "Not set"}</div>
          </div>
          <Link href="/onboarding">
            <div style={{ padding:"14px 16px", cursor:"pointer", fontSize:14, color:C.accent }}>Update subjects & goals →</div>
          </Link>
        </div>
      </div>

      {/* Support */}
      <div style={{ margin:"0 16px 24px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:10, letterSpacing:"0.1em", textTransform:"uppercase" }}>Support</div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
          <button onClick={() => setSupport(true)} style={{ width:"100%", padding:"14px 16px", background:"none", border:"none", display:"flex", justifyContent:"space-between", cursor:"pointer", fontSize:14, color:C.text }}>
            Contact Support <span style={{ color:C.accent }}>→</span>
          </button>
          {user.role === "admin" && (
            <Link href="/admin">
              <div style={{ padding:"14px 16px", borderTop:`1px solid ${C.border}`, fontSize:14, color:C.accent, cursor:"pointer" }}>✦ Admin Panel →</div>
            </Link>
          )}
        </div>
      </div>

      {/* Save + Logout */}
      <div style={{ margin:"0 16px", display:"flex", flexDirection:"column", gap:12 }}>
        <Btn onClick={save} disabled={saving} style={{ width:"100%", padding:"13px", fontSize:15 }}>
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </Btn>
        <Btn variant="danger" onClick={logout} style={{ width:"100%", padding:"13px", fontSize:15 }}>Sign Out</Btn>
      </div>

      <Modal open={showSupport} onClose={() => setSupport(false)} title="Contact Support">
        <p style={{ fontSize:14, color:C.textSec, marginBottom:16, lineHeight:1.6 }}>
          Have a question or found a bug? Get in touch with Harrison directly.
        </p>
        <a href="mailto:harrisonmcgarry144@gmail.com">
          <Btn style={{ width:"100%", padding:"12px" }}>✉ Email Support</Btn>
        </a>
      </Modal>
    </div>
  );
}
