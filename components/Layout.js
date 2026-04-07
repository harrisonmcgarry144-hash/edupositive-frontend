import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { C } from "./ui";
import { useEffect, useState } from "react";

const TABS = [
  { id: "dashboard", href: "/dashboard",  icon: "⌂",  label: "Home" },
  { id: "learn",     href: "/learn",       icon: "📚", label: "Learn" },
  { id: "flashcards",href: "/flashcards",  icon: "🗂",  label: "Cards" },
  { id: "ai",        href: "/ai",          icon: "✦",  label: "AI Tutor" },
  { id: "exams",     href: "/exams",       icon: "📝", label: "Exams" },
  { id: "social",    href: "/social",      icon: "👥", label: "Social" },
  { id: "analytics", href: "/analytics",   icon: "📊", label: "Analytics" },
  { id: "settings",  href: "/settings",    icon: "⚙",  label: "Settings" },
];

const NO_NAV = ["/", "/login", "/register", "/onboarding", "/forgot-password"];

export default function Layout({ children }) {
  const router   = useRouter();
  const { user } = useAuth();
  const [isDesktop, setDesktop] = useState(false);

  useEffect(() => {
    const check = () => setDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const noNav     = NO_NAV.includes(router.pathname) || !user;
  const activeTab = TABS.find(t => router.pathname.startsWith(t.href))?.id;

  if (noNav) return <div style={{ background: C.bg, minHeight: "100vh" }}>{children}</div>;

  if (isDesktop) return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      <div style={{
        width: 240, flexShrink: 0, position: "fixed", top: 0, left: 0, height: "100vh",
        background: C.surface, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", padding: "28px 0", zIndex: 100,
      }}>
        <div style={{ padding: "0 24px 24px" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: "var(--font-serif)" }}>✦ EduPositive</div>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,var(--accent),#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {(user.username||"?").slice(0,2).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.username}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>Level {user.level} · {user.xp?.toLocaleString()} XP</div>
              </div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: "0 12px", overflowY: "auto" }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <Link key={tab.id} href={tab.href} style={{ textDecoration: "none", display: "block", marginBottom: 2 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10,
                  background: active ? "var(--accent-soft)" : "transparent",
                  border: `1px solid ${active ? "var(--accent-glow)" : "transparent"}`,
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: 18, width: 22, textAlign: "center" }}>{tab.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? C.accent : C.textSec }}>{tab.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {user && (
          <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--amber)" }}>{user.streak||0}🔥</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>Streak</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.accent }}>L{user.level||1}</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>Level</div>
            </div>
            {user.role === "admin" && (
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "var(--accent-soft)", color: C.accent, fontWeight: 700 }}>Admin</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginLeft: 240, flex: 1 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 32px" }}>
          {children}
        </div>
      </div>
    </div>
  );

  // Mobile bottom nav
  return (
    <div style={{ background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      <main style={{ paddingBottom: 80 }}>{children}</main>
      <nav style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: "rgba(18,18,26,0.95)", backdropFilter: "blur(20px)",
        borderTop: `1px solid ${C.border}`, display: "flex", padding: "8px 0 20px", zIndex: 100,
      }}>
        {TABS.slice(0, 6).map(tab => {
          const active = activeTab === tab.id;
          return (
            <Link key={tab.id} href={tab.href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", padding: "4px 0" }}>
              <div style={{
                width: active ? 36 : 28, height: active ? 36 : 28, borderRadius: active ? 10 : 8,
                background: active ? "var(--accent-soft)" : "transparent",
                border: `1px solid ${active ? C.accent : "transparent"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: active ? 17 : 15, transition: "all 0.2s",
              }}>{tab.icon}</div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? C.accent : C.textMuted }}>{tab.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
