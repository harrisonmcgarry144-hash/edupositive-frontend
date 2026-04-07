import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { adminApi, contentApi } from "../lib/api";
import { Card, Btn, Input, C, Spinner, Tag, Modal } from "../components/ui";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Admin() {
  const { user } = useAuth();
  const router   = useRouter();

  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/dashboard");
  }, [user]);

  const [tab, setTab]         = useState("overview");
  const [overview, setOverview]= useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    adminApi.overview().then(setOverview).catch(()=>{}).finally(()=>setLoading(false));
  }, [user]);

  if (!user || user.role !== "admin") return null;
  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;

  return (
    <div style={{ padding:"20px 0 100px" }}>
      <div style={{ padding:"0 16px", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
          <h1 style={{ fontSize:24, fontWeight:800, color:C.text, fontFamily:"var(--font-serif)" }}>Admin Panel</h1>
          <Tag color={C.accent}>✦</Tag>
        </div>
        <p style={{ fontSize:13, color:C.textSec }}>Full editorial and platform control</p>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, padding:"0 16px", marginBottom:24, overflowX:"auto" }}>
        {[["overview","📊 Overview"],["content","📚 Content"],["users","👥 Users"],["forum","🗣 Forum"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:"8px 16px", borderRadius:100, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap",
            background: tab===id ? "var(--accent-soft)" : "transparent",
            border:`1px solid ${tab===id ? C.accent : C.border}`,
            color: tab===id ? C.accent : C.textSec,
          }}>{label}</button>
        ))}
      </div>

      {tab === "overview" && overview && (
        <div style={{ padding:"0 16px" }}>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:20 }}>
            {[
              { label:"Total Users",    value:overview.users?.total,            color:C.accent },
              { label:"Verified",       value:overview.users?.verified,         color:C.green },
              { label:"Active Today",   value:overview.activeToday,             color:C.amber },
              { label:"Published Lessons", value:overview.content?.published_lessons, color:C.accent },
            ].map(s => (
              <Card key={s.label} style={{ flex:"1 0 calc(50% - 5px)", textAlign:"center", padding:"14px 8px" }}>
                <div style={{ fontSize:26, fontWeight:800, color:s.color, marginBottom:2 }}>{s.value ?? "—"}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>{s.label}</div>
              </Card>
            ))}
          </div>

          <Card style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:12, letterSpacing:"0.08em", textTransform:"uppercase" }}>Content Summary</div>
            {[
              ["Subjects",          overview.content?.subjects],
              ["Topics",            overview.content?.topics],
              ["Subtopics",         overview.content?.subtopics],
              ["Published Lessons", overview.content?.published_lessons],
              ["Draft Lessons",     overview.content?.draft_lessons],
              ["Past Papers",       overview.exams?.papers],
              ["Exam Questions",    overview.exams?.questions],
            ].map(([label,val]) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:13, color:C.textSec }}>{label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{val ?? 0}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "content" && <ContentTab />}
      {tab === "users"   && <UsersTab />}
      {tab === "forum"   && <ForumTab />}
    </div>
  );
}

