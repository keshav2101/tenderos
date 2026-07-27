"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Search, BarChart3, BookmarkCheck,
  Bell, Settings, Zap, Building2, Shield, LogOut, Radio
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchRealtimeNotifications } from "@/lib/notifications-store";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/search", icon: Search, label: "Search Tenders" },
  { href: "/dashboard/intelligence", icon: Zap, label: "Procurement Intelligence" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/watchlist", icon: BookmarkCheck, label: "Watchlist" },
  { href: "/dashboard/notifications", icon: Bell, label: "Notifications", isNotification: true },
];

const SECONDARY_NAV = [
  { href: "/dashboard/profile", icon: Building2, label: "Company Profile" },
  { href: "/dashboard/connectors", icon: Radio, label: "Connectors Hub" },
  { href: "/dashboard/admin", icon: Shield, label: "Admin Panel" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const PLAN_LABELS: Record<string, string> = {
  free: "Free Plan",
  sme: "SME Plan",
  enterprise: "Enterprise",
  api: "API Plan",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const isGuestPath = pathname === "/dashboard/search" || pathname.startsWith("/dashboard/tenders/");

  // Load dynamic unread notification count
  async function syncNotifications() {
    try {
      const notifs = await fetchRealtimeNotifications();
      const count = notifs.filter((n) => !n.read).length;
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }

  useEffect(() => {
    syncNotifications();
    window.addEventListener("tenderos-notifications-updated", syncNotifications);
    return () => window.removeEventListener("tenderos-notifications-updated", syncNotifications);
  }, []);

  // Auth guard — redirect unauthenticated users to /login ONLY on protected pages
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isGuestPath) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, isGuestPath, router]);

  if (isLoading || (!user && !isGuestPath)) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--color-bg-primary)" }}>
        <div className="auth-spinner" style={{ width: "2rem", height: "2rem", borderWidth: "3px" }} />
      </div>
    );
  }

  const activeUser = user || {
    name: "Guest User",
    email: "guest@tenderos.in",
    role: "viewer" as const,
    plan: "free" as const,
    company_id: null,
  };

  const initials = activeUser.name
    ? activeUser.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : activeUser.email.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-bg-primary)" }}>
      {/* ─── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-subtle"
        style={{ background: "var(--color-bg-secondary)" }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-subtle">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6172f3, #a855f7)" }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-primary">TenderOS</div>
            <div className="text-[10px] text-muted">AI Procurement</div>
          </div>
        </div>

        {/* Primary navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label, isNotification }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            const needsAuth = href !== "/dashboard/search";
            const locked = needsAuth && !isAuthenticated;

            return (
              <Link key={href} href={locked ? "/login" : href}
                className={`nav-item ${active ? "active" : ""} ${locked ? "opacity-60 hover:opacity-100" : ""}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{label} {locked && "🔒"}</span>
                {!locked && isNotification && unreadCount > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold animate-pulse"
                    style={{ background: "#4c51e8", color: "white" }}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4 pb-2">
            <p className="px-3 text-[10px] font-medium text-muted uppercase tracking-wider font-semibold">Account</p>
          </div>

          {SECONDARY_NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            const locked = !isAuthenticated;

            return (
              <Link key={href} href={locked ? "/login" : href}
                className={`nav-item ${active ? "active" : ""} ${locked ? "opacity-60 hover:opacity-100" : ""}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{label} {locked && "🔒"}</span>
              </Link>
            );
          })}
        </nav>

        {/* User footer — wired to real auth context / guest sign in */}
        <div className="px-3 py-4 border-t border-subtle">
          {isAuthenticated ? (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl"
              style={{ background: "var(--color-bg-elevated)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #6172f3, #a855f7)", color: "white" }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-primary truncate">{activeUser.name}</div>
                <div className="text-[10px] text-muted">{PLAN_LABELS[activeUser.plan] ?? activeUser.plan}</div>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="btn-ghost p-1 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5 text-muted hover:text-primary transition-colors" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link href="/login" className="btn btn-primary w-full text-center py-2 text-xs font-semibold">
                Sign In
              </Link>
              <p className="text-[10px] text-muted text-center">Sign in to unlock watchlist & proposals</p>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Main Content ───────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

