import PremiumGate from "../components/PremiumGate";
import { paymentsApi } from "../lib/api";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { aiApi } from "../lib/api";
import { Pill, Btn, C, Spinner } from "../components/ui";
import Link from "next/link";

const MODES = [
  { id:"normal", label:"💬 Normal" },
  { id:"eli5",   label:"🧸 ELI5" },
  { id:"exam",   label:"📝 Exam Mode" },
];
const PERSONALITIES = [
  { id:"friendly",     label:"😊 Friendly" },
  { id:"strict",       label:"🎓 Strict" },
  { id:"motivational", label:"🔥 Motivational" },
  { id:"socratic",     label:"🤔 Socratic" },
];

function AIContent() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(null);

  useEffect(() => {
    paymentsApi.status().then(d => setIsPremium(d.isPremium)).catch(() => setIsPremium(false));
  }, []);

  if (isPremium === false) return <PremiumGate feature="AI Tutor" icon="✦" />;

  const [messages, setMessages] = useState([
    { role:"assistant", content:"Hi! I'm your EduPositive AI tutor. Ask me anything about your subjects, or try Blurt Mode or Feynman Mode below." }
  ]);
  const [input, setInput]     = useState("");
  const [mode, setMode]       = useState("normal");
  const [personality, setPers]= useState("friendly");
  const [sessionId, setSessId]= useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab]         = useState("chat"); // chat | blurt | feynman
  const bottomRef             = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim(); setInput(""); setLoading(true);
    setMessages(p => [...p, { role:"user", content: msg }]);
    try {
      const res = await aiApi.chat({ message: msg, sessionId, mode, personality });
      setSessId(res.sessionId);
      setMessages(p => [...p, { role:"assistant", content: res.reply }]);
    } catch (e) {
      setMessages(p => [...p, { role:"assistant", content:"Sorry, I couldn't respond right now. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  if (!user) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32 }}>
      <p style={{ color:C.textSec, marginBottom:16 }}>Sign in to use the AI tutor</p>
      <Link href="/login"><Btn>Sign In</Btn></Link>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh" }}>
      {/* Header */}
      <div style={{ padding:"20px 16px 12px", background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:12, fontFamily:"var(--font-serif)" }}>✦ AI Tutor</h1>

        {/* Tab switcher */}
        <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          {[["chat","💬 Chat"],["blurt","🧠 Blurt"],["feynman","🎓 Feynman"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding:"6px 14px", borderRadius:100, fontSize:13, fontWeight:600, cursor:"pointer",
              background: tab===id ? "var(--accent-soft)" : "transparent",
              border:`1px solid ${tab===id ? C.accent : C.border}`,
              color: tab===id ? C.accent : C.textSec,
            }}>{label}</button>
          ))}
        </div>

        {tab === "chat" && (
          <div>
            <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4, marginBottom:8 }}>
              {MODES.map(m => <Pill key={m.id} active={mode===m.id} onClick={() => setMode(m.id)}>{m.label}</Pill>)}
            </div>
            <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4 }}>
              {PERSONALITIES.map(p => <Pill key={p.id} active={personality===p.id} onClick={() => setPers(p.id)}>{p.label}</Pill>)}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {tab === "chat" && (
        <>
          <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", marginBottom:12 }}>
                <div style={{
                  maxWidth:"82%", padding:"12px 16px", borderRadius:16, fontSize:14, lineHeight:1.6,
                  background: m.role==="user" ? C.accent : "var(--surface-high)",
                  border: m.role==="user" ? "none" : `1px solid ${C.border}`,
                  color: C.text,
                  borderBottomRightRadius: m.role==="user" ? 4 : 16,
                  borderBottomLeftRadius:  m.role==="ai"   ? 4 : 16,
                  whiteSpace:"pre-wrap",
                }}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display:"flex", gap:5, padding:"12px 0" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:C.accent, animation:`pulse ${0.8+i*0.15}s ease-in-out infinite` }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding:"12px 16px 28px", background:C.surface, borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
            <div style={{ display:"flex", gap:10 }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask anything…"
                rows={1}
                style={{
                  flex:1, padding:"12px 16px", background:"var(--surface-high)",
                  border:`1px solid ${C.border}`, borderRadius:12, color:C.text,
                  fontSize:14, fontFamily:"var(--font)", resize:"none", outline:"none",
                }}
              />
              <Btn onClick={send} disabled={loading || !input.trim()} style={{ padding:"12px 18px", flexShrink:0 }}>→</Btn>
            </div>
          </div>
        </>
      )}

      {tab === "blurt" && <BlurtMode />}
      {tab === "feynman" && <FeynmanMode />}
    </div>
  );
}

