import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { socialApi } from "../../lib/api";
import { Card, Btn, Input, C, Spinner, Avatar, Empty, Modal } from "../../components/ui";
import Link from "next/link";

export default function Social() {
  const { user }              = useAuth();
  const [tab, setTab]         = useState("friends");
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [search, setSearch]   = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSrch]  = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      socialApi.friends().catch(()=>[]),
      socialApi.pending().catch(()=>[]),
    ]).then(([f, p]) => { setFriends(f||[]); setPending(p||[]); })
    .finally(() => setLoading(false));
  }, [user]);

  const doSearch = async () => {
    if (!search.trim()) return;
    setSrch(true);
    const res = await socialApi.search(search).catch(()=>[]);
    setResults(res||[]);
    setSrch(false);
  };

  const sendReq = async (receiverId) => {
    await socialApi.sendRequest({ receiverId });
    setResults(p => p.filter(u => u.id !== receiverId));
  };

  const respond = async (friendshipId, accept) => {
    await socialApi.respondRequest(friendshipId, { status: accept ? "accepted" : "blocked" });
    setPending(p => p.filter(r => r.friendship_id !== friendshipId));
    if (accept) {
      const freshFriends = await socialApi.friends().catch(()=>[]);
      setFriends(freshFriends);
    }
  };

  if (!user) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32 }}>
      <p style={{ color:C.textSec, marginBottom:16 }}>Sign in to connect with others</p>
      <Link href="/login"><Btn>Sign In</Btn></Link>
    </div>
  );

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;

  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <h1 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>Social</h1>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:20 }}>Find friends, study groups, and chat</p>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:24, overflowX:"auto" }}>
        {[["friends","👥 Friends"],["search","🔍 Find People"],["messages","💬 Messages"],["groups","📚 Groups"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:"8px 16px", borderRadius:100, fontSize:13, fontWeight:600,
            cursor:"pointer", whiteSpace:"nowrap",
            background: tab===id ? "var(--accent-soft)" : "transparent",
            border:`1px solid ${tab===id ? C.accent : C.border}`,
            color: tab===id ? C.accent : C.textSec,
          }}>{label}{id==="friends" && pending.length>0 ? ` (${pending.length})` : ""}</button>
        ))}
      </div>

      {/* Friends list */}
      {tab === "friends" && (
        <>
          {pending.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:12, letterSpacing:"0.08em", textTransform:"uppercase" }}>Pending Requests</div>
              {pending.map(req => (
                <div key={req.friendship_id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:8 }}>
                  <Avatar user={req} size={36} />
                  <div style={{ flex:1, fontSize:14, fontWeight:600, color:C.text }}>{req.username}</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <Btn variant="success" onClick={() => respond(req.friendship_id, true)} style={{ padding:"6px 14px", fontSize:12 }}>Accept</Btn>
                    <Btn variant="danger" onClick={() => respond(req.friendship_id, false)} style={{ padding:"6px 14px", fontSize:12 }}>Decline</Btn>
                  </div>
                </div>
              ))}
            </div>
          )}

          {friends.length === 0 && <Empty icon="👥" title="No friends yet" sub="Search for people to connect with" />}
          {friends.map(f => (
            <Link key={f.id} href={`/social/messages/${f.id}`}>
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:8, cursor:"pointer" }}>
                <Avatar user={f} size={40} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{f.username}</div>
                  <div style={{ fontSize:12, color:C.textMuted }}>Level {f.level} · {f.streak}🔥 streak</div>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:C.accent }}>{f.xp?.toLocaleString()} XP</div>
              </div>
            </Link>
          ))}
        </>
      )}

      {/* Search */}
      {tab === "search" && (
        <div>
          <div style={{ display:"flex", gap:10, marginBottom:20 }}>
            <div style={{ flex:1 }}>
              <Input placeholder="Search by username or name…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Btn onClick={doSearch} disabled={searching} style={{ padding:"11px 20px" }}>
              {searching ? <Spinner size={16} /> : "Search"}
            </Btn>
          </div>

          {results.map(u => (
            <div key={u.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:8 }}>
              <Avatar user={u} size={40} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{u.username}</div>
                <div style={{ fontSize:12, color:C.textMuted }}>{u.school || "No school set"}</div>
              </div>
              <Btn onClick={() => sendReq(u.id)} variant="ghost" style={{ padding:"7px 16px", fontSize:12 }}>Add Friend</Btn>
            </div>
          ))}
        </div>
      )}

      {tab === "messages" && <MessagesTab />}
      {tab === "groups" && <GroupsTab />}
    </div>
  );
}

function MessagesTab() {
  const [convos, setConvos] = useState([]);
  const [loading, setLoad]  = useState(true);
  useEffect(() => {
    socialApi.conversations().then(setConvos).catch(()=>{}).finally(()=>setLoad(false));
  }, []);
  if (loading) return <Spinner />;
  if (!convos.length) return <Empty icon="💬" title="No messages yet" sub="Start a conversation with a friend" />;
  return (
    <div>
      {convos.map((c,i) => (
        <Link key={i} href={`/social/messages/${c.partner_id}`}>
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:8, cursor:"pointer" }}>
            <div style={{ width:40, height:40, borderRadius:10, background:"var(--accent-soft)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:C.accent }}>
              {(c.partner_name||"?").slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:2 }}>{c.partner_name}</div>
              <div style={{ fontSize:13, color:C.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.last_message}</div>
            </div>
            {!c.read && <div style={{ width:8, height:8, borderRadius:"50%", background:C.accent, flexShrink:0 }} />}
          </div>
        </Link>
      ))}
    </div>
  );
}

function GroupsTab() {
  const [groups, setGroups]   = useState([]);
  const [loading, setLoad]    = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName]       = useState("");

  useEffect(() => {
    socialApi.groups().then(setGroups).catch(()=>{}).finally(()=>setLoad(false));
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    const g = await socialApi.createGroup({ name });
    setGroups(p => [g,...p]); setName(""); setShowNew(false);
  };

  const join = async (id) => {
    await socialApi.joinGroup(id);
    setGroups(p => p.map(g => g.id===id ? {...g, is_member:true} : g));
  };

  if (loading) return <Spinner />;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
        <Btn onClick={() => setShowNew(true)} style={{ padding:"9px 18px", fontSize:13 }}>+ New Group</Btn>
      </div>
      {groups.length === 0 && <Empty icon="📚" title="No groups yet" sub="Create a study group to collaborate" />}
      {groups.map(g => (
        <div key={g.id} style={{ padding:"14px 18px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:2 }}>{g.name}</div>
              <div style={{ fontSize:12, color:C.textMuted }}>{g.member_count} members</div>
            </div>
            {!g.is_member && <Btn onClick={() => join(g.id)} variant="ghost" style={{ padding:"7px 16px", fontSize:12 }}>Join</Btn>}
            {g.is_member && <span style={{ fontSize:12, color:C.green, fontWeight:600 }}>✓ Joined</span>}
          </div>
        </div>
      ))}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Study Group">
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Input placeholder="Group name" value={name} onChange={e => setName(e.target.value)} />
          <Btn onClick={create} disabled={!name.trim()} style={{ width:"100%", padding:"12px" }}>Create Group</Btn>
        </div>
      </Modal>
    </div>
  );
}
