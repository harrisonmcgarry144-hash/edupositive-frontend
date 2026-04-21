import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../lib/api";
import { Btn, C } from "../components/ui";

export default function Verify() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [code, setCode]       = useState(["", "", "", ""]);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResend]= useState(false);
  const [resent, setResent]   = useState(false);
  const inputs = [useRef(), useRef(), useRef(), useRef()];

useEffect(() => {
    if (user?.is_verified || user?.isVerified) router.replace("/onboarding");
  }, [user]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    if (val && i < 3) inputs[i + 1].current?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs[i - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      setCode(pasted.split(""));
      inputs[3].current?.focus();
    }
  };

  const submit = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 4) return;
    setError(""); setLoading(true);
    try {
      await authApi.verifyCode(fullCode);
      updateUser({ is_verified: true, isVerified: true });
      router.replace("/onboarding");
    } catch (e) {
      setError(e.message);
      setCode(["", "", "", ""]);
      inputs[0].current?.focus();
    } finally { setLoading(false); }
  };

  const resend = async () => {
    setResend(true);
    try {
      await authApi.resendCode();
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch(e) {}
    finally { setResend(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24, background: C.bg,
    }}>
      <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 8, fontFamily: "var(--font-serif)" }}>
          Check your email
        </h1>
        <p style={{ color: C.textSec, fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
          We sent a 4-digit code to your email address. Enter it below to verify your account.
        </p>

        {/* 4 digit inputs */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={inputs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              style={{
                width: 64, height: 72, textAlign: "center",
                fontSize: 32, fontWeight: 800, color: C.text,
                background: "var(--surface-high)",
                border: `2px solid ${digit ? C.accent : C.border}`,
                borderRadius: 14, outline: "none",
                caretColor: C.accent,
              }}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.12)", color: C.red, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {resent && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(34,211,160,0.12)", color: C.green, fontSize: 13, marginBottom: 16 }}>
            ✓ New code sent to your email
          </div>
        )}

        <Btn
          onClick={submit}
          disabled={loading || code.join("").length < 4}
          style={{ width: "100%", padding: "13px", fontSize: 15, marginBottom: 16 }}
        >
          {loading ? "Verifying…" : "Verify Email →"}
        </Btn>

        <button
          onClick={resend}
          disabled={resending}
          style={{ background: "none", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer" }}
        >
          {resending ? "Sending…" : "Didn't get a code? Resend"}
        </button>
      </div>
    </div>
  );
}
