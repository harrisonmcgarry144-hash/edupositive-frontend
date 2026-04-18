import { Btn, C } from "../../components/ui";
import Link from "next/link";

export default function PremiumSuccess() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 8, fontFamily: "var(--font-serif)" }}>Welcome to Premium!</h1>
      <p style={{ fontSize: 14, color: C.textSec, marginBottom: 32, maxWidth: 300, lineHeight: 1.6 }}>
        All premium features are now unlocked. Start using the AI Tutor, Super Curricular and more.
      </p>
      <Link href="/dashboard"><Btn style={{ padding: "12px 32px", fontSize: 15 }}>Go to Dashboard →</Btn></Link>
    </div>
  );
}
