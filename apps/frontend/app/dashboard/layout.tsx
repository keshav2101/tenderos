"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Search, BarChart3, BookmarkCheck,
  Bell, Settings, Zap, Building2, Shield, LogOut, Radio,
  Command, ChevronDown, CheckCircle2, Sliders, Layers, Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchRealtimeNotifications } from "@/lib/notifications-store";
import { CommandPalette } from "@/app/components/CommandPalette";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Command Center" },
  { href: "/dashboard/search", icon: Search, label: "Tender Search" },
  { href: "/dashboard/intelligence", icon: Zap, label: "AI Copilot & RAG" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Market Analytics" },
  { href: "/dashboard/watchlist", icon: BookmarkCheck, label: "Watchlist & Proposals" },
  { href: "/dashboard/notifications", icon: Bell, label: "Notifications", isNotification: true },
];

const SECONDARY_NAV = [
  { href: "/dashboard/profile", icon: Building2, label: "Digital Twin Profile" },
  { href: "/dashboard/connectors", icon: Radio, label: "Portals Hub (36 States/UTs)" },
  { href: "/dashboard/admin", icon: Shield, label: "Admin Console" },
  { href: "/dashboard/settings", icon: Settings, label: "System Settings" },
];

const PLAN_LABELS: Record<string, string> = {
  free: "Free Plan",
  sme: "SME Plan",
  enterprise: "Enterprise AI",
  api: "API Plan",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [workspace, setWorkspace] = useState("Enterprise India Procurement");

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

  // Keyboard shortcut listener for Cmd + K / Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auth guard — redirect unauthenticated users to /login ONLY on protected pages
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isGuestPath) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, isGuestPath, router]);

  if (isLoading || (!user && !isGuestPath)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="auth-spinner w-8 h-8 border-3 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const activeUser = user || {
    name: "Guest Operator",
    email: "guest@tenderos.in",
    role: "viewer" as const,
    plan: "free" as const,
    company_id: null,
  };

  const initials = activeUser.name
    ? activeUser.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : activeUser.email.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Global Command Palette */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      {/* ─── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-slate-200 bg-[#fcfcfd]">
        {/* Logo & Workspace Selector */}
        <div className="p-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-2xs">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                <span>TenderOS</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  v2.6
                </span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">{workspace}</div>
            </div>
          </div>
        </div>

        {/* Primary navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Core Operating System
          </div>
          {NAV_ITEMS.map(({ href, icon: Icon, label, isNotification }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            const needsAuth = href !== "/dashboard/search";
            const locked = needsAuth && !isAuthenticated;

            return (
              <Link
                key={href}
                href={locked ? "/login" : href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                } ${locked ? "opacity-60" : ""}`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-blue-600" : "text-slate-400"}`} />
                <span className="flex-1 truncate">{label}</span>
                {!locked && isNotification && unreadCount > 0 && (
                  <span className="w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold bg-blue-600 text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-5 pb-2 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Infrastructure & Control
          </div>

          {SECONDARY_NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            const locked = !isAuthenticated;

            return (
              <Link
                key={href}
                href={locked ? "/login" : href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? "bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                } ${locked ? "opacity-60" : ""}`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-blue-600" : "text-slate-400"}`} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-slate-200 bg-white">
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-2xs">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">{activeUser.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{PLAN_LABELS[activeUser.plan] ?? activeUser.plan}</div>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Link href="/login" className="btn btn-primary w-full text-center py-2 text-xs font-semibold justify-center">
                Sign In
              </Link>
              <p className="text-[10px] text-slate-500 text-center">Sign in for full AI bid generation</p>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Main Content Shell ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between gap-4 flex-shrink-0">
          {/* Spotlight Command Bar Trigger */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 hover:border-slate-300 hover:text-slate-900 transition-all max-w-md w-full"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="flex-1 text-left truncate">Search tenders, states, UTs or commands...</span>
            <kbd className="flex items-center gap-0.5">
              <Command className="w-3 h-3" /> K
            </kbd>
          </button>

          {/* Right Status Controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="hidden md:flex items-center gap-1.5 text-[11px] font-medium text-green-700 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
              Live Ingestion Active (9,763 Tenders)
            </span>

            <Link href="/dashboard/notifications" className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600" />
              )}
            </Link>
          </div>
        </header>

        {/* Dynamic Page Workspace */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}