// ── Blurt Mode ─────────────────────────────────────────────────────────────────
function BlurtMode() {
  const [text, setText]     = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoad]  = useState(false);
  const [subtopicId, setSub]= useState("");

  const submit = async () => {
    if (!text.trim()) return;
    setLoad(true);
    try {
      const res = await aiApi.blurt({ subtopicId: subtopicId || undefined, userText: text });
      setResult(res);
    } catch (e) { alert(e.message); }
    finally { setLoad(false); }
  };

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"20px 16px 100px" }}>
      <h2 style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:8 }}>🧠 Blurt Mode</h2>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:20, lineHeight:1.6 }}>
        Write down everything you remember about a topic without looking at your notes. The AI will compare it to the core content and identify your gaps.
      </p>

      {!result ? (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Start writing everything you remember…"
            rows={10}
            style={{
              width:"100%", padding:"14px 16px", background:"var(--surface-high)",
              border:`1px solid ${C.border}`, borderRadius:12, color:C.text,
              fontSize:14, lineHeight:1.7, fontFamily:"var(--font)", resize:"vertical", outline:"none",
            }}
          />
          <Btn onClick={submit} disabled={loading || !text.trim()} style={{ padding:"13px", fontSize:15, width:"100%" }}>
            {loading ? "Analysing…" : "✦ Analyse my recall"}
          </Btn>
        </div>
      ) : (
        <div>
          {/* Score */}
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ fontSize:52, fontWeight:800, color: result.score>=70?C.green:result.score>=50?C.amber:C.red, marginBottom:4 }}>
              {result.score}%
            </div>
            <p style={{ fontSize:14, color:C.textSec }}>{result.knowledgeGapReport}</p>
          </div>

          {result.missingKeyPoints?.length > 0 && (
            <Section title="❌ Missing key points" color={C.red} items={result.missingKeyPoints} />
          )}
          {result.incorrectIdeas?.length > 0 && (
            <Section title="⚠️ Incorrect ideas" color={C.amber} items={result.incorrectIdeas} />
          )}
          {result.wellRecalled?.length > 0 && (
            <Section title="✅ Well recalled" color={C.green} items={result.wellRecalled} />
          )}
          {result.nextSteps?.length > 0 && (
            <Section title="📚 What to review next" color={C.accent} items={result.nextSteps} />
          )}

          <Btn variant="ghost" onClick={() => { setResult(null); setText(""); }} style={{ width:"100%", marginTop:16, padding:"12px" }}>
            Try again
          </Btn>
        </div>
      )}
    </div>
  );
}

// ── Feynman Mode ──────────────────────────────────────────────────────────────
function FeynmanMode() {
  const [text, setText]    = useState("");
  const [result, setResult]= useState(null);
  const [loading, setLoad] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setLoad(true);
    try {
      const res = await aiApi.feynman({ subtopicId: undefined, explanation: text });
      setResult(res);
    } catch (e) { alert(e.message); }
    finally { setLoad(false); }
  };

  const levelColor = (l) => ({ deep:"#22d3a0", partial:C.amber, surface:C.red, guessing:C.red, memorising:C.amber })[l] || C.textSec;

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"20px 16px 100px" }}>
      <h2 style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:8 }}>🎓 Feynman Technique</h2>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:20, lineHeight:1.6 }}>
        Explain a concept in your own simple words as if teaching someone else. The AI will evaluate how deeply you actually understand it.
      </p>

      {!result ? (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Explain this concept in your own words…"
            rows={10}
            style={{
              width:"100%", padding:"14px 16px", background:"var(--surface-high)",
              border:`1px solid ${C.border}`, borderRadius:12, color:C.text,
              fontSize:14, lineHeight:1.7, fontFamily:"var(--font)", resize:"vertical", outline:"none",
            }}
          />
          <Btn onClick={submit} disabled={loading || !text.trim()} style={{ padding:"13px", fontSize:15, width:"100%" }}>
            {loading ? "Evaluating…" : "✦ Evaluate my understanding"}
          </Btn>
        </div>
      ) : (
        <div>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ fontSize:52, fontWeight:800, color: result.overallScore>=70?C.green:result.overallScore>=50?C.amber:C.red, marginBottom:4 }}>
              {result.overallScore}%
            </div>
            {result.understandingLevel && (
              <div style={{ display:"inline-block", padding:"4px 14px", borderRadius:100, fontSize:13, fontWeight:700, background: levelColor(result.understandingLevel)+"22", color: levelColor(result.understandingLevel), marginBottom:8 }}>
                {result.understandingLevel} understanding
              </div>
            )}
            <p style={{ fontSize:14, color:C.textSec }}>{result.summary}</p>
          </div>

          <div style={{ display:"flex", gap:8, marginBottom:16, justifyContent:"center" }}>
            {[["Clarity",result.clarityScore],["Accuracy",result.accuracyScore],["Depth",result.depthScore]].map(([label,score]) => (
              <div key={label} style={{ textAlign:"center", flex:1, padding:"12px 8px", background:"var(--surface-high)", borderRadius:12, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:20, fontWeight:800, color:score>=7?C.green:score>=5?C.amber:C.red }}>{score}/10</div>
                <div style={{ fontSize:11, color:C.textMuted }}>{label}</div>
              </div>
            ))}
          </div>

          {result.corrections?.length > 0 && <Section title="❌ Corrections needed" color={C.red} items={result.corrections} />}
          {result.followUpQuestions?.length > 0 && <Section title="🤔 Questions to consider" color={C.accent} items={result.followUpQuestions} />}
          {result.confidenceDetection && (
            <div style={{ padding:"14px", background:"var(--surface-high)", borderRadius:12, marginBottom:16, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.textSec, marginBottom:6 }}>AI CONFIDENCE ASSESSMENT</div>
              <p style={{ fontSize:13, color:C.text }}>{result.confidenceDetection}</p>
            </div>
          )}

          <Btn variant="ghost" onClick={() => { setResult(null); setText(""); }} style={{ width:"100%", marginTop:8, padding:"12px" }}>
            Try again
          </Btn>
        </div>
      )}
    </div>
  );
}

function Section({ title, color, items }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:13, fontWeight:700, color, marginBottom:8 }}>{title}</div>
      {items.map((item, i) => (
        <div key={i} style={{ padding:"10px 14px", background:"var(--surface-high)", borderRadius:10, marginBottom:6, fontSize:13, color:C.text, borderLeft:`3px solid ${color}` }}>
          {item}
        </div>
      ))}
    </div>
  );
}

export default function AI() {
  return (
    <PremiumGate feature="AI Tutor">
      <AIContent />
    </PremiumGate>
  );
}
