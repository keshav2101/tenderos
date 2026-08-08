"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Search, FileText, BookmarkCheck, Bell,
  Settings, Zap, Building2, Shield, LogOut, Radio, BarChart3,
  Sparkles, Sun, Moon, ChevronRight, Users, FolderOpen,
  ShieldCheck, Clock, AlertTriangle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchRealtimeNotifications } from "@/lib/notifications-store";
import { CommandPalette } from "@/app/components/CommandPalette";

/* ─── Navigation structure ───────────────────────────────────────────────────── */

interface NavItem {
  href: string;
  icon: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
  label: string;
  desc: string;
  isNotification?: boolean;
  guestOk?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Discovery",
    items: [
      { href: "/dashboard",              icon: LayoutDashboard, label: "Command Center",       desc: "Overview & live feed" },
      { href: "/dashboard/search",       icon: Search,          label: "Tender Search",        desc: "Search 9,763 tenders",  guestOk: true },
      { href: "/dashboard/watchlist",    icon: BookmarkCheck,   label: "Watchlist",            desc: "Saved opportunities" },
      { href: "/dashboard/compare",      icon: FileText,        label: "Compare",              desc: "Side-by-side analysis" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/dashboard/intelligence", icon: Sparkles,        label: "AI Copilot",           desc: "Bid assessment & RAG" },
      { href: "/dashboard/analytics",    icon: BarChart3,       label: "Market Analytics",     desc: "Spend, ministries, states" },
      { href: "/dashboard/notifications",icon: Bell,            label: "Notifications",        desc: "Amendments & alerts", isNotification: true },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/dashboard/profile",      icon: Building2,       label: "Company Profile",      desc: "Digital twin" },
      { href: "/dashboard/connectors",   icon: Radio,           label: "Portal Connectors",    desc: "36 State/UT portals" },
      { href: "/dashboard/admin",        icon: Shield,          label: "Admin Console",        desc: "System administration" },
      { href: "/dashboard/settings",     icon: Settings,        label: "Settings",             desc: "Preferences" },
    ],
  },
];

const PLAN_LABELS: Record<string, string> = {
  free: "Free Plan",
  sme: "SME Plan",
  enterprise: "Enterprise AI",
  api: "API Plan",
};

/* ─── Sync timestamp ─────────────────────────────────────────────────────────── */
function useSyncTime() {
  const [syncTime, setSyncTime] = useState("");
  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      setSyncTime(
        now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
        ", " +
        now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
      );
    };
    fmt();
    const id = setInterval(fmt, 60000);
    return () => clearInterval(id);
  }, []);
  return syncTime;
}

