"use client";

import { useState } from "react";
import {
  Settings, Key, Bell, ShieldAlert, Cpu, Check,
  AlertCircle, Sparkles, LogOut
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [bidAlerts, setBidAlerts] = useState(true);
  const [corrigendumAlerts, setCorrigendumAlerts] = useState(true);
  const [apiKey, setApiKey] = useState("t_live_948f2c3d82a104b2c14092fa7e5621a2");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const regenerateApiKey = () => {
    const chars = "abcdef0123456789";
    let token = "t_live_";
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setApiKey(token);
    setMsg("Developer API Key regenerated successfully");
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" /> Settings
        </h1>
        <p className="text-sm text-muted mt-0.5">Manage preferences, notification triggers, and developer credentials.</p>
      </div>

      <div className="space-y-4">
        {/* Account Details */}
        <div className="card p-5 space-y-4">
          <h2 className="text-xs font-semibold text-primary uppercase tracking-wider border-b border-subtle pb-2">
            User Account Details
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-muted block">Account Registered Email</span>
              <span className="font-semibold text-primary">{user?.email || "guest@tenderos.in"}</span>
            </div>
            <div className="space-y-1">
              <span className="text-muted block">Membership Tier</span>
              <span className="badge badge-blue inline-block mt-0.5 uppercase">{user?.plan || "ENTERPRISE"}</span>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="card p-5 space-y-4">
          <h2 className="text-xs font-semibold text-primary uppercase tracking-wider border-b border-subtle pb-2 flex items-center gap-1">
            <Bell className="w-4 h-4 text-indigo-400" /> Notification Rules
          </h2>
          <div className="space-y-3">
            {[
              { id: "email", label: "Send daily summary emails", desc: "Receive email digests for new matches every morning", state: emailAlerts, setState: setEmailAlerts },
              { id: "bid", label: "Bid suitability matches", desc: "Instantly alert when match score is recommended (> 80)", state: bidAlerts, setState: setBidAlerts },
              { id: "corrigendum", label: "Corrigendum extensions", desc: "Alert immediately if active bid deadlines shift or corrigendum is added", state: corrigendumAlerts, setState: setCorrigendumAlerts },
            ].map(item => (
              <label key={item.id} className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={item.state}
                  onChange={e => item.setState(e.target.checked)}
                  className="accent-indigo-500 w-4 h-4 mt-0.5 flex-shrink-0"
                />
                <div>
                  <span className="text-xs font-semibold text-primary block">{item.label}</span>
                  <span className="text-[10px] text-muted">{item.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Developer API Tokens */}
        <div className="card p-5 space-y-4">
          <h2 className="text-xs font-semibold text-primary uppercase tracking-wider border-b border-subtle pb-2 flex items-center gap-1">
            <Key className="w-4 h-4 text-emerald-400" /> Developer Integrations
          </h2>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted uppercase">TenderOS Integration Secret Key</label>
            <div className="flex gap-2">
              <input
                type={apiKeyVisible ? "text" : "password"}
                value={apiKey}
                readOnly
                className="input text-xs font-mono bg-black/20 flex-1 px-3 py-2 border border-subtle"
              />
              <button
                type="button"
                onClick={() => setApiKeyVisible(!apiKeyVisible)}
                className="btn btn-secondary text-xs px-3"
              >
                {apiKeyVisible ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={regenerateApiKey}
                className="btn btn-secondary text-xs px-3 text-red-400"
              >
                Regenerate
              </button>
            </div>
            {msg && <span className="text-[10px] text-indigo-400 font-semibold">{msg}</span>}
          </div>
        </div>

        {/* Log Out */}
        <div className="card p-5 flex items-center justify-between border border-red-500/20 bg-red-500/5">
          <div>
            <span className="text-xs font-semibold text-primary block">Sign Out of Session</span>
            <span className="text-[10px] text-muted">Clear all authentication cookies and local storage tokens.</span>
          </div>
          <button onClick={logout} className="btn bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 flex items-center gap-1">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
