import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { flashcardsApi } from "../../lib/api";
import { Card, Btn, Tag, C, Spinner, Modal, Input, Empty } from "../../components/ui";
import Link from "next/link";

export default function Flashcards() {
  const { user } = useAuth();
  const [decks, setDecks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showNew, setShowNew]   = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [due, setDue]           = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      flashcardsApi.decks(),
      flashcardsApi.due(),
    ]).then(([d, due]) => {
      setDecks(d || []);
      setDue((due || []).length);
    }).finally(() => setLoading(false));
  }, [user]);

  const createDeck = async () => {
    if (!newTitle.trim()) return;
    const deck = await flashcardsApi.createDeck({ title: newTitle });
    setDecks(p => [deck, ...p]);
    setNewTitle(""); setShowNew(false);
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding: 60 }}><Spinner size={32}/></div>;

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: "var(--font-serif)" }}>Flashcards</h1>
        <Btn onClick={() => setShowNew(true)} style={{ padding:"8px 16px", fontSize: 13 }}>+ New Deck</Btn>
      </div>
      <p style={{ fontSize: 13, color: C.textSec, marginBottom: 20 }}>{decks.length} decks · {due} cards due today</p>

      {due > 0 && (
        <Link href="/flashcards/review">
          <div style={{
            padding: "16px 20px", borderRadius: 14, marginBottom: 16, cursor:"pointer",
            background: "linear-gradient(135deg, var(--accent-soft), var(--surface-high))",
            border: `1px solid var(--accent-glow)`,
            display:"flex", justifyContent:"space-between", alignItems:"center",
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Review Due Cards</div>
              <div style={{ fontSize: 12, color: C.textSec }}>{due} cards due today</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.accent }}>{due}</div>
          </div>
        </Link>
      )}

      {decks.length === 0 && <Empty icon="🗂" title="No decks yet" sub="Create your first deck to start learning" />}

      {decks.map(deck => (
        <Link key={deck.id} href={`/flashcards/${deck.id}`}>
          <div style={{
            padding: "16px 20px", borderRadius: 14,
            background: C.surface, border: `1px solid ${C.border}`,
            marginBottom: 10, cursor:"pointer",
            display:"flex", justifyContent:"space-between", alignItems:"center",
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{deck.title}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{deck.card_count} cards</div>
            </div>
            <div style={{ display:"flex", gap: 8, alignItems:"center" }}>
              {deck.is_official && <Tag color={C.accent}>Official</Tag>}
              {deck.is_public && <Tag color={C.green}>Public</Tag>}
              <span style={{ color: C.textMuted }}>→</span>
            </div>
          </div>
        </Link>
      ))}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Flashcard Deck">
        <div style={{ display:"flex", flexDirection:"column", gap: 14 }}>
          <Input placeholder="Deck name e.g. Cell Biology" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          <Btn onClick={createDeck} disabled={!newTitle.trim()} style={{ width:"100%", padding:"12px" }}>Create Deck</Btn>
        </div>
      </Modal>
    </div>
  );
}
