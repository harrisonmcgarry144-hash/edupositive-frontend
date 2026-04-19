import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { socialApi } from "../../lib/api";
import { Btn, Input, C, Spinner, Empty } from "../../components/ui";
import Link from "next/link";
import { RankBadge } from "../../components/RankBadge";

export default function Social() {
  const { user } = useAuth();
  const [tab, setTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSrch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      socialApi.friends().catch(() => []),
      socialApi.pending().catch(() => []),
    ]).then(([f, p]) => { setFriends(f || []); setPending(p || []); })
    .finally(() => setLoading(false));
  }, [user]);

  const doSearch = async () => {
    if (!search.trim()) return;
    setSrch(true); setNotFound(false); setSearched(true);
    const res = await socialApi.search(search.trim(), "", true).catch(() => []);
    setResults(res || []);
    if (!res || res.length === 0) setNotFound(true);
    setSrch(false);
  };

  const handleKey = e => { if (e.key === "Enter") doSearch(); };

  const sendReq = async (receiverId) => {
    await socialApi.sendRequest({ receiverId });
    setResults(p => p.filter(u => u.id !== receiverId));
  };

  const respond = async (friendshipId, accept) => {
    await socialApi.respondRequest(friendshipId, { status: accept ? "accepted" : "blocked" });
    setPending(p => p.filter(r => r.friendship_id !== friendshipId));
    if (accept) {
      const freshFriends = await socialApi.friends().catch(() => []);
      setFriends(freshFriends);
    }
  };

  if (!user) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <p style={{ color: C.textSec, marginBottom: 16 }}>Sign in to connect with others</p>
      <Link href="/login"><Btn>Sign In</Btn></Link>
    </div>
  );

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={32} /></div>;

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4, fontFamily: "var(--font-serif)" }}>Social</h1>
      <p style={{ fontSize: 13, color: C.textSec, marginBottom: 20 }}>Find friends and study together</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto" }}>
        {[["friends", "👥 Friends"], ["search", "🔍 Find People"], ["messages", "💬 Messages"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "8px 16px", borderRadius: 100, fontSize: 13, fontWeight: 600,
            cursor: "pointer", whiteSpace: "nowrap",
            background: tab === id ? "var(--accent-soft)" : "transparent",
            border: "1px solid " + (tab === id ? C.accent : C.border),
            color: tab === id ? C.accent : C.textSec,
          }}>
            {label}{id === "friends" && pending.length > 0 ? " (" + pending.length + ")" : ""}
          </button>
        ))}
      </div>

      {tab === "friends" && (
        <div>
          {pending.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>Pending Requests</div>
              {pending.map(req => (
                <div key={req.friendship_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.surface, border: "1px solid " + C.border, borderRadius: 12, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,var(--accent),#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>
                    {req.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}><span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{req.username}</span>{req.rank && <RankBadge rank={req.rank} isTop100={req.is_top100} size="sm" />}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={() => respond(req.friendship_id, true)} style={{ padding: "6px 14px", fontSize: 12 }}>Accept</Btn>
                    <Btn variant="ghost" onClick={() => respond(req.friendship_id, false)} style={{ padding: "6px 14px", fontSize: 12 }}>Decline</Btn>
                  </div>
                </div>
              ))}
            </div>
          )}
          {friends.length === 0 && <Empty icon="👥" title="No friends yet" sub="Go to Find People and enter their exact username" />}
          {friends.map(f => (
            <Link key={f.id} href={"/social/messages/" + f.id} style={{ textDecoration: "none", display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.surface, border: "1px solid " + C.border, borderRadius: 12, marginBottom: 8, cursor: "pointer" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,var(--accent),#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>
                  {f.username.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}><span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{f.username}</span>{f.rank && <RankBadge rank={f.rank} isTop100={f.is_top100} size="sm" />}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Level {f.level} · {f.streak}🔥 streak</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{f.xp ? f.xp.toLocaleString() : 0} XP</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "search" && (
        <div>
          <div style={{ padding: "14px 16px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: C.amber, fontWeight: 600 }}>Exact username required</div>
            <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>You must type the full username exactly to find someone.</div>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <Input placeholder="Enter exact username…" value={search} onChange={e => { setSearch(e.target.value); setSearched(false); setNotFound(false); }} onKeyDown={handleKey} />
            </div>
            <Btn onClick={doSearch} disabled={searching || !search.trim()} style={{ padding: "11px 20px" }}>
              {searching ? "..." : "Search"}
            </Btn>
          </div>
          {notFound && searched && (
            <div style={{ textAlign: "center", padding: "32px 16px", color: C.textMuted }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 14 }}>No user found with that username.</div>
            </div>
          )}
          {results.filter(u => u.id !== user.id).map(u => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.surface, border: "1px solid " + C.border, borderRadius: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,var(--accent),#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>
                {u.username.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}><span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{u.username}</span>{u.rank && <RankBadge rank={u.rank} isTop100={u.is_top100} size="sm" />}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>Level {u.level}</div>
              </div>
              <Btn onClick={() => sendReq(u.id)} variant="ghost" style={{ padding: "7px 16px", fontSize: 12 }}>Add Friend</Btn>
            </div>
          ))}
        </div>
      )}

      {tab === "messages" && (
        <MessagesTab friends={friends} />
      )}
    </div>
  );
}

function MessagesTab({ friends }) {
  const [conversations, setConvs] = useState([]);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    socialApi.conversations().then(setConvs).catch(() => {}).finally(() => setLoad(false));
  }, []);

  if (loading) return <Spinner />;
  if (!conversations.length && !friends.length) return <Empty icon="💬" title="No messages yet" sub="Add friends to start chatting" />;

  const toShow = conversations.length ? conversations : friends;
  return (
    <div>
      {toShow.map(c => (
        <Link key={c.id} href={"/social/messages/" + (c.id || c.user_id)} style={{ textDecoration: "none", display: "block" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.surface, border: "1px solid " + C.border, borderRadius: 12, marginBottom: 8, cursor: "pointer" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,var(--accent),#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>
              {c.username ? c.username.slice(0, 2).toUpperCase() : "??"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}><span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c.username}</span>{c.rank && <RankBadge rank={c.rank} isTop100={c.is_top100} size="sm" />}</div>
              {c.last_message && <div style={{ fontSize: 12, color: C.textMuted }}>{c.last_message.slice(0, 40)}</div>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
