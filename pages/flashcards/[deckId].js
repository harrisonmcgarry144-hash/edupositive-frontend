import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { flashcardsApi, aiApi } from "../../lib/api";
import { Card, Btn, Tag, C, Spinner, Modal, Input, Empty } from "../../components/ui";

export default function DeckPage() {
  const router = useRouter();
  const { deckId } = router.query;
  const [cards, setCards]       = useState([]);
  const [deck, setDeck]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [mode, setMode]         = useState("browse"); // browse | study | done
  const [showAdd, setShowAdd]   = useState(false);
  const [newCard, setNewCard]   = useState({ question:"", answer:"", hint:"" });
  const [genLoading, setGen]    = useState(false);

  useEffect(() => {
    if (!deckId) return;
    Promise.all([
      flashcardsApi.decks(),
      flashcardsApi.cards(deckId),
    ]).then(([decks, c]) => {
      setDeck((decks || []).find(d => d.id === deckId));
      setCards(c || []);
    }).finally(() => setLoading(false));
  }, [deckId]);

  const addCard = async () => {
    if (!newCard.question.trim() || !newCard.answer.trim()) return;
    const c = await flashcardsApi.addCard({ deckId, ...newCard });
    setCards(p => [...p, c]);
    setNewCard({ question:"", answer:"", hint:"" });
    setShowAdd(false);
  };

  const deleteCard = async (id) => {
    await flashcardsApi.deleteCard(id);
    setCards(p => p.filter(c => c.id !== id));
  };

  const genAI = async () => {
    setGen(true);
    try {
      const { cards: generated } = await aiApi.generateFlashcards({ count: 10, text: deck?.title });
      for (const c of generated) {
        const card = await flashcardsApi.addCard({ deckId, ...c });
        setCards(p => [...p, card]);
      }
    } catch (e) { alert("AI generation failed: " + e.message); }
    finally { setGen(false); }
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;
  if (mode === "study") return <StudySession cards={cards} deckId={deckId} onDone={() => setMode("done")} />;
  if (mode === "done")  return <SessionDone onReplay={() => setMode("study")} onBack={() => router.push("/flashcards")} />;

  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <button onClick={() => router.push("/flashcards")} style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:20 }}>← Back</button>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:"var(--font-serif)", marginBottom:4 }}>{deck?.title || "Deck"}</h1>
          <p style={{ fontSize:13, color:C.textSec }}>{cards.length} cards</p>
        </div>
        <Btn onClick={() => setMode("study")} disabled={cards.length === 0} style={{ padding:"10px 20px" }}>Study →</Btn>
      </div>

      {cards.length === 0 && (
        <Empty icon="🃏" title="No cards yet" sub="Add cards manually or let AI generate them" />
      )}

      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <Btn onClick={() => setShowAdd(true)} variant="ghost" style={{ fontSize:13, padding:"9px 16px" }}>+ Add Card</Btn>
        <Btn onClick={genAI} disabled={genLoading} variant="ghost" style={{ fontSize:13, padding:"9px 16px" }}>
          {genLoading ? "Generating…" : "✦ AI Generate"}
        </Btn>
      </div>

      {cards.map((c, i) => (
        <div key={c.id} style={{
          padding:"14px 18px", borderRadius:12,
          background:C.surface, border:`1px solid ${C.border}`,
          marginBottom:8,
        }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.textSec, marginBottom:4 }}>Q</div>
          <div style={{ fontSize:14, color:C.text, marginBottom:8 }}>{c.question}</div>
          <div style={{ fontSize:13, fontWeight:700, color:C.accent, marginBottom:4 }}>A</div>
          <div style={{ fontSize:14, color:C.textSec, marginBottom:8 }}>{c.answer}</div>
          {c.hint && <div style={{ fontSize:12, color:C.textMuted }}>💡 {c.hint}</div>}
          <button onClick={() => deleteCard(c.id)} style={{ background:"none", border:"none", color:C.red, fontSize:12, cursor:"pointer", marginTop:8 }}>Delete</button>
        </div>
      ))}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Flashcard">
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Input label="Question" placeholder="What is…?" value={newCard.question} onChange={e => setNewCard(p=>({...p,question:e.target.value}))} rows={2} />
          <Input label="Answer" placeholder="The answer is…" value={newCard.answer} onChange={e => setNewCard(p=>({...p,answer:e.target.value}))} rows={2} />
          <Input label="Hint (optional)" placeholder="Memory hint…" value={newCard.hint} onChange={e => setNewCard(p=>({...p,hint:e.target.value}))} />
          <Btn onClick={addCard} disabled={!newCard.question.trim() || !newCard.answer.trim()} style={{ width:"100%", padding:"12px" }}>Add Card</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ── Study session with swipe ──────────────────────────────────────────────────