function ContentTab() {
  const [showCreate, setCreate] = useState(false);
  const [type, setType]         = useState("subject");
  const [form, setForm]         = useState({ name:"", slug:"", subjectId:"", topicId:"", subtopicId:"", content:"", summary:"" });
  const [subjects, setSubs]     = useState([]);
  const [topics, setTopics]     = useState([]);
  const [saving, setSave]       = useState(false);

  useEffect(() => { contentApi.subjects().then(setSubs).catch(()=>{}); }, []);
  useEffect(() => {
    if (form.subjectId) contentApi.topics(form.subjectId).then(setTopics).catch(()=>{});
  }, [form.subjectId]);

  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const create = async () => {
    setSave(true);
    try {
      const slug = form.slug || form.name.toLowerCase().replace(/\s+/g,"-");
      if (type === "subject")   await contentApi.createSubject({ name:form.name, slug, levelType:form.levelType });
      if (type === "topic")     await contentApi.createTopic({ subjectId:form.subjectId, name:form.name, slug });
      if (type === "subtopic")  await contentApi.createSubtopic({ topicId:form.topicId, name:form.name, slug });
      if (type === "lesson")    await contentApi.createLesson({ subtopicId:form.subtopicId, title:form.name, content:form.content, summary:form.summary, isPublished:true });
      setCreate(false); setForm({ name:"",slug:"",subjectId:"",topicId:"",subtopicId:"",content:"",summary:"" });
      alert("Created successfully!");
    } catch (e) { alert(e.message); }
    finally { setSave(false); }
  };

  return (
    <div style={{ padding:"0 16px" }}>
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {["subject","topic","subtopic","lesson"].map(t => (
          <button key={t} onClick={() => { setType(t); setCreate(true); }} style={{
            padding:"9px 16px", borderRadius:10, border:`1px solid ${C.border}`,
            background:C.surface, color:C.text, fontSize:13, fontWeight:600, cursor:"pointer", textTransform:"capitalize",
          }}>+ {t}</button>
        ))}
      </div>

      <Link href="/learn">
        <Btn variant="ghost" style={{ width:"100%", padding:"12px", marginBottom:16 }}>Browse Content Tree →</Btn>
      </Link>

      <Modal open={showCreate} onClose={() => setCreate(false)} title={`Create ${type}`}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Input label="Name" value={form.name} onChange={set("name")} placeholder={`${type} name`} />
          {type !== "lesson" && <Input label="Slug (auto-generated if blank)" value={form.slug} onChange={set("slug")} placeholder="url-slug" />}
          {(type==="topic"||type==="subtopic"||type==="lesson") && (
            <div>
              <div style={{ fontSize:12, color:C.textSec, marginBottom:6, fontWeight:600 }}>Subject</div>
              <select value={form.subjectId} onChange={set("subjectId")} style={{ width:"100%", padding:"12px", background:"var(--surface-high)", border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14 }}>
                <option value="">Select subject…</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          {(type==="subtopic"||type==="lesson") && topics.length>0 && (
            <div>
              <div style={{ fontSize:12, color:C.textSec, marginBottom:6, fontWeight:600 }}>Topic</div>
              <select value={form.topicId} onChange={set("topicId")} style={{ width:"100%", padding:"12px", background:"var(--surface-high)", border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14 }}>
                <option value="">Select topic…</option>
                {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          {type==="lesson" && <Input label="Summary" value={form.summary} onChange={set("summary")} placeholder="Brief summary" rows={2} />}
          {type==="lesson" && <Input label="Content" value={form.content} onChange={set("content")} placeholder="Full lesson content…" rows={8} />}
          <Btn onClick={create} disabled={saving || !form.name} style={{ width:"100%", padding:"12px" }}>
            {saving ? "Creating…" : `Create ${type}`}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers]   = useState([]);
  const [q, setQ]           = useState("");
  const [loading, setLoad]  = useState(false);

  const search = async () => {
    setLoad(true);
    const res = await adminApi.users(q).catch(()=>[]);
    setUsers(res||[]); setLoad(false);
  };

  useEffect(() => { search(); }, []);

  const changeRole = async (id, role) => {
    await adminApi.updateRole(id, { role });
    setUsers(p => p.map(u => u.id===id ? {...u,role} : u));
  };

  return (
    <div style={{ padding:"0 16px" }}>
      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        <div style={{ flex:1 }}><Input placeholder="Search users…" value={q} onChange={e => setQ(e.target.value)} /></div>
        <Btn onClick={search} disabled={loading} style={{ padding:"11px 20px" }}>Search</Btn>
      </div>
      {users.map(u => (
        <div key={u.id} style={{ padding:"12px 16px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{u.username}</div>
              <div style={{ fontSize:12, color:C.textMuted }}>{u.email} · {u.role}</div>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {u.role !== "admin" && <button onClick={() => changeRole(u.id,"admin")} style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:`1px solid ${C.accent}`, background:"none", color:C.accent, cursor:"pointer" }}>Make Admin</button>}
              {u.role !== "user"  && <button onClick={() => changeRole(u.id,"user")}  style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:"none", color:C.textSec, cursor:"pointer" }}>Reset Role</button>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ForumTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoad]= useState(true);
  useEffect(() => { adminApi.flagged().then(setPosts).catch(()=>{}).finally(()=>setLoad(false)); }, []);
  const del = async (id) => { await adminApi.deletePost(id); setPosts(p=>p.filter(x=>x.id!==id)); };
  if (loading) return <div style={{ padding:16 }}><Spinner /></div>;
  return (
    <div style={{ padding:"0 16px" }}>
      {posts.length === 0 && <p style={{ color:C.textSec, textAlign:"center", padding:32 }}>No flagged posts ✓</p>}
      {posts.map(p => (
        <div key={p.id} style={{ padding:"12px 16px", background:C.surface, border:`1px solid rgba(239,68,68,0.3)`, borderRadius:12, marginBottom:8 }}>
          <div style={{ fontSize:13, color:C.text, marginBottom:4 }}>{p.content.slice(0,120)}…</div>
          <div style={{ fontSize:12, color:C.textMuted, marginBottom:8 }}>by {p.username}</div>
          <button onClick={() => del(p.id)} style={{ fontSize:12, padding:"4px 12px", borderRadius:6, border:`1px solid ${C.red}`, background:"none", color:C.red, cursor:"pointer" }}>Delete</button>
        </div>
      ))}
    </div>
  );
}
