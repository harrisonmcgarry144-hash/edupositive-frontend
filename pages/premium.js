import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { paymentsApi } from "../lib/api";
import { Btn, C, Spinner } from "../components/ui";
import Link from "next/link";

const FEATURES = [
  { icon: "✦", label: "AI Tutor", desc: "Unlimited AI chat, Blurt & Feynman mode" },
  { icon: "🌍", label: "Super Curricular", desc: "University prep resources & activities" },
  { icon: "🏫", label: "Teacher Mode", desc: "Create classes, assign work, track students" },
  { icon: "⏱", label: "Unlimited Study Time", desc: "No daily 1-hour limit" },
  { icon: "📊", label: "Advanced Analytics", desc: "Deep progress insights & predictions" },
];

export default function Premium() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    paymentsApi.status().then(setStatus).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const subscribe = async () => {
    setSubscribing(true);
    try {
      const { url } = await paymentsApi.createCheckout();
      window.location.href = url;
    } catch (e) {
      alert(e.message);
      setSubscribing(false);
    }
  };

  const cancel = async () => {
    if (!confirm("Cancel your subscription? You'll keep premium until the end of your billing period.")) return;
    try {
      await paymentsApi.cancel();
      alert("Subscription cancelled. You'll keep access until your billing period ends.");
      const fresh = await paymentsApi.status();
      setStatus(fresh);
    } catch (e) { alert(e.message); }
  };

  const isSunday = new Date().getDay() === 0;

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={32} /></div>;

  return (
    <div style={{ padding: "20px 16px 100px", maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 8, fontFamily: "var(--font-serif)" }}>
          EduPositive Premium
        </h1>
        <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.6 }}>
          Unlock everything and give yourself the best chance at top grades.
        </p>
      </div>

      {/* Sunday banner */}
      {isSunday && (
        <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(34,211,160,0.1)", border: "1px solid rgba(34,211,160,0.3)", marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>🎉</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>It's Sunday — all premium features are free today!</div>
          <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>Every Sunday, everyone gets full access for free.</div>
        </div>
      )}

      {/* Already premium */}
      {status?.isPremium && !isSunday && (
        <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(99,102,241,0.1)", border: "1px solid var(--accent-glow)", marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>✦ You have Premium</div>
          {status.premiumUntil && (
            <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>
              Active until {new Date(status.premiumUntil).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          )}
        </div>
      )}

      {/* Features list */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          What you get
        </div>
        {FEATURES.map(f => (
          <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              {f.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{f.label}</div>
              <div style={{ fontSize: 12, color: C.textSec }}>{f.desc}</div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 16, color: C.green }}>✓</div>
          </div>
        ))}
      </div>

      {/* Price */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: C.text }}>£7.99</div>
        <div style={{ fontSize: 13, color: C.textSec }}>per month · cancel anytime</div>
        <div style={{ fontSize: 12, color: C.green, marginTop: 4 }}>🎉 Always free on Sundays</div>
      </div>

      {/* CTA */}
      {!status?.isPremium || isSunday ? (
        <Btn onClick={subscribe} disabled={subscribing} style={{ width: "100%", padding: "14px", fontSize: 16, marginBottom: 12 }}>
          {subscribing ? "Redirecting to payment…" : "Get Premium →"}
        </Btn>
      ) : (
        <button onClick={cancel} style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${C.red}`, background: "transparent", color: C.red, fontSize: 14, cursor: "pointer", marginBottom: 12 }}>
          Cancel subscription
        </button>
      )}

      <div style={{ textAlign: "center", fontSize: 12, color: C.textMuted }}>
        Secure payment via Stripe · No hidden fees
      </div>
    </div>
  );
}
