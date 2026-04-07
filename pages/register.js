import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { Btn, Input, C } from "../components/ui";

export default function Register() {
  const [form, setForm]       = useState({ email:"", password:"", username:"", fullName:"" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const { register, login }   = useAuth();
  const router = useRouter();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handle = async () => {
    setError(""); setLoading(true);
    try {
      await register(form.email, form.password, form.username, form.fullName);
      // Auto sign in after registration
      await login(form.email, form.password);
      router.replace("/onboarding");
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24, background: C.bg,
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 8, fontFamily: "var(--font-serif)" }}>✦ EduPositive</div>
          <div style={{ fontSize: 13, color: C.accent, fontWeight: 600, letterSpacing: "0.05em" }}>A-LEVEL REVISION TOOL</div>
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 6, fontFamily: "var(--font-serif)" }}>
          Create your account
        </h2>
        <p style={{ color: C.textSec, fontSize: 13, marginBottom: 28 }}>Free forever. No credit card needed.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input placeholder="Full name" value={form.fullName} onChange={set("fullName")} />
          <Input placeholder="Username" value={form.username} onChange={set("username")} />
          <Input placeholder="Email address" value={form.email} onChange={set("email")} type="email" />
          <Input placeholder="Password (min 8 characters)" value={form.password} onChange={set("password")} type="password" />

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.12)", color: C.red, fontSize: 13 }}>
              {error}
            </div>
          )}

          <Btn onClick={handle} disabled={loading} style={{ marginTop: 4, padding: "13px", fontSize: 15, width: "100%" }}>
            {loading ? "Creating account…" : "Create Account"}
          </Btn>

          <div style={{ textAlign: "center", fontSize: 13, color: C.textMuted }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: C.accent, fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
