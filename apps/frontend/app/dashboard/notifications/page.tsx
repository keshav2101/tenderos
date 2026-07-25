"use client";

import { useState, useEffect } from "react";
import {
  Bell, BellOff, Check, AlertCircle, Loader2
} from "lucide-react";
import { notificationsApi } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadNotifications() {
    try {
      const { data } = await notificationsApi.list();
      setNotifications(data || []);
    } catch (err: any) {
      console.error("Failed to load notifications", err);
      setError("Unable to retrieve active notifications from API gateway.");
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
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (_) {}
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="card p-6 text-center max-w-md space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-primary">Failed to Load Notifications</h2>
          <p className="text-xs text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-400" /> Notifications
          </h1>
          <p className="text-sm text-muted mt-0.5">Stay updated on bid milestones and matching opportunities.</p>
        </div>
        {unreadCount > 0 && (
          <span className="badge badge-blue text-xs font-semibold px-2.5 py-1">
            {unreadCount} unread
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center text-secondary">
          <BellOff className="w-8 h-8 text-muted mx-auto mb-2" />
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="card p-5 flex items-start gap-4 transition-all duration-200"
              style={notif.read ? { opacity: 0.6 } : { borderLeft: "3.5px solid #4c51e8" }}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-primary">{notif.title}</h3>
                  <span className="text-[10px] text-muted">
                    {new Date(notif.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-secondary leading-relaxed">{notif.message}</p>
              </div>

              {!notif.read && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  title="Mark as read"
                  className="btn-ghost p-1.5 rounded-lg hover:bg-elevated text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