function StudySession({ cards, deckId, onDone }) {
  const [idx, setIdx]       = useState(0);
  const [flipped, setFlip]  = useState(false);
  const [results, setRes]   = useState([]);
  const [dragX, setDragX]   = useState(0);
  const dragStart           = useRef(null);

  const card = cards[idx];

  const answer = async (correct) => {
    await flashcardsApi.review({ flashcardId: card.id, quality: correct ? 4 : 1 }).catch(()=>{});
    setRes(p => [...p, correct]);
    setFlip(false); setDragX(0);
    if (idx + 1 >= cards.length) {
      await flashcardsApi.sessionComplete({ deckId, correctCount: results.filter(Boolean).length + (correct?1:0), totalCount: cards.length }).catch(()=>{});
      onDone();
    } else {
      setIdx(i => i + 1);
    }
  };

  // Touch swipe
  const onTouchStart = e => { dragStart.current = e.touches[0].clientX; };
  const onTouchMove  = e => { if (dragStart.current !== null) setDragX(e.touches[0].clientX - dragStart.current); };
  const onTouchEnd   = () => {
    if (dragX > 80) answer(true);
    else if (dragX < -80) answer(false);
    else setDragX(0);
    dragStart.current = null;
  };

  const pct = (idx / cards.length) * 100;

  return (
    <div style={{ padding:"20px 16px 100px", display:"flex", flexDirection:"column", minHeight:"100vh" }}>
      {/* Progress */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <span style={{ fontSize:13, color:C.textSec }}>{idx + 1} / {cards.length}</span>
        <span style={{ fontSize:13, color:C.green }}>{results.filter(Boolean).length} ✓</span>
      </div>
      <div style={{ background:"var(--surface-high)", borderRadius:100, height:4, marginBottom:24, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:C.accent, borderRadius:100, transition:"width 0.4s" }} />
      </div>

      <p style={{ fontSize:12, color:C.textMuted, textAlign:"center", marginBottom:12 }}>
        Swipe right ✓ · Swipe left ✗ · Tap to flip
      </p>

      {/* Card */}
      <div
        onClick={() => setFlip(f => !f)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          flex:1, minHeight:240, borderRadius:20, padding:28,
          background: flipped
            ? `linear-gradient(135deg, var(--green-soft), var(--surface-high))`
            : `linear-gradient(135deg, var(--accent-soft), var(--surface-high))`,
          border: `1px solid ${flipped ? "rgba(34,211,160,0.3)" : "var(--accent-glow)"}`,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          cursor:"pointer", userSelect:"none",
          transform: `translateX(${dragX}px) rotate(${dragX * 0.025}deg)`,
          transition: dragX ? "none" : "transform 0.3s ease, background 0.3s",
          boxShadow: dragX > 60 ? `0 0 40px rgba(34,211,160,0.3)` : dragX < -60 ? `0 0 40px rgba(239,68,68,0.3)` : "0 20px 60px rgba(0,0,0,0.3)",
          position:"relative",
        }}
      >
        {dragX > 60  && <div style={{ position:"absolute", top:20, left:20, fontSize:32, fontWeight:800, color:C.green }}>✓</div>}
        {dragX < -60 && <div style={{ position:"absolute", top:20, right:20, fontSize:32, fontWeight:800, color:C.red }}>✗</div>}

        <Tag color={flipped ? C.green : C.accent} style={{ marginBottom:16 }}>{flipped ? "Answer" : "Question"}</Tag>
        <p style={{ fontSize:18, fontWeight:600, color:C.text, textAlign:"center", lineHeight:1.6 }}>
          {flipped ? card.answer : card.question}
        </p>
        {flipped && card.hint && (
          <p style={{ fontSize:12, color:C.textMuted, marginTop:16 }}>💡 {card.hint}</p>
        )}
        {!flipped && <p style={{ fontSize:12, color:C.textMuted, marginTop:20 }}>Tap to reveal</p>}
      </div>

      {flipped && (
        <div style={{ display:"flex", gap:12, marginTop:20 }}>
          <Btn variant="danger" onClick={() => answer(false)} style={{ flex:1, padding:"14px" }}>✗ Incorrect</Btn>
          <Btn variant="success" onClick={() => answer(true)}  style={{ flex:1, padding:"14px" }}>✓ Correct</Btn>
        </div>
      )}
    </div>
  );
}

function SessionDone({ onReplay, onBack }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
      <h2 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:8, fontFamily:"var(--font-serif)" }}>Session complete!</h2>
      <p style={{ color:C.textSec, marginBottom:36, textAlign:"center" }}>Great work. Your spaced repetition schedule has been updated.</p>
      <div style={{ display:"flex", gap:12, width:"100%", maxWidth:300 }}>
        <Btn variant="ghost" onClick={onBack}  style={{ flex:1, padding:"13px" }}>← Back</Btn>
        <Btn onClick={onReplay} style={{ flex:1, padding:"13px" }}>Replay</Btn>
      </div>
    </div>
  );
}
