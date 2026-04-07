import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../../context/AuthContext";
import { socialApi, usersApi } from "../../../lib/api";
import { C, Spinner, Btn } from "../../../components/ui";

export default function MessageThread() {
  const router = useRouter();
  const { userId } = router.query;
  const { user } = useAuth();
  const [messages, setMsgs]   = useState([]);
  const [profile, setProfile] = useState(null);
  const [input, setInput]     = useState("");
  const [loading, setLoad]    = useState(true);
  const bottomRef             = useRef(null);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      socialApi.messages(userId).catch(()=>[]),
      usersApi.profile(userId).catch(()=>null),
    ]).then(([m, p]) => { setMsgs(m||[]); setProfile(p); })
    .finally(() => setLoad(false));
  }, [userId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const msg = await socialApi.sendMessage({ receiverId: userId, content: input });
    setMsgs(p => [...p, msg]);
    setInput("");
  };

  const handleKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh" }}>
      {/* Header */}
      <div style={{ padding:"16px 20px", background:C.surface, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <button onClick={() => router.back()} style={{ background:"none", border:"none", color:C.accent, fontSize:18, cursor:"pointer" }}>←</button>
        <div style={{ width:36, height:36, borderRadius:10, background:"var(--accent-soft)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:C.accent }}>
          {(profile?.username||"?").slice(0,2).toUpperCase()}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{profile?.username || "User"}</div>
          <div style={{ fontSize:12, color:C.textMuted }}>Level {profile?.level}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign:"center", padding:40, color:C.textMuted, fontSize:13 }}>No messages yet. Say hello!</div>
        )}
        {messages.map((m, i) => {
          const isMe = m.sender_id === user?.id;
          return (
            <div key={m.id || i} style={{ display:"flex", justifyContent:isMe?"flex-end":"flex-start", marginBottom:8 }}>
              <div style={{
                maxWidth:"78%", padding:"10px 14px", borderRadius:14, fontSize:14, lineHeight:1.5,
                background: isMe ? C.accent : "var(--surface-high)",
                border: isMe ? "none" : `1px solid ${C.border}`,
                color: C.text,
                borderBottomRightRadius: isMe ? 4 : 14,
                borderBottomLeftRadius:  !isMe ? 4 : 14,
              }}>
                {m.content}
                <div style={{ fontSize:10, color: isMe ? "rgba(255,255,255,0.6)" : C.textMuted, marginTop:4, textAlign:"right" }}>
                  {new Date(m.created_at).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:"12px 16px 28px", background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", gap:10, flexShrink:0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message…"
          style={{ flex:1, padding:"12px 16px", background:"var(--surface-high)", border:`1px solid ${C.border}`, borderRadius:12, color:C.text, fontSize:14, fontFamily:"var(--font)", outline:"none" }}
        />
        <Btn onClick={send} disabled={!input.trim()} style={{ padding:"12px 18px" }}>→</Btn>
      </div>
    </div>
  );
}
