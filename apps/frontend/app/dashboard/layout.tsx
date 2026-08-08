"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Search, BarChart3, BookmarkCheck,
  Bell, Settings, Zap, Building2, Shield, LogOut, Radio,
  Command, Sparkles, Sun, Moon, ChevronDown
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchRealtimeNotifications } from "@/lib/notifications-store";
import { CommandPalette } from "@/app/components/CommandPalette";

const NAV_ITEMS = [
  { href: "/dashboard",             icon: LayoutDashboard, label: "Command Center" },
  { href: "/dashboard/search",      icon: Search,          label: "Tender Search" },
  { href: "/dashboard/intelligence",icon: Sparkles,        label: "AI Copilot" },
  { href: "/dashboard/analytics",   icon: BarChart3,       label: "Market Analytics" },
  { href: "/dashboard/watchlist",   icon: BookmarkCheck,   label: "Watchlist" },
  { href: "/dashboard/notifications",icon: Bell,           label: "Notifications", isNotification: true },
];

const SECONDARY_NAV = [
  { href: "/dashboard/profile",    icon: Building2, label: "Digital Twin" },
  { href: "/dashboard/connectors", icon: Radio,     label: "Portal Hub" },
  { href: "/dashboard/admin",      icon: Shield,    label: "Admin" },
  { href: "/dashboard/settings",   icon: Settings,  label: "Settings" },
];

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  sme: "SME",
  enterprise: "Enterprise AI",
  api: "API",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  const [unreadCount,    setUnreadCount]    = useState<number>(0);
  const [isCommandOpen,  setIsCommandOpen]  = useState(false);
  const [theme,          setTheme]          = useState<"light" | "dark">("light");

  const isGuestPath = pathname === "/dashboard/search" || pathname.startsWith("/dashboard/tenders/");

  /* ── Theme persistence ──────────────────────────────────────────────────── */
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

  /* ── Notifications ──────────────────────────────────────────────────────── */
  async function syncNotifications() {
    try {
      const notifs = await fetchRealtimeNotifications();
      setUnreadCount(notifs.filter((n) => !n.read).length);
    } catch {
      setUnreadCount(0);
    }
  }

  useEffect(() => {
    syncNotifications();
    window.addEventListener("tenderos-notifications-updated", syncNotifications);
    return () => window.removeEventListener("tenderos-notifications-updated", syncNotifications);
  }, []);

  /* ── Cmd+K ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ── Auth guard ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isGuestPath) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, isGuestPath, router]);

  if (isLoading || (!user && !isGuestPath)) {
    return (
      <div
        style={{ background: "var(--bg-canvas)" }}
        className="flex h-screen items-center justify-center"
      >
        <div className="w-7 h-7 border-2 border-[var(--border)] border-t-[var(--brand)] rounded-full animate-spin" />
      </div>
    );
  }

  const activeUser = user || {
    name: "Guest Operator",
    email: "guest@tenderos.in",
    role: "viewer" as const,
    plan: "free"  as const,
    company_id: null,
  };

  const initials = activeUser.name
    ? activeUser.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : activeUser.email.slice(0, 2).toUpperCase();

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-canvas)", color: "var(--text-primary)" }}
    >
      {/* ── Command Palette ─────────────────────────────────────────────────── */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col"
        style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)" }}
      >
        {/* Logo mark */}
        <div className="px-4 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--brand)" }}
            >
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-sm font-bold tracking-tight"
                  style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
                >
                  TenderOS
                </span>
                <span
                  className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: "var(--brand-muted)", color: "var(--brand)", border: "1px solid var(--brand-border)" }}
                >
                  v2.6
                </span>
              </div>
              <div
                className="text-[10px] truncate mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                India Procurement OS
              </div>
            </div>
          </div>
        </div>

        {/* Search bar trigger */}
        <div className="px-3 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <button
            onClick={() => setIsCommandOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              fontSize: "12px",
            }}
          >
            <Search className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1">Search...</span>
            <kbd>⌘K</kbd>
          </button>
        </div>

        {/* Primary Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <div className="space-y-0.5">
            {NAV_ITEMS.map(({ href, icon: Icon, label, isNotification }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              const needsAuth = href !== "/dashboard/search";
              const locked   = needsAuth && !isAuthenticated;

              return (
                <Link
                  key={href}
                  href={locked ? "/login" : href}
                  className={`nav-link ${active ? "active" : ""} ${locked ? "opacity-50" : ""}`}
                >
                  <Icon
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: active ? "var(--brand)" : "var(--text-muted)" }}
                  />
                  <span className="flex-1 text-[13px]">{label}</span>
                  {!locked && isNotification && unreadCount > 0 && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "var(--brand)", color: "#fff" }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Secondary nav */}
          <div className="mt-6">
            <div className="nav-section-label">System</div>
            <div className="space-y-0.5 mt-2">
              {SECONDARY_NAV.map(({ href, icon: Icon, label }) => {
                const active = pathname === href;
                const locked = !isAuthenticated;

                return (
                  <Link
                    key={href}
                    href={locked ? "/login" : href}
                    className={`nav-link ${active ? "active" : ""} ${locked ? "opacity-50" : ""}`}
                  >
                    <Icon
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: active ? "var(--brand)" : "var(--text-muted)" }}
                    />
                    <span className="flex-1 text-[13px]">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* User footer */}
        <div
          className="px-3 py-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            className="nav-link w-full mb-2"
            style={{ justifyContent: "flex-start" }}
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
            ) : (
              <Sun className="w-4 h-4 flex-shrink-0" style={{ color: "#f59e0b" }} />
            )}
            <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
              {theme === "light" ? "Dark mode" : "Light mode"}
            </span>
          </button>

          {isAuthenticated ? (
            <div
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ background: "var(--brand)" }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[12px] font-semibold truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {activeUser.name}
                </div>
                <div
                  className="text-[10px] truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {PLAN_LABELS[activeUser.plan] ?? activeUser.plan}
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="p-1 rounded flex-shrink-0 transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Link
                href="/login"
                className="btn btn-primary w-full text-[12px] py-2"
                style={{ justifyContent: "center" }}
              >
                Sign In
              </Link>
              <p className="text-center text-[10px]" style={{ color: "var(--text-muted)" }}>
                Full AI bid generation requires sign in
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar — minimal, no status clutter */}
        <header
          className="h-12 px-6 flex items-center justify-between gap-4 flex-shrink-0"
          style={{
            background:  "var(--bg-base)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Breadcrumb-style location */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-[12px] font-medium truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {NAV_ITEMS.find(n => n.href === pathname || (n.href !== "/dashboard" && pathname.startsWith(n.href)))?.label
                ?? SECONDARY_NAV.find(n => n.href === pathname)?.label
                ?? "TenderOS"}
            </span>
          </div>

          {/* Right: Status pill + notifications */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{
                background: "var(--success-bg)",
                color: "var(--success)",
                border: "1px solid var(--success-border)",
              }}
            >
              <span className="status-dot status-dot-live" />
              Live — 9,763 tenders
            </div>

            <Link
              href="/dashboard/notifications"
              className="relative p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--brand)" }}
                />
              )}
            </Link>
          </div>
        </header>

        {/* Page workspace */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: "var(--bg-canvas)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
