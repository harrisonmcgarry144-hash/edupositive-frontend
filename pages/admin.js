import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { adminApi, contentApi, examsApi } from "../lib/api";
import { Card, Btn, Input, C, Spinner, Tag, Modal } from "../components/ui";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Admin() {
  const { user } = useAuth();
  const router   = useRouter();

  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/dashboard");
  }, [user]);

  const [tab, setTab]          = useState("overview");
  const [overview, setOverview]= useState(null);
  const [loading, setLoading]  = useState(true);

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

      <div style={{ display:"flex", gap:8, padding:"0 16px", marginBottom:24, overflowX:"auto" }}>
        {[["overview","📊 Overview"],["content","📚 Content"],["exams","📝 Exams"],["users","👥 Users"]].map(([id,label]) => (
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
              { label:"Total Users",       value:overview.users?.total,             color:C.accent },
              { label:"Active Today",      value:overview.activeToday,              color:C.green },
              { label:"Published Lessons", value:overview.content?.published_lessons, color:C.amber },
              { label:"Past Papers",       value:overview.exams?.papers,            color:C.accent },
            ].map(s => (
              <Card key={s.label} style={{ flex:"1 0 calc(50% - 5px)", textAlign:"center", padding:"14px 8px" }}>
                <div style={{ fontSize:26, fontWeight:800, color:s.color, marginBottom:2 }}>{s.value ?? "—"}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>{s.label}</div>
              </Card>
            ))}
          </div>

          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <Link href="/admin/upload-papers" style={{ flex:1 }}>
              <Btn style={{ width:"100%", padding:"12px" }}>⬆ Upload Exam PDFs</Btn>
            </Link>
          </div>
        </div>
      )}

      {tab === "content" && <ContentTab />}
      {tab === "exams"   && <ExamsTab />}
      {tab === "users"   && <UsersTab />}
    </div>
  );
}

