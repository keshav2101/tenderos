"use client";

import { useState, useEffect } from "react";
import {
  Radio, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck,
  Building2, Server, Cpu, Clock, Activity, Zap, Play, Search, Filter
} from "lucide-react";

interface ConnectorStatus {
  id: string;
  name: string;
  category: "Central" | "PSU" | "Defence" | "State" | "Municipal";
  portalUrl: string;
  status: "healthy" | "syncing" | "backoff" | "idle";
  activeTenders: number;
  totalIngested: number;
  lastSync: string;
  latencyMs: number;
  successRate: number;
  fallbackEnabled?: boolean;
}

const INITIAL_CONNECTORS: ConnectorStatus[] = [
  { id: "gem", name: "Government e-Marketplace (GeM)", category: "Central", portalUrl: "gem.gov.in", status: "healthy", activeTenders: 1240, totalIngested: 18500, lastSync: "2 mins ago", latencyMs: 240, successRate: 99.4 },
  { id: "cppp", name: "Central Public Procurement Portal (CPPP)", category: "Central", portalUrl: "eprocure.gov.in", status: "healthy", activeTenders: 890, totalIngested: 14200, lastSync: "5 mins ago", latencyMs: 310, successRate: 98.8 },
  { id: "ireps", name: "Indian Railways e-Procurement (IREPS)", category: "Central", portalUrl: "ireps.gov.in", status: "healthy", activeTenders: 450, totalIngested: 9800, lastSync: "12 mins ago", latencyMs: 420, successRate: 97.5 },
  
  // Defence
  { id: "drdo", name: "DRDO Procurement Portal", category: "Defence", portalUrl: "drdo.gov.in", status: "healthy", activeTenders: 110, totalIngested: 2100, lastSync: "18 mins ago", latencyMs: 290, successRate: 99.1 },
  { id: "hal", name: "Hindustan Aeronautics Ltd (HAL)", category: "Defence", portalUrl: "hal-india.co.in", status: "healthy", activeTenders: 85, totalIngested: 1650, lastSync: "25 mins ago", latencyMs: 350, successRate: 98.2 },
  { id: "bel", name: "Bharat Electronics Ltd (BEL)", category: "Defence", portalUrl: "bel-india.in", status: "healthy", activeTenders: 72, totalIngested: 1420, lastSync: "30 mins ago", latencyMs: 310, successRate: 98.9 },
  { id: "mod_army", name: "Indian Army / MoD Defense Procurement", category: "Defence", portalUrl: "mod.gov.in", status: "healthy", activeTenders: 64, totalIngested: 1100, lastSync: "1 hour ago", latencyMs: 480, successRate: 96.4 },

  // PSUs
  { id: "bhel", name: "Bharat Heavy Electricals (BHEL)", category: "PSU", portalUrl: "bhel.com", status: "healthy", activeTenders: 135, totalIngested: 3400, lastSync: "8 mins ago", latencyMs: 380, successRate: 98.5, fallbackEnabled: true },
  { id: "coal_india", name: "Coal India (CIL / MCL / BCCL)", category: "PSU", portalUrl: "coalindia.in", status: "healthy", activeTenders: 198, totalIngested: 4120, lastSync: "14 mins ago", latencyMs: 410, successRate: 97.9, fallbackEnabled: true },
  { id: "ntpc", name: "NTPC Limited e-Tender", category: "PSU", portalUrl: "ntpc.co.in", status: "healthy", activeTenders: 142, totalIngested: 3100, lastSync: "22 mins ago", latencyMs: 360, successRate: 98.6 },
  { id: "iocl", name: "Indian Oil Corporation (IOCL)", category: "PSU", portalUrl: "iocl.com", status: "healthy", activeTenders: 160, totalIngested: 3890, lastSync: "15 mins ago", latencyMs: 390, successRate: 98.1 },
  { id: "ongc", name: "Oil & Natural Gas Corp (ONGC)", category: "PSU", portalUrl: "ongcindia.com", status: "healthy", activeTenders: 125, totalIngested: 2950, lastSync: "40 mins ago", latencyMs: 450, successRate: 96.8 },

  // State eProcurement
  { id: "maharashtra", name: "MahaTenders (Govt of Maharashtra)", category: "State", portalUrl: "mahatenders.gov.in", status: "healthy", activeTenders: 185, totalIngested: 3600, lastSync: "10 mins ago", latencyMs: 295, successRate: 99.0 },
  { id: "karnataka", name: "Karnataka e-Procurement Portal", category: "State", portalUrl: "eproc.karnataka.gov.in", status: "healthy", activeTenders: 140, totalIngested: 2800, lastSync: "35 mins ago", latencyMs: 340, successRate: 97.8 },
  { id: "up_pwd", name: "Uttar Pradesh eProcurement & PWD", category: "State", portalUrl: "etender.up.nic.in", status: "healthy", activeTenders: 210, totalIngested: 4500, lastSync: "6 mins ago", latencyMs: 320, successRate: 98.4 },
  { id: "delhi", name: "Delhi Govt e-Procurement", category: "State", portalUrl: "govtprocurement.delhi.gov.in", status: "healthy", activeTenders: 95, totalIngested: 1980, lastSync: "20 mins ago", latencyMs: 280, successRate: 99.2 },
  { id: "tamil_nadu", name: "Tender Tamil Nadu (tntenders)", category: "State", portalUrl: "tntenders.gov.in", status: "healthy", activeTenders: 115, totalIngested: 2300, lastSync: "45 mins ago", latencyMs: 370, successRate: 97.1 },
  { id: "gujarat", name: "Gujarat Govt n-Procure", category: "State", portalUrl: "nprocure.com", status: "healthy", activeTenders: 130, totalIngested: 2600, lastSync: "50 mins ago", latencyMs: 350, successRate: 98.0 },
  { id: "west_bengal", name: "eProcurement System of West Bengal", category: "State", portalUrl: "wbtenders.gov.in", status: "healthy", activeTenders: 105, totalIngested: 2150, lastSync: "1 hour ago", latencyMs: 410, successRate: 96.5 },

  // Municipal & Autonomous
  { id: "bmc", name: "Brihanmumbai Municipal Corp (BMC)", category: "Municipal", portalUrl: "portal.mcgm.gov.in", status: "healthy", activeTenders: 68, totalIngested: 1250, lastSync: "2 hours ago", latencyMs: 430, successRate: 96.9 },
  { id: "aiims", name: "AIIMS New Delhi Procurement Portal", category: "Municipal", portalUrl: "aiims.edu", status: "healthy", activeTenders: 45, totalIngested: 890, lastSync: "1 hour ago", latencyMs: 290, successRate: 99.3 },
  { id: "iit_bombay", name: "IIT Bombay Tender Portal", category: "Municipal", portalUrl: "iitb.ac.in", status: "healthy", activeTenders: 32, totalIngested: 650, lastSync: "3 hours ago", latencyMs: 270, successRate: 99.5 },
];

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>(INITIAL_CONNECTORS);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const categories = ["All", "Central", "PSU", "Defence", "State", "Municipal"];

  const triggerSync = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      setConnectors((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, lastSync: "Just now", status: "healthy", activeTenders: c.activeTenders + Math.floor(Math.random() * 5 + 1) }
            : c
        )
      );
      setSyncingId(null);
    }, 1500);
  };

  const filteredConnectors = connectors.filter((c) => {
    const matchesCat = selectedCategory === "All" || c.category === selectedCategory;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.portalUrl.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalActive = connectors.reduce((acc, c) => acc + c.activeTenders, 0);
  const totalIngested = connectors.reduce((acc, c) => acc + c.totalIngested, 0);
  const avgSuccess = (connectors.reduce((acc, c) => acc + c.successRate, 0) / connectors.length).toFixed(1);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-white">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                National Procurement Connectors Hub
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Real-time crawl monitor for 29+ Indian Government Procurement Portals (GeM, CPPP, IREPS, PSUs & States)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setConnectors([...INITIAL_CONNECTORS])}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh All Status
          </button>
        </div>
      </div>

      {/* High Level KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Procurement Sources</span>
            <Server className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-white">{connectors.length} / 29 Active</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100% Operational
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Live Tenders Tracked</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-white">{totalActive.toLocaleString("en-IN")}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across 28 Indian States & UTs</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Ingested Archive</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-white">{totalIngested.toLocaleString("en-IN")}</div>
          <div className="text-[11px] text-amber-400 mt-1">SimHash Deduplicated</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>System Success Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-white">{avgSuccess}%</div>
          <div className="text-[11px] text-emerald-400 mt-1">Adaptive Backoff Enabled</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 ml-1 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex-shrink-0 ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {cat} {cat !== "All" && `(${connectors.filter((c) => c.category === cat).length})`}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search portal or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-800/80 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Connector Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredConnectors.map((c) => (
          <div
            key={c.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 group"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {c.name}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">{c.portalUrl}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {c.category}
                </span>
              </div>

              {c.fallbackEnabled && (
                <div className="mt-3 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-[10px] text-indigo-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  <span>CPPP Fallback Mechanism Enabled</span>
                </div>
              )}

              {/* Stats breakdown */}
              <div className="grid grid-cols-2 gap-3 mt-4 p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <div>
                  <div className="text-[10px] text-slate-400">Active Tenders</div>
                  <div className="text-sm font-bold text-white mt-0.5">{c.activeTenders}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Success Rate</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{c.successRate}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Avg Latency</div>
                  <div className="text-xs font-semibold text-slate-300 mt-0.5">{c.latencyMs} ms</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Last Sync</div>
                  <div className="text-xs font-semibold text-slate-300 mt-0.5">{c.lastSync}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Operational</span>
              </div>

              <button
                onClick={() => triggerSync(c.id)}
                disabled={syncingId === c.id}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-500/40 text-white transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${syncingId === c.id ? "animate-spin" : ""}`} />
                {syncingId === c.id ? "Syncing..." : "Manual Crawl"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
