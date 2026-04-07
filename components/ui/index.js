// ── Design tokens ─────────────────────────────────────────────────────────────
export const C = {
  bg: "var(--bg)", surface: "var(--surface)", surfaceHigh: "var(--surface-high)",
  border: "var(--border)", accent: "var(--accent)", accentSoft: "var(--accent-soft)",
  green: "var(--green)", greenSoft: "var(--green-soft)", amber: "var(--amber)",
  red: "var(--red)", text: "var(--text-primary)", textSec: "var(--text-secondary)",
  textMuted: "var(--text-muted)",
};

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, glow }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${glow ? "var(--accent-glow)" : C.border}`,
      borderRadius: 16, padding: 20,
      boxShadow: glow ? "0 0 30px var(--accent-glow)" : "none",
      ...style,
    }}>{children}</div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
const btnStyles = {
  primary: { background: C.accent, color: "#fff", border: "none" },
  ghost:   { background: "transparent", color: C.textSec, border: `1px solid ${C.border}` },
  danger:  { background: "rgba(239,68,68,0.12)", color: C.red, border: "1px solid rgba(239,68,68,0.3)" },
  success: { background: "var(--green-soft)", color: C.green, border: "1px solid rgba(34,211,160,0.3)" },
};

export function Btn({ children, variant = "primary", onClick, style, disabled, type = "button" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...btnStyles[variant],
      padding: "11px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s",
      opacity: disabled ? 0.5 : 1, ...style,
    }}>{children}</button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ placeholder, value, onChange, type = "text", style, rows, label }) {
  const baseStyle = {
    width: "100%", padding: "12px 16px",
    background: "var(--surface-high)", border: `1px solid ${C.border}`,
    borderRadius: 10, color: C.text, fontSize: 14,
    outline: "none", fontFamily: "var(--font)", ...style,
  };
  return (
    <div style={{ width: "100%" }}>
      {label && <div style={{ fontSize: 12, color: C.textSec, marginBottom: 6, fontWeight: 600 }}>{label}</div>}
      {rows
        ? <textarea placeholder={placeholder} value={value} onChange={onChange} rows={rows} style={{ ...baseStyle, resize: "vertical" }} />
        : <input type={type} placeholder={placeholder} value={value} onChange={onChange} style={baseStyle} />
      }
    </div>
  );
}

// ── Tag ───────────────────────────────────────────────────────────────────────
export function Tag({ children, color = C.accent }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", padding: "3px 8px", borderRadius: 4,
      background: color + "22", color,
    }}>{children}</span>
  );
}

// ── Pill ──────────────────────────────────────────────────────────────────────
export function Pill({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 18px", borderRadius: 100,
      border: `1px solid ${active ? C.accent : C.border}`,
      background: active ? "var(--accent-soft)" : "transparent",
      color: active ? C.accent : C.textSec,
      fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
      whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = C.accent, height = 6 }) {
  return (
    <div style={{ background: "var(--surface-high)", borderRadius: 100, height, overflow: "hidden" }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, value || 0))}%`, height: "100%",
        borderRadius: 100, background: color, transition: "width 0.8s ease",
      }} />
    </div>
  );
}

// ── XP Bar ────────────────────────────────────────────────────────────────────
export function XPBar({ xp = 0, level = 1 }) {
  const pct = (xp % 500) / 500 * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: "var(--accent-soft)", border: `1px solid ${C.accent}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, color: C.accent, flexShrink: 0,
      }}>L{level}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: C.textSec }}>{xp?.toLocaleString()} XP</span>
          <span style={{ fontSize: 11, color: C.textMuted }}>{level * 500} XP</span>
        </div>
        <ProgressBar value={pct} />
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${C.border}`, borderTopColor: C.accent,
      borderRadius: "50%", animation: "spin 0.7s linear infinite",
    }} />
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ user, size = 40 }) {
  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt="" style={{ width: size, height: size, borderRadius: size / 4, objectFit: "cover" }} />;
  }
  const initials = (user?.username || user?.full_name || "?").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 4,
      background: `linear-gradient(135deg, ${C.accent}, #a78bfa)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 800, color: "#fff", flexShrink: 0,
    }}>{initials}</div>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────────
export function PageWrap({ children, style }) {
  return (
    <div className="page-enter" style={{
      padding: "20px 16px 100px", maxWidth: 480, margin: "0 auto", ...style,
    }}>{children}</div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
export function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: C.textMuted,
      letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12,
    }}>{children}</div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: C.textSec }}>{sub}</div>}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      zIndex: 200, backdropFilter: "blur(4px)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: "20px 20px 0 0", padding: 24, width: "100%",
        maxWidth: 480, maxHeight: "80vh", overflowY: "auto",
        animation: "slideUp 0.25s ease",
      }}>
        {title && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: "var(--font-serif)" }}>{title}</h3>
            <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 22, cursor: "pointer" }}>×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ message, type = "success", visible }) {
  if (!visible) return null;
  const bg = type === "success" ? C.green : type === "error" ? C.red : C.accent;
  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
      background: bg, color: "#fff", padding: "12px 20px", borderRadius: 10,
      fontSize: 14, fontWeight: 600, zIndex: 999, whiteSpace: "nowrap",
      animation: "fadeIn 0.2s ease",
    }}>{message}</div>
  );
}
