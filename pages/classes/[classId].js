import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { classesApi } from "../../lib/api";
import { Card, Btn, Input, C, Spinner, Tag } from "../../components/ui";

export default function ClassPage() {
  const router = useRouter();
  const { classId } = router.query;
  const { user } = useAuth();
  const [cls, setCls]         = useState(null);
  const [loading, setLoad]    = useState(true);
  const [tab, setTab]         = useState("assignments");
  const [showAssign, setShowA]= useState(false);
  const [showInvite, setShowI]= useState(false);
  const [inviteUser, setInvU] = useState("");
  const [form, setForm]       = useState({ title:"", description:"", type:"lesson", dueDate:"" });
  const [saving, setSave]     = useState(false);
  const [error, setError]     = useState("");

  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  useEffect(() => {
    if (!classId) return;
    classesApi.get(classId).then(setCls).catch(()=>{}).finally(()=>setLoad(false));
  }, [classId]);

  const createAssignment = async () => {
    setSave(true); setError("");
    try {
      const a = await classesApi.createAssignment(classId, form);
      setCls(p => ({ ...p, assignments: [a, ...(p.assignments||[])] }));
      setShowA(false); setForm({ title:"", description:"", type:"lesson", dueDate:"" });
    } catch(e) { setError(e.message); }
    finally { setSave(false); }
  };

  const inviteStudent = async () => {
    setSave(true); setError("");
    try {
      await classesApi.invite(classId, inviteUser);
      const fresh = await classesApi.get(classId);
      setCls(fresh);
      setInvU(""); setShowI(false);
    } catch(e) { setError(e.message); }
    finally { setSave(false); }
  };

  const removeStudent = async (userId) => {
    if (!confirm("Remove this student?")) return;
    await classesApi.removeMember(classId, userId);
    setCls(p => ({ ...p, members: p.members.filter(m => m.id !== userId) }));
  };

  const completeAssignment = async (assignmentId) => {
    await classesApi.completeAssignment(assignmentId);
    setCls(p => ({
      ...p,
      assignments: p.assignments.map(a => a.id === assignmentId ? {...a, completed: true} : a)
    }));
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;
  if (!cls) return <div style={{ padding:24, color:C.textSec }}>Class not found</div>;

  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <button onClick={() => router.push("/classes")} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:16 }}>← Classes</button>

      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>{cls.name}</h1>
        {cls.description && <p style={{ fontSize:13, color:C.textSec, marginBottom:8 }}>{cls.description}</p>}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {cls.subject_name && <Tag>{cls.subject_name}</Tag>}
          <Tag color={C.accent}>{cls.members?.length || 0} students</Tag>
          {isTeacher && <Tag color={C.amber}>Invite code: {cls.invite_code}</Tag>}
          {!isTeacher && <Tag color={C.green}>Teacher: {cls.teacher_name}</Tag>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:20, overflowX:"auto" }}>
        {[["assignments","📋 Assignments"],["leaderboard","🏆 Leaderboard"],["students","👥 Students"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:"8px 16px", borderRadius:100, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap",
            background: tab===id ? "var(--accent-soft)" : "transparent",
            border:`1px solid ${tab===id ? C.accent : C.border}`,
            color: tab===id ? C.accent : C.textSec,
          }}>{label}</button>
        ))}
      </div>

      {/* Assignments tab */}
      {tab === "assignments" && (
        <div>
          {isTeacher && (
            <Btn onClick={() => setShowA(true)} style={{ width:"100%", padding:"12px", marginBottom:16 }}>+ Add Assignment</Btn>
          )}
          {(cls.assignments||[]).length === 0 && (
            <div style={{ textAlign:"center", padding:32, color:C.textSec }}>No assignments yet</div>
          )}
          {(cls.assignments||[]).map(a => {
            const overdue = a.due_date && new Date(a.due_date) < new Date() && !a.completed;
            return (
              <div key={a.id} style={{
                padding:"16px 20px", borderRadius:14, background:C.surface,
                border:`1px solid ${a.completed ? C.green : overdue ? C.red : C.border}`,
                marginBottom:10,
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>{a.title}</div>
                    {a.description && <div style={{ fontSize:13, color:C.textSec, marginBottom:6 }}>{a.description}</div>}
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      <Tag>{a.type}</Tag>
                      {a.due_date && (
                        <Tag color={overdue ? C.red : C.amber}>
                          Due: {new Date(a.due_date).toLocaleDateString("en-GB")}
                        </Tag>
                      )}
                      {isTeacher && <Tag color={C.accent}>{a.completed_count}/{a.total_students} done</Tag>}
                    </div>
                  </div>
                  {a.completed && <div style={{ width:28, height:28, borderRadius:"50%", background:C.green, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>✓</div>}
                </div>
                {!isTeacher && !a.completed && (
                  <Btn onClick={() => completeAssignment(a.id)} variant="ghost" style={{ width:"100%", padding:"9px", fontSize:13, marginTop:4 }}>
                    Mark as Complete
                  </Btn>
                )}
                {isTeacher && (
                  <button onClick={() => { classesApi.deleteAssignment(a.id); setCls(p => ({...p, assignments: p.assignments.filter(x=>x.id!==a.id)})); }} style={{ background:"none", border:"none", color:C.red, fontSize:12, cursor:"pointer", marginTop:4 }}>Delete</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard tab */}
      {tab === "leaderboard" && (
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:12, letterSpacing:"0.08em", textTransform:"uppercase" }}>Class Leaderboard</div>
          {(cls.members||[]).map((m, i) => (
            <div key={m.id} style={{
              display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
              background: m.isMe ? "var(--accent-soft)" : C.surface,
              border:`1px solid ${m.isMe ? C.accent : C.border}`,
              borderRadius:12, marginBottom:8,
            }}>
              <div style={{ width:28, fontSize:16, fontWeight:800, color:["#f59e0b","#94a3b8","#cd7f32"][i]||C.textMuted, textAlign:"center" }}>
                {i+1}
              </div>
              <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,var(--accent),#a78bfa)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", flexShrink:0 }}>
                {m.username.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color: m.isMe ? C.accent : C.text }}>{m.username} {m.isMe && "(you)"}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>Level {m.level} · {m.streak}🔥 · {m.completed_assignments} assignments done</div>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:C.textSec }}>{m.xp?.toLocaleString()} XP</div>
            </div>
          ))}
        </div>
      )}

      {/* Students tab */}
      {tab === "students" && (
        <div>
          {isTeacher && (
            <Btn onClick={() => setShowI(true)} style={{ width:"100%", padding:"12px", marginBottom:16 }}>+ Invite Student</Btn>
          )}
          {(cls.members||[]).map(m => (
            <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:8 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,var(--accent),#a78bfa)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", flexShrink:0 }}>
                {m.username.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{m.username}</div>
                <div style={{ fontSize:12, color:C.textMuted }}>Level {m.level} · {m.xp?.toLocaleString()} XP</div>
              </div>
              {isTeacher && (
                <button onClick={() => removeStudent(m.id)} style={{ background:"none", border:`1px solid ${C.red}`, color:C.red, fontSize:12, padding:"4px 10px", borderRadius:8, cursor:"pointer" }}>Remove</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add assignment modal */}
      {showAssign && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
          <div style={{ background:C.surface, borderRadius:16, padding:24, width:"100%", maxWidth:420, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:16 }}>Add Assignment</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <Input placeholder="Assignment title" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} />
              <Input placeholder="Description (optional)" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} />
              <div>
                <div style={{ fontSize:12, color:C.textSec, marginBottom:6, fontWeight:600 }}>Type</div>
                <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={{ width:"100%", padding:"12px", background:"var(--surface-high)", border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14 }}>
                  <option value="lesson">Lesson</option>
                  <option value="flashcards">Flashcards</option>
                  <option value="past_paper">Past Paper</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <Input type="date" label="Due date (optional)" value={form.dueDate} onChange={e=>setForm(p=>({...p,dueDate:e.target.value}))} />
              {error && <div style={{ fontSize:13, color:C.red }}>{error}</div>}
              <div style={{ display:"flex", gap:10 }}>
                <Btn variant="ghost" onClick={()=>setShowA(false)} style={{ flex:1, padding:"12px" }}>Cancel</Btn>
                <Btn onClick={createAssignment} disabled={saving||!form.title} style={{ flex:1, padding:"12px" }}>
                  {saving ? "Adding…" : "Add"}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite student modal */}
      {showInvite && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
          <div style={{ background:C.surface, borderRadius:16, padding:24, width:"100%", maxWidth:380, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:4 }}>Invite Student</div>
            <div style={{ fontSize:13, color:C.textSec, marginBottom:16 }}>Enter their exact username</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <Input placeholder="Username" value={inviteUser} onChange={e=>setInvU(e.target.value)} />
              {error && <div style={{ fontSize:13, color:C.red }}>{error}</div>}
              <div style={{ display:"flex", gap:10 }}>
                <Btn variant="ghost" onClick={()=>setShowI(false)} style={{ flex:1, padding:"12px" }}>Cancel</Btn>
                <Btn onClick={inviteStudent} disabled={saving||!inviteUser} style={{ flex:1, padding:"12px" }}>
                  {saving ? "Inviting…" : "Invite"}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
