import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { C, Btn, Spinner } from "../components/ui";

const API = process.env.NEXT_PUBLIC_API_URL || 'https://edupositive-backend.onrender.com';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('ep_token');
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(options.headers || {}) },
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed');
  return res.json();
}

// Rating colours - BrainScape style
const RATINGS = [
  { value: 1, label: "Not at all", color: "#ef4444", bg: "rgba(239,68,68,0.15)", emoji: "😰" },
  { value: 2, label: "Barely", color: "#f97316", bg: "rgba(249,115,22,0.15)", emoji: "😕" },
  { value: 3, label: "Getting there", color: "#eab308", bg: "rgba(234,179,8,0.15)", emoji: "😐" },
  { value: 4, label: "Almost", color: "#3b82f6", bg: "rgba(59,130,246,0.15)", emoji: "🙂" },
  { value: 5, label: "Nailed it", color: "#22d3a0", bg: "rgba(34,211,160,0.15)", emoji: "😄" },
];

const INTERVAL_LABELS = { 0: "Today", 1: "Tomorrow", 3: "3 days", 7: "1 week", 14: "2 weeks", 28: "1 month" };

export default function Flashcards() {
  const router = useRouter();
  const { user } = useAuth();
  const [view, setView] = useState("decks"); // decks | session | create
  const [decks, setDecks] = useState([]);
  const [activeDeck, setActiveDeck] = useState(null);
  const [sessionCards, setSessionCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newDeck, setNewDeck] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => { loadDecks(); loadDue(); }, []);

  const loadDecks = async () => {
    try { setDecks(await apiFetch('/api/flashcards/decks')); } catch(e) {}
    setLoading(false);
  };
  const loadDue = async () => {
    try { const d = await apiFetch('/api/flashcards/due'); setDueCount(d.dueCount); } catch(e) {}
  };

  const startSession = async (deck) => {
    setActiveDeck(deck);
    try {
      const cards = await apiFetch(`/api/flashcards/session/${deck.id}`);
      if (cards.length === 0) {
        alert("No cards due for review today! Come back tomorrow.");
        return;
      }
      setSessionCards(cards);
      setView("session");
    } catch(e) { alert(e.message); }
  };

  const createDeck = async () => {
    if (!newDeck.name.trim()) return;
    setCreating(true);
    try {
      const deck = await apiFetch('/api/flashcards/decks', { method: 'POST', body: JSON.stringify(newDeck) });
      setDecks(p => [deck, ...p]);
      setShowCreate(false);
      setNewDeck({ name: "", description: "" });
    } catch(e) { alert(e.message); }
    setCreating(false);
  };

  const deleteDeck = async (id) => {
    if (!confirm("Delete this deck and all its cards?")) return;
    try { await apiFetch(`/api/flashcards/decks/${id}`, { method: 'DELETE' }); loadDecks(); } catch(e) { alert(e.message); }
  };

  if (view === "session" && activeDeck) {
    return <StudySession deck={activeDeck} cards={sessionCards} onFinish={() => { setView("decks"); loadDecks(); loadDue(); }} />;
  }

  if (view === "add-cards" && activeDeck) {
    return <AddCards deck={activeDeck} onBack={() => { setView("decks"); loadDecks(); }} />;
  }

  return (
    <div style={{ padding: "20px 16px 100px", maxWidth: 680, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: "var(--font-serif)", margin: 0 }}>Flashcards</h1>
          {dueCount > 0 && (
            <div style={{ fontSize: 13, color: C.accent, fontWeight: 600, marginTop: 4 }}>
              {dueCount} card{dueCount !== 1 ? 's' : ''} due for review today
            </div>
          )}
        </div>
        <Btn onClick={() => setShowCreate(true)} style={{ padding: "10px 18px", fontSize: 13 }}>+ New Deck</Btn>
      </div>

      {/* Create deck modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}>
          <div style={{ background: C.surface, borderRadius: 18, padding: 28, width: "100%", maxWidth: 400, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 16 }}>New Deck</div>
            <input value={newDeck.name} onChange={e => setNewDeck(p => ({...p, name: e.target.value}))} placeholder="Deck name (e.g. Biological Molecules)"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "var(--surface-high)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
            <textarea value={newDeck.description} onChange={e => setNewDeck(p => ({...p, description: e.target.value}))} placeholder="Description (optional)" rows={2}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "var(--surface-high)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", resize: "none", marginBottom: 16, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: "12px" }}>Cancel</Btn>
              <Btn onClick={createDeck} disabled={creating || !newDeck.name.trim()} style={{ flex: 2, padding: "12px" }}>
                {creating ? "Creating…" : "Create Deck"}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : (
        <>
          {decks.length === 0 && (
            <div style={{ padding: 48, textAlign: "center", background: C.surface, borderRadius: 16, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🗂</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>No flashcard decks yet</div>
              <div style={{ fontSize: 13, color: C.textSec, marginBottom: 20 }}>Complete all your lessons to get auto-generated flashcards, or create your own deck.</div>
              <Btn onClick={() => setShowCreate(true)} style={{ padding: "12px 24px" }}>Create a deck</Btn>
            </div>
          )}

          {decks.map(deck => {
            const pct = deck.total_cards > 0 ? Math.round((deck.mastered / deck.total_cards) * 100) : 0;
            const hasDue = deck.due_today > 0;
            return (
              <div key={deck.id} style={{ marginBottom: 12, padding: "18px 20px", borderRadius: 16, background: C.surface, border: `1px solid ${hasDue ? C.accent : C.border}`, position: "relative" }}>
                {hasDue && (
                  <div style={{ position: "absolute", top: 12, right: 16, background: C.accent, color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 100 }}>
                    {deck.due_today} due
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-soft)", color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🗂</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{deck.name}</div>
                    {deck.subject_name && <div style={{ fontSize: 11, color: C.textMuted }}>{deck.subject_name}{deck.topic_name ? ` · ${deck.topic_name}` : ''}</div>}
                    <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>{deck.total_cards || 0} cards · {deck.mastered || 0} mastered</div>
                  </div>
                </div>

                {/* Progress bar */}
                {deck.total_cards > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ height: 6, background: "var(--surface-high)", borderRadius: 100, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: `linear-gradient(90deg, #22d3a0, #3b82f6)`, width: `${pct}%`, borderRadius: 100, transition: "width 0.5s" }} />
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{pct}% mastered</div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <Btn onClick={() => startSession(deck)} disabled={!hasDue} style={{ flex: 2, padding: "10px", fontSize: 13 }}>
                    {hasDue ? `Study (${deck.due_today})` : "All caught up ✓"}
                  </Btn>
                  <button onClick={() => { setActiveDeck(deck); setView("add-cards"); }} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "transparent", border: `1px solid ${C.border}`, color: C.textSec, fontSize: 13, cursor: "pointer" }}>+ Cards</button>
                  {!deck.is_auto_generated && (
                    <button onClick={() => deleteDeck(deck.id)} style={{ padding: "10px 12px", borderRadius: 10, background: "transparent", border: `1px solid ${C.border}`, color: C.red, fontSize: 13, cursor: "pointer" }}>🗑</button>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ═══ STUDY SESSION ═══════════════════════════════════════════════════════════
function StudySession({ deck, cards: initialCards, onFinish }) {
  const [queue, setQueue] = useState([...initialCards]); // cards left to review
  const [redoQueue, setRedoQueue] = useState([]); // cards rated 1-2
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [rated, setRated] = useState({});
  const [sessionDone, setSessionDone] = useState(false);
  const [rating, setRating] = useState(null);
  const [stats, setStats] = useState({ reviewed: 0, mastered: 0 });

  const allCards = [...queue];
  const current = allCards[currentIdx];
  const total = queue.length + redoQueue.length;
  const progress = stats.reviewed;

  const handleRating = async (value) => {
    setRating(value);
    try {
      await apiFetch('/api/flashcards/rate', {
        method: 'POST',
        body: JSON.stringify({ cardId: current.id, deckId: deck.id, rating: value })
      });
    } catch(e) {}

    setTimeout(() => {
      if (value <= 2) {
        // Add to redo queue
        setRedoQueue(p => [...p, current]);
      }

      const newStats = { ...stats, reviewed: stats.reviewed + 1 };
      if (value === 5) newStats.mastered = stats.mastered + 1;
      setStats(newStats);

      const nextIdx = currentIdx + 1;
      if (nextIdx >= queue.length) {
        // End of main queue - do redo queue if any
        if (redoQueue.length > 0) {
          setQueue(redoQueue);
          setRedoQueue([]);
          setCurrentIdx(0);
        } else {
          setSessionDone(true);
        }
      } else {
        setCurrentIdx(nextIdx);
      }
      setFlipped(false);
      setRating(null);
    }, 600);
  };

  if (sessionDone) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 8, fontFamily: "var(--font-serif)" }}>Session complete!</h2>
        <p style={{ fontSize: 14, color: C.textSec, marginBottom: 24 }}>Reviewed {stats.reviewed} cards · {stats.mastered} mastered</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 28 }}>
          {RATINGS.map(r => (
            <div key={r.value} style={{ padding: "10px 8px", borderRadius: 12, background: r.bg, border: `1px solid ${r.color}33`, textAlign: "center" }}>
              <div style={{ fontSize: 20 }}>{r.emoji}</div>
              <div style={{ fontSize: 10, color: r.color, fontWeight: 700, marginTop: 2 }}>{r.value}</div>
            </div>
          ))}
        </div>
        <Btn onClick={onFinish} style={{ padding: "14px 36px", fontSize: 15 }}>Back to decks →</Btn>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, background: C.bg, zIndex: 50 }}>
        <button onClick={onFinish} style={{ background: "none", border: "none", color: C.textSec, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        <div style={{ flex: 1, height: 6, background: "var(--surface-high)", borderRadius: 100, overflow: "hidden" }}>
          <div style={{ height: "100%", background: `linear-gradient(90deg, ${C.accent}, #a78bfa)`, width: `${total > 0 ? (progress / total) * 100 : 0}%`, borderRadius: 100, transition: "width 0.3s" }} />
        </div>
        <span style={{ fontSize: 12, color: C.textMuted }}>{progress}/{total}</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 16px 80px", maxWidth: 600, width: "100%", margin: "0 auto" }}>
        {/* Redo indicator */}
        {redoQueue.length > 0 && (
          <div style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", marginBottom: 12, fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
            🔄 {redoQueue.length} card{redoQueue.length !== 1 ? 's' : ''} to redo
          </div>
        )}

        {/* Card */}
        <div onClick={() => !rating && setFlipped(f => !f)} style={{
          flex: 1, minHeight: 280, borderRadius: 24,
          background: flipped ? "var(--accent-soft)" : C.surface,
          border: `2px solid ${flipped ? C.accent : C.border}`,
          padding: "32px 28px", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", cursor: "pointer",
          transition: "all 0.3s", marginBottom: 24, textAlign: "center",
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: flipped ? C.accent : C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
            {flipped ? "Answer" : "Question — tap to reveal"}
          </div>
          <p style={{ fontSize: 18, color: C.text, lineHeight: 1.7, margin: 0 }}>
            {flipped ? current.back : current.front}
          </p>
          {!flipped && (
            <div style={{ marginTop: 20, fontSize: 12, color: C.textMuted }}>Tap card to see answer</div>
          )}
        </div>

        {/* Rating buttons */}
        {flipped && (
          <div>
            <div style={{ fontSize: 12, color: C.textSec, textAlign: "center", marginBottom: 12, fontWeight: 600 }}>How well did you know this?</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {RATINGS.map(r => (
                <button key={r.value} onClick={() => !rating && handleRating(r.value)} style={{
                  padding: "14px 8px", borderRadius: 14, cursor: rating ? "default" : "pointer",
                  background: rating === r.value ? r.bg : "var(--surface-high)",
                  border: `2px solid ${rating === r.value ? r.color : C.border}`,
                  transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  opacity: rating && rating !== r.value ? 0.4 : 1,
                }}>
                  <span style={{ fontSize: 20 }}>{r.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: r.color }}>{r.value}</span>
                  <span style={{ fontSize: 9, color: C.textMuted, lineHeight: 1.2, textAlign: "center" }}>{r.label}</span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: 10 }}>
              <span style={{ fontSize: 10, color: "#ef4444" }}>↩ Redo now</span>
              <span style={{ fontSize: 10, color: "#22d3a0" }}>→ Next interval</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ ADD CARDS ═══════════════════════════════════════════════════════════════
function AddCards({ deck, onBack }) {
  const [cards, setCards] = useState([]);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/flashcards/decks/${deck.id}/cards`).then(setCards).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const addCard = async () => {
    if (!front.trim() || !back.trim()) return;
    setSaving(true);
    try {
      const card = await apiFetch(`/api/flashcards/decks/${deck.id}/cards`, {
        method: 'POST', body: JSON.stringify({ front, back })
      });
      setCards(p => [...p, card]);
      setFront(""); setBack("");
    } catch(e) { alert(e.message); }
    setSaving(false);
  };

  const deleteCard = async (id) => {
    try {
      await apiFetch(`/api/flashcards/cards/${id}`, { method: 'DELETE' });
      setCards(p => p.filter(c => c.id !== id));
    } catch(e) { alert(e.message); }
  };

  return (
    <div style={{ padding: "20px 16px 100px", maxWidth: 680, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, fontSize: 14, cursor: "pointer", marginBottom: 16 }}>← Back</button>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4, fontFamily: "var(--font-serif)" }}>{deck.name}</h2>
      <p style={{ fontSize: 13, color: C.textSec, marginBottom: 20 }}>{cards.length} cards</p>

      {/* Add card form */}
      <div style={{ padding: "18px 20px", borderRadius: 16, background: C.surface, border: `1px solid ${C.border}`, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>Add a new card</div>
        <textarea value={front} onChange={e => setFront(e.target.value)} placeholder="Front (question or term)…" rows={2}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "var(--surface-high)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", resize: "none", marginBottom: 8, boxSizing: "border-box" }} />
        <textarea value={back} onChange={e => setBack(e.target.value)} placeholder="Back (answer or definition)…" rows={3}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "var(--surface-high)", border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", resize: "none", marginBottom: 12, boxSizing: "border-box" }} />
        <Btn onClick={addCard} disabled={saving || !front.trim() || !back.trim()} style={{ width: "100%", padding: "12px" }}>
          {saving ? "Adding…" : "+ Add Card"}
        </Btn>
      </div>

      {/* Cards list */}
      {loading ? <Spinner /> : cards.map((card, i) => (
        <div key={card.id} style={{ padding: "14px 16px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, marginBottom: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{card.front}</div>
            <div style={{ fontSize: 12, color: C.textSec }}>{card.back}</div>
            {card.interval_days !== null && (
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                Next review: {INTERVAL_LABELS[card.interval_days] || `${card.interval_days} days`}
                {card.is_mastered && " · ✓ Mastered"}
              </div>
            )}
          </div>
          <button onClick={() => deleteCard(card.id)} style={{ padding: "6px 10px", borderRadius: 8, background: "transparent", border: `1px solid ${C.border}`, color: C.red, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>×</button>
        </div>
      ))}

      {!loading && cards.length === 0 && (
        <div style={{ padding: 32, textAlign: "center", color: C.textMuted, fontSize: 13 }}>No cards yet — add your first one above!</div>
      )}
    </div>
  );
}
