import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { flashcardsApi } from "../../lib/api";
import { C, Spinner, Btn, Tag } from "../../components/ui";

export default function Review() {
  const router = useRouter();
  const [cards, setCards]   = useState([]);
  const [idx, setIdx]       = useState(0);
  const [flipped, setFlip]  = useState(false);
  const [done, setDone]     = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setRes]   = useState([]);
  const dragStart = useRef(null);
  const [dragX, setDragX]   = useState(0);

  useEffect(() => {
    flashcardsApi.due()
      .then(c => setCards(c || []))
      .finally(() => setLoading(false));
  }, []);

  const answer = async (correct) => {
    const card = cards[idx];
    await flashcardsApi.review({ flashcardId: card.id, quality: correct ? 4 : 1 }).catch(() => {});
    setRes(p => [...p, correct]);
    setFlip(false); setDragX(0);
    if (idx + 1 >= cards.length) setDone(true);
    else setIdx(i => i + 1);
  };

  const onTouchStart = e => { dragStart.current = e.touches[0].clientX; };
  const onTouchMove  = e => { if (dragStart.current !== null) setDragX(e.touches[0].clientX - dragStart.current); };
  const onTouchEnd   = () => {
    if (dragX > 80) answer(true);
    else if (dragX < -80) answer(false);
    else setDragX(0);
    dragStart.current = null;
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;

  if (cards.length === 0) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32 }}>
      <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:8, fontFamily:"var(--font-serif)" }}>All caught up!</h2>
      <p style={{ color:C.textSec, marginBottom:24, textAlign:"center" }}>No cards due for review today. Come back tomorrow.</p>
      <Btn onClick={() => router.push("/flashcards")} variant="ghost">← Back to decks</Btn>
    </div>
  );

  if (done) {
    const correct = results.filter(Boolean).length;
    const pct = Math.round(correct / cards.length * 100);
    return (
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32 }}>
        <div style={{ fontSize:56, marginBottom:16 }}>{pct >= 80 ? "🌟" : pct >= 50 ? "💪" : "📚"}</div>
        <h2 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:8, fontFamily:"var(--font-serif)" }}>Review complete!</h2>
        <p style={{ color:C.textSec, marginBottom:8 }}>{correct} / {cards.length} correct</p>
        <div style={{ fontSize:42, fontWeight:800, color: pct>=70 ? C.green : pct>=50 ? C.amber : C.red, marginBottom:32 }}>{pct}%</div>
        <Btn onClick={() => router.push("/flashcards")} style={{ padding:"13px 32px" }}>Back to decks</Btn>
      </div>
    );
  }

  const card = cards[idx];
  return (
    <div style={{ padding:"20px 16px", display:"flex", flexDirection:"column", minHeight:"100vh" }}>
      <button onClick={() => router.push("/flashcards")} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:16 }}>← Exit</button>

      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
        <span style={{ fontSize:13, color:C.textSec }}>{idx+1} / {cards.length}</span>
        <span style={{ fontSize:13, color:C.textSec }}>{card.deck_title}</span>
      </div>
      <div style={{ background:"var(--surface-high)", borderRadius:100, height:4, marginBottom:24, overflow:"hidden" }}>
        <div style={{ width:`${(idx/cards.length)*100}%`, height:"100%", background:C.accent, borderRadius:100, transition:"width 0.4s" }} />
      </div>

      <p style={{ fontSize:12, color:C.textMuted, textAlign:"center", marginBottom:12 }}>Swipe right ✓ · Swipe left ✗ · Tap to flip</p>

      <div
        onClick={() => setFlip(f => !f)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          flex:1, minHeight:260, borderRadius:20, padding:28,
          background: flipped ? `linear-gradient(135deg,var(--green-soft),var(--surface-high))` : `linear-gradient(135deg,var(--accent-soft),var(--surface-high))`,
          border:`1px solid ${flipped ? "rgba(34,211,160,0.3)" : "var(--accent-glow)"}`,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          cursor:"pointer", userSelect:"none", position:"relative",
          transform:`translateX(${dragX}px) rotate(${dragX*0.025}deg)`,
          transition: dragX ? "none" : "transform 0.3s ease",
          boxShadow: dragX>60 ? `0 0 40px rgba(34,211,160,0.3)` : dragX<-60 ? `0 0 40px rgba(239,68,68,0.3)` : "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {dragX>60  && <div style={{ position:"absolute",top:20,left:20,fontSize:32,fontWeight:800,color:C.green }}>✓</div>}
        {dragX<-60 && <div style={{ position:"absolute",top:20,right:20,fontSize:32,fontWeight:800,color:C.red }}>✗</div>}
        <Tag color={flipped ? C.green : C.accent} style={{ marginBottom:16 }}>{flipped ? "Answer" : "Question"}</Tag>
        <p style={{ fontSize:18, fontWeight:600, color:C.text, textAlign:"center", lineHeight:1.6 }}>
          {flipped ? card.answer : card.question}
        </p>
        {!flipped && <p style={{ fontSize:12, color:C.textMuted, marginTop:20 }}>Tap to reveal</p>}
      </div>

      {flipped && (
        <div style={{ display:"flex", gap:12, marginTop:20, paddingBottom:20 }}>
          <Btn variant="danger" onClick={() => answer(false)} style={{ flex:1, padding:"14px" }}>✗ Incorrect</Btn>
          <Btn variant="success" onClick={() => answer(true)}  style={{ flex:1, padding:"14px" }}>✓ Correct</Btn>
        </div>
      )}
    </div>
  );
}