function ContentTab() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoad]      = useState(true);
  const [showCreate, setCreate] = useState(false);
  const [type, setType]         = useState("subject");
  const [form, setForm]         = useState({ name:"", slug:"", subjectId:"", topicId:"", subtopicId:"", content:"", summary:"" });
  const [topics, setTopics]     = useState([]);
  const [saving, setSave]       = useState(false);
  const [deleting, setDel]      = useState({});

  useEffect(() => { contentApi.subjects().then(setSubjects).catch(()=>{}).finally(()=>setLoad(false)); }, []);
  useEffect(() => {
    if (form.subjectId) contentApi.topics(form.subjectId).then(setTopics).catch(()=>{});
  }, [form.subjectId]);

  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const create = async () => {
    setSave(true);
    try {
      const slug = form.slug || form.name.toLowerCase().replace(/\s+/g,"-");
      if (type === "subject")  await contentApi.createSubject({ name:form.name, slug, levelType:"a-level" });
      if (type === "topic")    await contentApi.createTopic({ subjectId:form.subjectId, name:form.name, slug });
      if (type === "subtopic") await contentApi.createSubtopic({ topicId:form.topicId, name:form.name, slug });
      if (type === "lesson")   await contentApi.createLesson({ subtopicId:form.subtopicId, title:form.name, content:form.content, summary:form.summary, isPublished:true });
      const fresh = await contentApi.subjects();
      setSubjects(fresh);
      setCreate(false); setForm({ name:"",slug:"",subjectId:"",topicId:"",subtopicId:"",content:"",summary:"" });
      alert("Created!");
    } catch (e) { alert(e.message); }
    finally { setSave(false); }
  };

  const deleteSubject = async (id, name) => {
    if (!confirm(`Delete "${name}" and ALL its topics, subtopics and lessons? This cannot be undone.`)) return;
    setDel(p=>({...p,[id]:true}));
    try {
      await contentApi.deleteSubject(id);
      setSubjects(p => p.filter(s => s.id !== id));
    } catch(e) { alert(e.message); }
    finally { setDel(p=>({...p,[id]:false})); }
  };

  if (loading) return <div style={{ padding:16 }}><Spinner /></div>;

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

      <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:12, letterSpacing:"0.08em", textTransform:"uppercase" }}>All Subjects</div>
      {subjects.map(s => (
        <div key={s.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:18 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{s.name}</div>
              <div style={{ fontSize:11, color:C.textMuted }}>{s.description}</div>
            </div>
          </div>
          <button
            onClick={() => deleteSubject(s.id, s.name)}
            disabled={deleting[s.id]}
            style={{ background:"none", border:`1px solid ${C.red}`, color:C.red, fontSize:12, padding:"4px 12px", borderRadius:8, cursor:"pointer" }}
          >
            {deleting[s.id] ? "…" : "Delete"}
          </button>
        </div>
      ))}

      {showCreate && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
          <div style={{ background:C.surface, borderRadius:16, padding:24, width:"100%", maxWidth:440, border:`1px solid ${C.border}`, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:16, textTransform:"capitalize" }}>Create {type}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <Input label="Name" value={form.name} onChange={set("name")} placeholder={`${type} name`} />
              {type !== "lesson" && <Input label="Slug (auto if blank)" value={form.slug} onChange={set("slug")} placeholder="url-slug" />}
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
              <div style={{ display:"flex", gap:10 }}>
                <Btn variant="ghost" onClick={() => setCreate(false)} style={{ flex:1, padding:"12px" }}>Cancel</Btn>
                <Btn onClick={create} disabled={saving || !form.name} style={{ flex:1, padding:"12px" }}>
                  {saving ? "Creating…" : `Create ${type}`}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExamsTab() {
  const [subjects, setSubjects] = useState([]);
  const [selSub, setSelSub]     = useState(null);
  const [papers, setPapers]     = useState([]);
  const [loading, setLoad]      = useState(true);
  const [deleting, setDel]      = useState({});

  useEffect(() => { contentApi.subjects().then(setSubjects).catch(()=>{}).finally(()=>setLoad(false)); }, []);

  useEffect(() => {
    if (!selSub) return;
    examsApi.papersBySubject(selSub.id).then(setPapers).catch(()=>{});
  }, [selSub]);

  const deletePaper = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    setDel(p=>({...p,[id]:true}));
    try {
      await examsApi.deletePaper(id);
      setPapers(p => p.filter(x => x.id !== id));
    } catch(e) { alert(e.message); }
    finally { setDel(p=>({...p,[id]:false})); }
  };

  if (loading) return <div style={{ padding:16 }}><Spinner /></div>;

  const byYear = {};
  for (const p of papers) {
    if (!byYear[p.year]) byYear[p.year] = [];
    byYear[p.year].push(p);
  }

  return (
    <div style={{ padding:"0 16px" }}>
      <div style={{ marginBottom:16 }}>
        <Link href="/admin/upload-papers">
          <Btn style={{ width:"100%", padding:"12px", marginBottom:12 }}>⬆ Upload Paper PDFs</Btn>
        </Link>
      </div>

      <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:20, paddingBottom:4 }}>
        {subjects.map(s => (
          <button key={s.id} onClick={() => setSelSub(s)} style={{
            padding:"8px 14px", borderRadius:100, fontSize:12, fontWeight:600,
            cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
            background: selSub?.id===s.id ? "var(--accent-soft)" : C.surface,
            border:`1px solid ${selSub?.id===s.id ? C.accent : C.border}`,
            color: selSub?.id===s.id ? C.accent : C.textSec,
          }}>{s.name}</button>
        ))}
      </div>

      {!selSub && <p style={{ color:C.textSec, textAlign:"center", padding:32 }}>Select a subject to view papers</p>}

      {selSub && Object.keys(byYear).sort((a,b)=>b-a).map(year => (
        <div key={year} style={{ marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:10 }}>{year}</div>
          {byYear[year].map(p => (
            <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:8 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{p.title}</div>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>
                  {p.total_marks}m · {p.duration_mins} mins
                  {p.paper_url && " · 📄 Paper"}
                  {p.mark_scheme_url && " · 📋 MS"}
                </div>
              </div>
              <button
                onClick={() => deletePaper(p.id, p.title)}
                disabled={deleting[p.id]}
                style={{ background:"none", border:`1px solid ${C.red}`, color:C.red, fontSize:12, padding:"4px 10px", borderRadius:8, cursor:"pointer" }}
              >
                {deleting[p.id] ? "…" : "Delete"}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [q, setQ]         = useState("");
  const [loading, setLoad]= useState(false);

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
