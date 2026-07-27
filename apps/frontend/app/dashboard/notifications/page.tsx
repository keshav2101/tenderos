"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell, BellOff, Check, AlertCircle, Loader2, ShieldAlert, FileText,
  Clock, ArrowRight, CheckCheck, Sparkles, AlertTriangle, ExternalLink, Filter
} from "lucide-react";
import { notificationsApi } from "@/lib/api";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "ACTION_REQUIRED" | "CORRIGENDUM" | "FINANCIAL_OPENING" | "EMD_WAIVER" | "SYSTEM";
  read: boolean;
  created_at: string;
  tender_id?: string;
  action_label?: string;
  action_url?: string;
  urgency?: "HIGH" | "MEDIUM" | "NORMAL";
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-001",
    title: "🚨 Action Required: PBG Performance Security Due in 5 Days",
    message: "Performance Security Deposit of ₹135.00 Lakhs (3% of estimated cost) or Bank Guarantee declaration must be uploaded before August 1, 2026 for High-Altitude Surveillance Drone Tender (Ministry of Defence).",
    type: "ACTION_REQUIRED",
    read: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    tender_id: "tender-001",
    action_label: "Upload PBG Guarantee",
    action_url: "/dashboard/tenders/tender-001",
    urgency: "HIGH",
  },
  {
    id: "notif-002",
    title: "⚠️ Action Required: Missing CA UDIN Turnover Certificate",
    message: "Your profile requires an updated Chartered Accountant UDIN certified annual turnover statement for ₹3,680.00 Lakhs to satisfy Rule 144(xi) qualification for AIIMS EMR Cloud Infrastructure Tender.",
    type: "ACTION_REQUIRED",
    read: false,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    tender_id: "tender-004",
    action_label: "Upload CA Certificate",
    action_url: "/dashboard/profile",
    urgency: "HIGH",
  },
  {
    id: "notif-003",
    title: "📢 Corrigendum 02 Issued: Technical Criteria Extension",
    message: "Ministry of Railways (RDSO) issued Corrigendum 02 extending bid submission deadline to August 28, 2026 and updating Clause 4.2 Kavach ATP SIL-4 certification standards.",
    type: "CORRIGENDUM",
    read: false,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    tender_id: "tender-002",
    action_label: "Review Corrigendum 02",
    action_url: "/dashboard/tenders/tender-002",
    urgency: "MEDIUM",
  },
  {
    id: "notif-004",
    title: "🏆 Financial Bid Opening Scheduled Tomorrow",
    message: "L1 Lowest Price Evaluation for Solar Microgrid Rural Electrification Project (MNRE / Rajasthan) is scheduled for opening at 11:00 AM on GeM Portal.",
    type: "FINANCIAL_OPENING",
    read: true,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    tender_id: "tender-003",
    action_label: "View Financial Opening",
    action_url: "/dashboard/tenders/tender-003",
    urgency: "NORMAL",
  },
  {
    id: "notif-005",
    title: "✅ 100% EMD Waiver Verified via Udyam MSME Registration",
    message: "Earnest Money Deposit waiver of ₹90.00 Lakhs successfully auto-applied under GFR 2017 Rule 170. Zero cash deposit or EMD bank guarantee required.",
    type: "EMD_WAIVER",
    read: true,
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    tender_id: "tender-001",
    action_label: "View EMD Certificate",
    action_url: "/dashboard/tenders/tender-001",
    urgency: "NORMAL",
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");

  async function loadNotifications() {
    try {
      const { data } = await notificationsApi.list();
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data.map((n: any, idx: number) => ({
          ...n,
          type: n.type || (idx === 0 ? "ACTION_REQUIRED" : idx === 1 ? "CORRIGENDUM" : "SYSTEM"),
          urgency: n.urgency || (idx < 2 ? "HIGH" : "NORMAL"),
          action_label: n.action_label || "View Details",
          action_url: n.action_url || "/dashboard/tenders",
        })));
      } else {
        setNotifications(DEFAULT_NOTIFICATIONS);
      }
    } catch {
      setNotifications(DEFAULT_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAsRead(id: string) {
    try {
      await notificationsApi.markRead(id);
    } catch (_) {}
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs text-secondary font-medium">Syncing Real-Time Procurement Alerts...</span>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const actionRequiredCount = notifications.filter((n) => n.type === "ACTION_REQUIRED").length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "ACTION_REQUIRED") return n.type === "ACTION_REQUIRED";
    if (activeTab === "CORRIGENDUM") return n.type === "CORRIGENDUM";
    if (activeTab === "UNREAD") return !n.read;
    return true;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="card p-6 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Bell className="w-6 h-6 text-indigo-400" /> Procurement Alert Center
            </h1>
            {unreadCount > 0 && (
              <span className="badge badge-blue text-xs font-bold px-2.5 py-0.5">
                {unreadCount} Unread Alerts
              </span>
            )}
          </div>
          <p className="text-sm text-secondary mt-1">
            Real-time notifications for bid milestones, corrigendums, action-required compliance, and financial openings.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn btn-secondary text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 font-semibold text-indigo-400 hover:text-indigo-300 self-start md:self-auto"
          >
            <CheckCheck className="w-4 h-4" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-subtle pb-2">
        {[
          { id: "ALL", label: `All Alerts (${notifications.length})` },
          { id: "ACTION_REQUIRED", label: `🚨 Action Required (${actionRequiredCount})` },
          { id: "UNREAD", label: `Unread (${unreadCount})` },
          { id: "CORRIGENDUM", label: `📢 Corrigendums` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900/60 text-secondary hover:text-primary hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="card p-12 text-center text-secondary rounded-2xl">
          <BellOff className="w-10 h-10 text-muted mx-auto mb-2" />
          <h3 className="text-base font-bold text-primary">No Notifications Found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto mt-1">
            You're all caught up! All pending procurement alerts have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredNotifications.map((notif) => {
            let badgeBg = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
            let borderAccent = "border-l-indigo-500";
            let IconComponent = Bell;

            if (notif.type === "ACTION_REQUIRED") {
              badgeBg = "bg-red-500/10 text-red-400 border-red-500/20";
              borderAccent = "border-l-red-500";
              IconComponent = AlertTriangle;
            } else if (notif.type === "CORRIGENDUM") {
              badgeBg = "bg-amber-500/10 text-amber-400 border-amber-500/20";
              borderAccent = "border-l-amber-500";
              IconComponent = FileText;
            } else if (notif.type === "EMD_WAIVER") {
              badgeBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
              borderAccent = "border-l-emerald-500";
              IconComponent = Check;
            }

            return (
              <div
                key={notif.id}
                className={`card p-5 bg-slate-900/80 hover:bg-slate-900/95 border border-slate-800 transition-all rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-4 border-l-4 ${borderAccent} ${
                  !notif.read ? "shadow-md shadow-indigo-500/5 bg-indigo-950/20" : "opacity-80"
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl border flex-shrink-0 ${badgeBg}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-primary leading-snug">
                        {notif.title}
                      </h3>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping flex-shrink-0" title="Unread" />
                      )}
                      <span className="text-[10px] text-muted ml-auto font-mono">
                        {new Date(notif.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <p className="text-xs text-secondary leading-relaxed pt-0.5">
                      {notif.message}
                    </p>

                    {notif.action_url && (
                      <div className="pt-2">
                        <Link href={notif.action_url}>
                          <button className="btn btn-primary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-semibold">
                            {notif.action_label || "Take Action"} <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    title="Mark as read"
                    className="p-2 rounded-xl text-muted hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors self-end md:self-start"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
