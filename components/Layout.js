import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { C } from "./ui";
import { useEffect, useState } from "react";

const TABS = [
  { id: "dashboard",        href: "/dashboard",        icon: "⌂",  label: "Home" },
  { id: "learn",            href: "/learn",            icon: "📚", label: "Learn" },
  { id: "flashcards",       href: "/flashcards",       icon: "🗂",  label: "Cards" },
  { id: "ai",               href: "/ai",               icon: "✦",  label: "AI Tutor" },
  { id: "exams",            href: "/exams",            icon: "📝", label: "Exams" },
  { id: "super-curricular", href: "/super-curricular", icon: "🌟", label: "Super Curr." },
  { id: "social",           href: "/social",           icon: "👥", label: "Social" },
  { id: "analytics",        href: "/analytics",        icon: "📊", label: "Analytics" },
  { id: "tutoring",         href: "/tutoring",         icon: "🎓", label: "Tutoring" },
  { id: "classes",          href: "/classes",          icon: "🏫", label: "Classes" },
  { id: "settings",         href: "/settings",         icon: "⚙",  label: "Settings" },
];

// Bottom nav shows 6 most important tabs on mobile
const MOBILE_TABS = ["dashboard","learn","flashcards","exams","ai","social"];

const NO_NAV = ["/", "/login", "/register", "/onboarding", "/forgot-password", "/verify"];

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

  if (noNav) return (
    <div style={{ background: C.bg, height: "100vh", overflow: "hidden" }}>
      <div style={{ height: "100%", overflowY: "auto" }}>{children}</div>
    </div>
  );

  // ── Desktop ────────────────────────────────────────────────────────────────
  if (isDesktop) return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: C.bg }}>
      <div style={{
        width: 220, flexShrink: 0, height: "100vh",
        background: C.surface, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ padding: "20px 20px 16px", flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: "var(--font-serif)", marginBottom: 14 }}>✦ EduPositive</div>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,var(--accent),#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {(user.username||"?").slice(0,2).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.username}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>L{user.level} · {user.xp?.toLocaleString()} XP</div>
              </div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: "0 10px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <Link key={tab.id} href={tab.href} style={{ textDecoration: "none", display: "block" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8,
                  background: active ? "var(--accent-soft)" : "transparent",
                  border: `1px solid ${active ? "var(--accent-glow)" : "transparent"}`,
                  cursor: "pointer",
                }}>
                  <span style={{ fontSize: 15, width: 20, textAlign: "center", flexShrink: 0 }}>{tab.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? C.accent : C.textSec }}>{tab.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {user && (
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 16, flexShrink: 0, alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--amber)" }}>{user.streak||0}🔥</div>
              <div style={{ fontSize: 9, color: C.textMuted }}>Streak</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.accent }}>L{user.level||1}</div>
              <div style={{ fontSize: 9, color: C.textMuted }}>Level</div>
            </div>
            {user.role === "admin" && (
              <div style={{ marginLeft: "auto" }}>
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "var(--accent-soft)", color: C.accent, fontWeight: 700 }}>Admin</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1, height: "100vh", overflowY: "auto" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 28px" }}>
          {children}
        </div>
      </div>
    </div>
  );

  // ── Mobile ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, height: "100vh", overflow: "hidden", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <main style={{ height: "100vh", overflowY: "auto", paddingBottom: 80 }}>{children}</main>
      <nav style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: "rgba(18,18,26,0.97)", backdropFilter: "blur(20px)",
        borderTop: `1px solid ${C.border}`, display: "flex", padding: "6px 0 18px", zIndex: 100,
      }}>
        {TABS.filter(t => MOBILE_TABS.includes(t.id)).map(tab => {
          const active = activeTab === tab.id;
          return (
            <Link key={tab.id} href={tab.href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, textDecoration: "none", padding: "3px 0" }}>
              <div style={{
                width: active ? 34 : 26, height: active ? 34 : 26, borderRadius: active ? 9 : 7,
                background: active ? "var(--accent-soft)" : "transparent",
                border: `1px solid ${active ? C.accent : "transparent"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: active ? 16 : 14, transition: "all 0.2s",
              }}>{tab.icon}</div>
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 400, color: active ? C.accent : C.textMuted }}>{tab.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
