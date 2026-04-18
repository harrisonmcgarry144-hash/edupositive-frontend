import { useState, useEffect, useRef } from "react";
import { paymentsApi, usersApi } from "../lib/api";
import { C } from "./ui";
import Link from "next/link";

export function useStudyLimit() {
  const [minutesUsed, setMinutesUsed] = useState(0);
  const [isPremium, setIsPremium] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    Promise.all([
      paymentsApi.status().catch(() => ({ isPremium: true })),
      usersApi.studyTimeToday().catch(() => ({ minutesStudied: 0 })),
    ]).then(([pStatus, timeData]) => {
      setIsPremium(pStatus.isPremium);
      setMinutesUsed(timeData.minutesStudied || 0);
      setLoaded(true);
    });

    // Log study time every minute
    intervalRef.current = setInterval(() => {
      usersApi.logStudyTime(1).catch(() => {});
      setMinutesUsed(m => m + 1);
    }, 60000);

    return () => clearInterval(intervalRef.current);
  }, []);

  const isLimited = !isPremium && minutesUsed >= 60;
  const isSunday = new Date().getDay() === 0;

  return { minutesUsed, isPremium: isPremium || isSunday, isLimited: isLimited && !isSunday, loaded };
}

export function StudyLimitBanner({ minutesUsed, isPremium }) {
  const isSunday = new Date().getDay() === 0;
  if (isPremium || isSunday) return null;
  
  const remaining = Math.max(0, 60 - minutesUsed);
  const pct = Math.min(100, (minutesUsed / 60) * 100);
  
  if (minutesUsed < 45) return null; // Only show when getting close

  return (
    <div style={{
      position: "fixed", bottom: 70, left: 0, right: 0, zIndex: 50,
      padding: "10px 16px", background: remaining <= 10 ? "rgba(239,68,68,0.95)" : "rgba(245,158,11,0.95)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>
        {remaining <= 0 ? "Daily study limit reached" : `${remaining} min of free study left today`}
      </div>
      <Link href="/premium" style={{ fontSize: 12, color: "#fff", fontWeight: 700, padding: "4px 10px", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 100 }}>
        Upgrade →
      </Link>
    </div>
  );
}

export function StudyLimitWall() {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 32, textAlign: "center",
    }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>⏱</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8, fontFamily: "var(--font-serif)" }}>
        Daily study limit reached
      </h2>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 8, maxWidth: 300, lineHeight: 1.6 }}>
        Free accounts can study for 1 hour per day. Upgrade to Premium for unlimited study time.
      </p>
      <p style={{ fontSize: 13, color: "#22d3a0", marginBottom: 28, fontWeight: 600 }}>
        🎉 Come back on Sunday for free unlimited access
      </p>
      <Link href="/premium">
        <button style={{ padding: "12px 32px", borderRadius: 12, background: "#6c63ff", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Get Premium →
        </button>
      </Link>
      <Link href="/dashboard" style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
        Back to dashboard
      </Link>
    </div>
  );
}
