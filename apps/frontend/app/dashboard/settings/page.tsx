"use client";

import { useState, useEffect } from "react";
import {
  Settings, Key, Bell, ShieldAlert, Cpu, Check,
  AlertCircle, Sparkles, LogOut, Save, Sliders, ShieldCheck, Filter
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  getNotificationRules,
  saveNotificationRules,
  NotificationRules,
  DEFAULT_NOTIFICATION_RULES
} from "@/lib/notifications-store";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  
  const [rules, setRules] = useState<NotificationRules>(DEFAULT_NOTIFICATION_RULES);
  const [apiKey, setApiKey] = useState("t_live_948f2c3d82a104b2c14092fa7e5621a2");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [rulesMsg, setRulesMsg] = useState<string | null>(null);

  useEffect(() => {
    const activeRules = getNotificationRules();
    setRules(activeRules);
  }, []);

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    saveNotificationRules(rules);
    setRulesMsg("✅ Notification Rules saved & applied to live alert engine!");
    setTimeout(() => setRulesMsg(null), 4000);
  };

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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" /> Procurement Alert Settings & Rules
        </h1>
        <p className="text-sm text-muted mt-0.5">Configure live notification rules, AI match thresholds, and developer API credentials.</p>
      </div>

      <div className="space-y-6">
        {/* Account Details */}
        <div className="card p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
          <h2 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-subtle pb-2">
            User Account Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-muted block">Account Registered Email</span>
              <span className="font-semibold text-primary">{user?.email || "guest@tenderos.in"}</span>
            </div>
            <div className="space-y-1">
              <span className="text-muted block font-medium">Membership Tier</span>
              <span className="badge badge-blue inline-block mt-0.5 uppercase font-bold">{user?.plan || "ENTERPRISE"}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Working Notification Rules Form */}
        <form onSubmit={handleSaveRules} className="card p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-primary">Live Notification Alert Rules</h2>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">100% Active Filtering Engine</span>
          </div>

          {/* Rule Category Toggles */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Alert Event Categories</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3 cursor-pointer hover:border-indigo-500/30 transition">
                <input
                  type="checkbox"
                  checked={rules.enableActionRequired}
                  onChange={(e) => setRules((r) => ({ ...r, enableActionRequired: e.target.checked }))}
                  className="accent-indigo-500 w-4 h-4 mt-0.5 rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-primary block">🚨 Action Required Alerts</span>
                  <span className="text-[11px] text-secondary">PBG deposits, Bank Guarantees & missing CA UDIN certificates</span>
                </div>
              </label>

              <label className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3 cursor-pointer hover:border-indigo-500/30 transition">
                <input
                  type="checkbox"
                  checked={rules.enableCorrigendums}
                  onChange={(e) => setRules((r) => ({ ...r, enableCorrigendums: e.target.checked }))}
                  className="accent-indigo-500 w-4 h-4 mt-0.5 rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-primary block">📢 Corrigendums & Extensions</span>
                  <span className="text-[11px] text-secondary">Instant alerts for CPPP/IREPS technical criteria updates</span>
                </div>
              </label>

              <label className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3 cursor-pointer hover:border-indigo-500/30 transition">
                <input
                  type="checkbox"
                  checked={rules.enableEmdWaivers}
                  onChange={(e) => setRules((r) => ({ ...r, enableEmdWaivers: e.target.checked }))}
                  className="accent-indigo-500 w-4 h-4 mt-0.5 rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-primary block">✅ 100% EMD Waiver Alerts</span>
                  <span className="text-[11px] text-secondary">GFR 2017 Rule 170 auto-applied MSME exemption confirmations</span>
                </div>
              </label>

              <label className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3 cursor-pointer hover:border-indigo-500/30 transition">
                <input
                  type="checkbox"
                  checked={rules.enableFinancialOpenings}
                  onChange={(e) => setRules((r) => ({ ...r, enableFinancialOpenings: e.target.checked }))}
                  className="accent-indigo-500 w-4 h-4 mt-0.5 rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-primary block">🏆 Financial Bid Openings</span>
                  <span className="text-[11px] text-secondary">L1 lowest price bid evaluation schedule notifications</span>
                </div>
              </label>
            </div>
          </div>

          {/* Threshold Filters */}
          <div className="space-y-3 pt-3 border-t border-subtle">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Threshold & Valuation Filters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase">Minimum AI Match Score Threshold</label>
                <select
                  value={rules.minMatchScore}
                  onChange={(e) => setRules((r) => ({ ...r, minMatchScore: Number(e.target.value) }))}
                  className="input text-xs font-semibold"
                >
                  <option value={50}>Alert for All Matches (&ge; 50% Match Score)</option>
                  <option value={70}>Recommended Matches (&ge; 70% Match Score)</option>
                  <option value={80}>High Suitability Only (&ge; 80% Match Score)</option>
                  <option value={90}>Prime Opportunities Only (&ge; 90% Match Score)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase">Minimum Tender Contract Value</label>
                <select
                  value={rules.minContractCostLakhs}
                  onChange={(e) => setRules((r) => ({ ...r, minContractCostLakhs: Number(e.target.value) }))}
                  className="input text-xs font-semibold"
                >
                  <option value={0}>All Contract Values (Micro to Mega Tenders)</option>
                  <option value={100}>₹ 1.00 Crore & Above</option>
                  <option value={500}>₹ 5.00 Crores & Above</option>
                  <option value={1000}>₹ 10.00 Crores & Above (Major Contracts Only)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Delivery Channels */}
          <div className="space-y-3 pt-3 border-t border-subtle">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Delivery Channels</h3>
            
            <div className="flex flex-wrap gap-6 text-xs text-secondary">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.emailDigest}
                  onChange={(e) => setRules((r) => ({ ...r, emailDigest: e.target.checked }))}
                  className="accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                />
                <span className="font-semibold text-primary">Daily Morning Email Digest</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.whatsappAlerts}
                  onChange={(e) => setRules((r) => ({ ...r, whatsappAlerts: e.target.checked }))}
                  className="accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                />
                <span className="font-semibold text-primary">WhatsApp / SMS Urgent Milestone Alerts</span>
              </label>
            </div>
          </div>

          {/* Save Button Row */}
          <div className="flex items-center justify-between pt-4 border-t border-subtle">
            {rulesMsg && <span className="text-xs text-emerald-400 font-bold">{rulesMsg}</span>}
            <button
              type="submit"
              className="btn btn-primary text-xs py-2.5 px-5 rounded-xl ml-auto flex items-center gap-1.5 font-bold shadow-lg shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" /> Save Notification Rules
            </button>
          </div>
        </form>

        {/* Developer API Tokens */}
        <div className="card p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
          <h2 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-subtle pb-2 flex items-center gap-1">
            <Key className="w-4 h-4 text-emerald-400" /> Developer Integrations & API Keys
          </h2>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted uppercase">TenderOS Integration Secret Key</label>
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
                className="btn btn-secondary text-xs px-3 font-semibold"
              >
                {apiKeyVisible ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={regenerateApiKey}
                className="btn btn-secondary text-xs px-3 text-red-400 font-semibold"
              >
                Regenerate
              </button>
            </div>
            {msg && <span className="text-[10px] text-indigo-400 font-semibold">{msg}</span>}
          </div>
        </div>

        {/* Log Out */}
        <div className="card p-5 rounded-2xl flex items-center justify-between border border-red-500/20 bg-red-500/5">
          <div>
            <span className="text-xs font-bold text-primary block">Sign Out of Session</span>
            <span className="text-[11px] text-muted">Clear all authentication cookies and local storage tokens.</span>
          </div>
          <button onClick={logout} className="btn bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 font-bold">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
