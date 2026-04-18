import { C, Btn } from "./ui";
import Link from "next/link";

export default function PremiumGate({ feature, icon }) {
  const isSunday = new Date().getDay() === 0;

  if (isSunday) return null; // Free on Sundays - don't show gate

  return (
    <div style={{
      minHeight: "60vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center"
    }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{icon || "✦"}</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8, fontFamily: "var(--font-serif)" }}>
        {feature} is a Premium feature
      </h2>
      <p style={{ fontSize: 14, color: C.textSec, marginBottom: 12, maxWidth: 300, lineHeight: 1.6 }}>
        Unlock {feature} and all other premium features for £7.99/month.
      </p>
      <p style={{ fontSize: 13, color: C.green, marginBottom: 28, fontWeight: 600 }}>
        🎉 Always free on Sundays
      </p>
      <Link href="/premium">
        <Btn style={{ padding: "12px 32px", fontSize: 15 }}>Get Premium →</Btn>
      </Link>
      <Link href="/dashboard" style={{ marginTop: 16, fontSize: 13, color: C.textMuted }}>
        Back to dashboard
      </Link>
    </div>
  );
}
