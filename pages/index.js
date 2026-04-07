import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { Btn, Spinner, C } from "../components/ui";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner size={32} />
    </div>
  );

  if (user) return null;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 32,
      background: `radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.12) 0%, transparent 60%), ${C.bg}`,
    }}>
      {/* Logo */}
      <div style={{
        width: 80, height: 80, borderRadius: 22,
        background: "linear-gradient(135deg, var(--accent), #a78bfa)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 36, marginBottom: 28,
        boxShadow: "0 20px 60px var(--accent-glow)",
      }}>✦</div>

      <h1 style={{
        fontSize: 38, fontWeight: 800, color: C.text,
        letterSpacing: "-0.03em", marginBottom: 8,
        fontFamily: "var(--font-serif)", textAlign: "center",
      }}>EduPositive</h1>

      <p style={{
        color: C.textSec, fontSize: 15, marginBottom: 12,
        textAlign: "center", maxWidth: 280, lineHeight: 1.6,
      }}>
        Learn deeper. Remember longer. Achieve more.
      </p>

      <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 48, textAlign: "center" }}>
        AI-powered revision for GCSE & A-Level students
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320 }}>
        <Link href="/register">
          <Btn style={{ width: "100%", padding: "14px", fontSize: 15 }}>Create Free Account</Btn>
        </Link>
        <Link href="/login">
          <Btn variant="ghost" style={{ width: "100%", padding: "14px", fontSize: 15 }}>Sign In</Btn>
        </Link>
        <Link href="/dashboard" style={{ textAlign: "center" }}>
          <button style={{ background: "none", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer" }}>
            Skip for now →
          </button>
        </Link>
      </div>

      {/* Features row */}
      <div style={{ display: "flex", gap: 16, marginTop: 56, flexWrap: "wrap", justifyContent: "center" }}>
        {["🧠 Spaced Repetition", "✦ AI Tutor", "📝 Exam Practice", "🔥 Daily Streaks"].map(f => (
          <div key={f} style={{
            fontSize: 12, color: C.textSec, padding: "6px 12px",
            borderRadius: 100, border: `1px solid ${C.border}`,
          }}>{f}</div>
        ))}
      </div>
    </div>
  );
}
