import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { authApi } from "../../lib/api";
import { Btn, C, Spinner } from "../../components/ui";
import Link from "next/link";

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState("loading"); // loading | success | error

  useEffect(() => {
    if (!token) return;
    authApi.verifyEmail ? 
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify/${token}`)
        .then(r => r.json())
        .then(d => setStatus(d.message ? "success" : "error"))
        .catch(() => setStatus("error"))
      : setStatus("success");
  }, [token]);

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, background:C.bg }}>
      {status === "loading" && <Spinner size={32} />}
      {status === "success" && (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
          <h2 style={{ fontSize:24, fontWeight:800, color:"var(--text-primary)", marginBottom:8 }}>Email verified!</h2>
          <p style={{ color:"var(--text-secondary)", marginBottom:24 }}>Your account is now active.</p>
          <Link href="/login"><Btn style={{ padding:"13px 32px" }}>Sign In →</Btn></Link>
        </div>
      )}
      {status === "error" && (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>❌</div>
          <h2 style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)", marginBottom:8 }}>Link expired</h2>
          <p style={{ color:"var(--text-secondary)", marginBottom:24 }}>This verification link has expired or is invalid.</p>
          <Link href="/register"><Btn variant="ghost" style={{ padding:"13px 32px" }}>Register again</Btn></Link>
        </div>
      )}
    </div>
  );
}
