import { useState } from "react";
import Link from "next/link";
import { authApi } from "../lib/api";
import { Btn, Input, C } from "../components/ui";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent]   = useState(false);
  const [loading, setLoad]= useState(false);

  const submit = async () => {
    setLoad(true);
    await authApi.forgotPassword({ email }).catch(()=>{});
    setSent(true); setLoad(false);
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, background:C.bg }}>
      <div style={{ width:"100%", maxWidth:360 }}>
        <Link href="/login" style={{ display:"inline-block", marginBottom:32 }}>
          <div style={{ fontSize:24, fontWeight:800, color:C.text }}>✦ EduPositive</div>
        </Link>
        {sent ? (
          <div>
            <div style={{ fontSize:40, marginBottom:16 }}>📧</div>
            <h2 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:8 }}>Check your email</h2>
            <p style={{ color:C.textSec, fontSize:14, marginBottom:24, lineHeight:1.6 }}>If that email exists, we've sent a reset link. Check your inbox.</p>
            <Link href="/login"><Btn variant="ghost" style={{ width:"100%", padding:"13px" }}>← Back to login</Btn></Link>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize:26, fontWeight:800, color:C.text, marginBottom:6, fontFamily:"var(--font-serif)" }}>Forgot password?</h2>
            <p style={{ color:C.textSec, fontSize:13, marginBottom:32 }}>Enter your email and we'll send a reset link.</p>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <Input placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} type="email" />
              <Btn onClick={submit} disabled={loading || !email} style={{ padding:"13px", fontSize:15, width:"100%" }}>
                {loading ? "Sending…" : "Send Reset Link"}
              </Btn>
              <div style={{ textAlign:"center" }}>
                <Link href="/login" style={{ fontSize:13, color:C.textMuted }}>← Back to login</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
