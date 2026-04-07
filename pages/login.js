import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { Btn, Input, C, Card } from "../components/ui";

export default function Login() {
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router    = useRouter();

  const handle = async () => {
    setError(""); setLoading(true);
    try {
      const user = await login(email, pass);
      if (!user.level_type) router.replace("/onboarding");
      else router.replace("/dashboard");
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24,
      background: C.bg,
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <Link href="/" style={{ display: "inline-block", marginBottom: 32 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>✦ EduPositive</div>
        </Link>

        <h2 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 6, fontFamily: "var(--font-serif)" }}>
          Welcome back
        </h2>
        <p style={{ color: C.textSec, fontSize: 13, marginBottom: 32 }}>Sign in to continue your journey</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} type="email" />
          <Input placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} type="password" />

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.12)", color: C.red, fontSize: 13 }}>
              {error}
            </div>
          )}

          <Btn onClick={handle} disabled={loading} style={{ marginTop: 4, padding: "13px", fontSize: 15, width: "100%" }}>
            {loading ? "Signing in…" : "Sign In"}
          </Btn>

          <div style={{ textAlign: "center" }}>
            <Link href="/forgot-password" style={{ fontSize: 13, color: C.textMuted }}>Forgot password?</Link>
          </div>

          <div style={{ textAlign: "center", fontSize: 13, color: C.textMuted }}>
            No account?{" "}
            <Link href="/register" style={{ color: C.accent, fontWeight: 600 }}>Sign up free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
