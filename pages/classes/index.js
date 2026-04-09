import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { classesApi } from "../../lib/api";
import { Card, Btn, Input, C, Spinner, Tag } from "../../components/ui";
import Link from "next/link";

export default function Classes() {
  const { user }           = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoad]    = useState(true);
  const [showCreate, setCreate] = useState(false);
  const [showJoin, setJoin]     = useState(false);
  const [form, setForm]         = useState({ name:"", description:"" });
  const [joinCode, setJoinCode] = useState("");
  const [saving, setSave]       = useState(false);
  const [error, setError]       = useState("");

  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  useEffect(() => {
    classesApi.list().then(setClasses).catch(()=>{}).finally(()=>setLoad(false));
  }, []);

  const create = async () => {
    if (!form.name.trim()) return;
    setSave(true); setError("");
    try {
      const cls = await classesApi.create(form);
      setClasses(p => [cls, ...p]);
      setCreate(false); setForm({ name:"", description:"" });
    } catch(e) { setError(e.message); }
    finally { setSave(false); }
  };

  const join = async () => {
    if (!joinCode.trim()) return;
    setSave(true); setError("");
    try {
      const { class: cls } = await classesApi.join(joinCode);
      setClasses(p => [...p, cls]);
      setJoin(false); setJoinCode("");
    } catch(e) { setError(e.message); }
    finally { setSave(false); }
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;

  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>Classes</h1>
          <p style={{ fontSize:13, color:C.textSec }}>
            {isTeacher ? "Manage your classes and students" : "Your enrolled classes"}
          </p>
        </div>
        {isTeacher ? (
          <Btn onClick={() => setCreate(true)} style={{ padding:"9px 18px", fontSize:13 }}>+ Create Class</Btn>
        ) : (
          <Btn onClick={() => setJoin(true)} variant="ghost" style={{ padding:"9px 18px", fontSize:13 }}>Join Class</Btn>
        )}
      </div>

      {!isTeacher && (
        <div style={{ padding:"12px 16px", background:"rgba(99,102,241,0.08)", border:`1px solid var(--accent-glow)`, borderRadius:12, marginBottom:20 }}>
          <div style={{ fontSize:13, color:C.accent, fontWeight:600 }}>🎓 Have an invite code?</div>
          <div style={{ fontSize:12, color:C.textSec, marginTop:2 }}>Ask your teacher for their class invite code, then click "Join Class".</div>
        </div>
      )}

      {classes.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 16px" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🏫</div>
          <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:8 }}>
            {isTeacher ? "No classes yet" : "Not enrolled in any classes"}
          </div>
          <div style={{ fontSize:13, color:C.textSec }}>
            {isTeacher ? "Create a class to get started" : "Ask your teacher for an invite code"}
          </div>
        </div>
      )}

      {classes.map(cls => (
        <Link key={cls.id} href={`/classes/${cls.id}`} style={{ textDecoration:"none", display:"block" }}>
          <div style={{ padding:"18px 20px", borderRadius:14, background:C.surface, border:`1px solid ${C.border}`, marginBottom:10, cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:4 }}>{cls.name}</div>
                {cls.description && <div style={{ fontSize:13, color:C.textSec }}>{cls.description}</div>}
              </div>
              <div style={{ fontSize:22 }}>→</div>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {cls.subject_name && <Tag>{cls.subject_name}</Tag>}
              <Tag color={C.accent}>{cls.student_count} students</Tag>
              {isTeacher && <Tag color={C.amber}>Code: {cls.invite_code}</Tag>}
              {!isTeacher && cls.teacher_name && <Tag color={C.green}>Teacher: {cls.teacher_name}</Tag>}
            </div>
          </div>
        </Link>
      ))}

      {/* Create class modal */}
      {showCreate && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
          <div style={{ background:C.surface, borderRadius:16, padding:24, width:"100%", maxWidth:400, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:16 }}>Create Class</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <Input placeholder="Class name (e.g. Year 13 Biology)" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
              <Input placeholder="Description (optional)" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} />
              {error && <div style={{ fontSize:13, color:C.red }}>{error}</div>}
              <div style={{ display:"flex", gap:10 }}>
                <Btn variant="ghost" onClick={()=>setCreate(false)} style={{ flex:1, padding:"12px" }}>Cancel</Btn>
                <Btn onClick={create} disabled={saving||!form.name} style={{ flex:1, padding:"12px" }}>
                  {saving ? "Creating…" : "Create"}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join class modal */}
      {showJoin && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
          <div style={{ background:C.surface, borderRadius:16, padding:24, width:"100%", maxWidth:400, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:16 }}>Join Class</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <Input placeholder="Enter invite code…" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} style={{ textTransform:"uppercase", letterSpacing:"0.1em", fontSize:18, fontWeight:700, textAlign:"center" }} />
              {error && <div style={{ fontSize:13, color:C.red }}>{error}</div>}
              <div style={{ display:"flex", gap:10 }}>
                <Btn variant="ghost" onClick={()=>setJoin(false)} style={{ flex:1, padding:"12px" }}>Cancel</Btn>
                <Btn onClick={join} disabled={saving||!joinCode} style={{ flex:1, padding:"12px" }}>
                  {saving ? "Joining…" : "Join"}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
