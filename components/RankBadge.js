// components/RankBadge.js
import { C } from "./ui";

const RANK_STYLES = {
  "Champion": { emoji: "⚡", color: "#00BFFF", bg: "rgba(0,191,255,0.15)", border: "rgba(0,191,255,0.4)" },
  "Diamond":  { emoji: "💎", color: "#a78bfa", bg: "rgba(167,139,250,0.15)", border: "rgba(167,139,250,0.4)" },
  "Gold":     { emoji: "🥇", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)" },
  "Silver":   { emoji: "🥈", color: "#94a3b8", bg: "rgba(148,163,184,0.15)", border: "rgba(148,163,184,0.4)" },
  "Bronze":   { emoji: "🥉", color: "#cd7f32", bg: "rgba(205,127,50,0.15)",  border: "rgba(205,127,50,0.4)"  },
};

export function RankBadge({ rank, isTop100, size = "sm" }) {
  const style = RANK_STYLES[rank] || RANK_STYLES["Bronze"];
  const isSmall = size === "sm";

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {isTop100 && (
        <span style={{
          fontSize: isSmall ? 10 : 12, fontWeight: 800, color: "#FFD700",
          padding: isSmall ? "1px 5px" : "2px 8px",
          background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.4)",
          borderRadius: 100,
        }}>👑 TOP 100</span>
      )}
      <span style={{
        fontSize: isSmall ? 10 : 12, fontWeight: 700, color: style.color,
        padding: isSmall ? "1px 6px" : "2px 10px",
        background: style.bg, border: `1px solid ${style.border}`,
        borderRadius: 100, display: "inline-flex", alignItems: "center", gap: 3,
      }}>
        {style.emoji} {rank}
      </span>
    </div>
  );
}

export { RANK_STYLES };