/* ─── Component ──────────────────────────────────────────────────────────────── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  const [unreadCount,   setUnreadCount]   = useState(0);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [theme,         setTheme]         = useState<"light" | "dark">("light");
  const syncTime = useSyncTime();

  const isGuestPath = pathname === "/dashboard/search" || pathname.startsWith("/dashboard/tenders/");

  /* Theme */
  useEffect(() => {
    const saved = typeof window !== "undefined"
      ? (localStorage.getItem("tenderos-theme") as "light" | "dark" | null)
      : null;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("tenderos-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  /* Notifications */
  const syncNotifs = useCallback(async () => {
    try {
      const n = await fetchRealtimeNotifications();
      setUnreadCount(n.filter(x => !x.read).length);
    } catch { setUnreadCount(0); }
  }, []);

  useEffect(() => {
    syncNotifs();
    window.addEventListener("tenderos-notifications-updated", syncNotifs);
    return () => window.removeEventListener("tenderos-notifications-updated", syncNotifs);
  }, [syncNotifs]);

  /* Cmd+K */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen(p => !p);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* Auth guard */
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isGuestPath) router.replace("/login");
  }, [isLoading, isAuthenticated, isGuestPath, router]);

  if (isLoading || (!user && !isGuestPath)) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--bg-canvas)" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--brand)", animation: "spin 0.65s linear infinite" }} />
      </div>
    );
  }

  const activeUser = user || {
    name: "Guest Operator", email: "guest@tenderos.in",
    role: "viewer" as const, plan: "free" as const, company_id: null,
  };

  const initials = activeUser.name
    ? activeUser.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : activeUser.email.slice(0, 2).toUpperCase();

  return (
    <div className="app-shell" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Global Command Palette */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      {/* ── Sidebar — always dark navy ────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap style={{ width: 15, height: 15, color: "#fff" }} />
          </div>
          <div>
            <div className="sidebar-logo-text">TenderOS</div>
            <div className="sidebar-logo-sub">India Procurement Intelligence</div>
          </div>
        </div>

        {/* Search trigger */}
        <div className="sidebar-search">
          <button className="sidebar-search-btn" onClick={() => setIsCommandOpen(true)}>
            <Search style={{ width: 13, height: 13 }} />
            <span style={{ flex: 1, textAlign: "left" }}>Search tenders…</span>
            <kbd className="kbd-hint" style={{ fontSize: 9 }}>⌘K</kbd>
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <div className="sidebar-section">{group.label}</div>
              {group.items.map(({ href, icon: Icon, label, isNotification, guestOk }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                const needsAuth = !guestOk;
                const locked = needsAuth && !isAuthenticated;

                return (
                  <Link
                    key={href}
                    href={locked ? "/login" : href}
                    className={`nav-item${active ? " active" : ""}${locked ? " opacity-50" : ""}`}
                  >
                    <Icon className="nav-item-icon" style={{ width: 15, height: 15 }} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {!locked && isNotification && unreadCount > 0 && (
                      <span className="nav-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer: theme + user */}
        <div className="sidebar-footer">
          <button
            onClick={toggleTheme}
            className="nav-item"
            style={{ width: "100%", marginBottom: 8, background: "none", border: "none", padding: "5px 6px" }}
          >
            {theme === "light"
              ? <Moon style={{ width: 14, height: 14, color: "var(--sidebar-icon)" }} />
              : <Sun  style={{ width: 14, height: 14, color: "#fbbf24" }} />
            }
            <span style={{ fontSize: 12, color: "var(--sidebar-section)" }}>
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </span>
          </button>

          {isAuthenticated ? (
            <div className="sidebar-user">
              <div className="sidebar-avatar">{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="sidebar-user-name">{activeUser.name}</div>
                <div className="sidebar-user-plan">{PLAN_LABELS[activeUser.plan] ?? activeUser.plan}</div>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "var(--sidebar-section)", display: "flex", borderRadius: 4 }}
              >
                <LogOut style={{ width: 13, height: 13 }} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Link href="/login" className="btn btn-primary" style={{ justifyContent: "center", fontSize: 12, padding: "7px 12px", width: "100%" }}>
                Sign In
              </Link>
              <p style={{ fontSize: 10, color: "var(--sidebar-section)", textAlign: "center" }}>
                Sign in to access AI features
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content column ───────────────────────────────────────────────── */}
      <div className="main-col">
        {/* Top bar */}
        <header className="topbar">
          {/* Page breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {NAV_GROUPS.flatMap(g => g.items).find(n =>
                n.href === pathname || (n.href !== "/dashboard" && pathname.startsWith(n.href))
              )?.label ?? "TenderOS"}
            </span>
          </div>

          {/* Global search */}
          <button className="topbar-search" onClick={() => setIsCommandOpen(true)}>
            <Search style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Search tender ID, title, organization, category…
            </span>
            <kbd>⌘K</kbd>
          </button>

          {/* Right controls */}
          <div className="topbar-right">
            <Link
              href="/dashboard/notifications"
              className="btn btn-ghost btn-icon"
              title="Notifications"
              style={{ position: "relative" }}
            >
              <Bell style={{ width: 16, height: 16 }} />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: 5, right: 5,
                  width: 7, height: 7, borderRadius: "50%",
                  background: "var(--error)",
                  border: "1.5px solid var(--bg-base)",
                }} />
              )}
            </Link>
          </div>
        </header>

        {/* Institutional info strip */}
        <div className="info-strip">
          <span className="info-strip-text">
            <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
              Government Procurement Intelligence
            </span>
            <span className="info-strip-sep">·</span>
            <span>Last data synchronisation: {syncTime}</span>
            <span className="info-strip-sep">·</span>
            <span>Sources: GeM · CPPP · IREPS · Defence · 36 State/UT Portals</span>
          </span>
          <span className="info-strip-live" style={{ marginLeft: "auto" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite" }} />
            Live
          </span>
        </div>

        {/* Page workspace */}
        <main className="page-canvas">
          {children}
        </main>
      </div>
    </div>
  );
}
