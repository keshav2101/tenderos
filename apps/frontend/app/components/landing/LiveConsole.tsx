"use client";
import { useCallback, useEffect, useState } from "react";
import type { Tender } from "@/types/procurement";

// Portal color map — UI config only, no business data
const PORTAL_COLORS: Record<string, string> = {
  "GeM": "#22c55e", "CPPP": "#3b82f6", "IREPS": "#f97316",
  "Defence": "#ef4444", "HAL": "#dc2626", "BEL": "#dc2626",
  "ONGC": "#64748b", "BHEL": "#64748b", "NTPC": "#64748b",
  "State PWD": "#0ea5e9", "Maharashtra": "#0ea5e9", "Karnataka": "#10b981",
};
const STATUS_STYLE: Record<string, string> = {
  active: "bg-[#0d2a16] text-[#4ade80]",
  new:    "bg-[#0d2a16] text-[#4ade80]",
  closed: "bg-[#2a0d0d] text-[#f87171]",
  corrigendum: "bg-[#0d1a2e] text-[#60a5fa]",
  cancelled: "bg-[#1e1b0d] text-[#fbbf24]",
};
function getColor(source: string) {
  return PORTAL_COLORS[source] || "#64748b";
}
function fmtVal(lakhs: number) {
  if (!lakhs) return "";
  const cr = lakhs / 100;
  return `₹${cr >= 1 ? cr.toFixed(1) + " Cr" : (lakhs).toFixed(0) + " L"}`;
}
function fmtTime(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Kolkata",
  });
}
function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

interface Props {
  tenders: Tender[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-0 px-8 py-3 border-b border-[#1a2540]">
      <div className="w-20 h-2.5 bg-[#1e293b] rounded animate-pulse flex-shrink-0" />
      <div className="w-32 h-2.5 bg-[#1e293b] rounded animate-pulse ml-0" />
      <div className="w-44 h-2.5 bg-[#1e293b] rounded animate-pulse" />
      <div className="flex-1 h-2.5 bg-[#1e293b] rounded animate-pulse mx-4" />
      <div className="w-24 h-2.5 bg-[#1e293b] rounded animate-pulse" />
      <div className="w-16 h-2.5 bg-[#1e293b] rounded animate-pulse ml-4" />
    </div>
  );
}

function ConsoleRow({ tender }: { tender: Tender }) {
  const statusStyle = STATUS_STYLE[tender.status] ?? STATUS_STYLE.active;
  return (
    <div className="flex items-center gap-0 px-8 py-3 border-b border-[#1a2540] hover:bg-[#131c30] transition-colors group cursor-pointer">
      <span className="font-mono text-[11px] text-[#475569] flex-shrink-0 w-20">{fmtTime(tender.published_date)}</span>
      <div className="flex items-center gap-2 w-32 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(tender.source) }} />
        <span className="text-xs font-bold text-[#e2e8f0] truncate">{tender.source}</span>
      </div>
      <span className="font-mono text-[11px] text-[#334155] flex-shrink-0 w-44 truncate">{tender.tender_id}</span>
      <span className="text-xs text-[#94a3b8] flex-1 min-w-0 group-hover:text-[#e2e8f0] transition-colors truncate px-4">{tender.title}</span>
      <span className="font-mono text-xs text-[#60a5fa] flex-shrink-0 w-24 text-right pr-4">{fmtVal(tender.estimated_cost_lakhs)}</span>
      <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded flex-shrink-0 w-16 text-center uppercase ${statusStyle}`}>
        {tender.status?.slice(0, 6) ?? "ACTIVE"}
      </span>
    </div>
  );
}

export default function LiveConsole({ tenders, isLoading, error, lastUpdated, onRefresh }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [ticker, setTicker] = useState(0);

  // Tick every 10s to update "X ago" display
  useEffect(() => {
    const t = setInterval(() => setTicker(x => x + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 1200);
  }, [onRefresh]);

  const doubled = tenders.length > 0 ? [...tenders, ...tenders] : [];
  const totalValue = tenders.reduce((sum, t) => sum + (t.estimated_cost_lakhs || 0), 0);

  return (
    <div className="bg-[#0a0f1e] border border-[#1e293b] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-[#1e293b] bg-[#0f172a]">
        <div className="flex items-center gap-3">
          <span className={`live-dot w-2 h-2 rounded-full ${error ? "bg-amber-400" : "bg-emerald-400"}`} />
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#475569] font-mono">
            Procurement Intelligence Console
          </span>
        </div>
        <div className="flex items-center gap-5 text-[11px] font-mono text-[#334155]">
          {lastUpdated && (
            <span key={ticker} className="text-[#475569]">
              Updated {timeAgo(lastUpdated)}
            </span>
          )}
          <span className="text-[#1e293b]">·</span>
          <button
            onClick={handleRefresh}
            className="text-[#334155] hover:text-[#60a5fa] transition-colors flex items-center gap-1.5"
          >
            <span className={refreshing ? "animate-spin inline-block" : ""}>↻</span>
            <span>Refresh</span>
          </button>
          <span className="text-[#1e293b]">·</span>
          <span className={error ? "text-amber-400 font-bold" : "text-emerald-500 font-bold"}>
            ● {error ? "DEGRADED" : "LIVE"}
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-8 py-2.5 border-b border-[#1a2540] bg-[#0c1120]">
        {[
          { label: "TIME (IST)", w: "w-20" },
          { label: "SOURCE", w: "w-32" },
          { label: "REFERENCE", w: "w-44" },
          { label: "TENDER DESCRIPTION", w: "flex-1 px-4" },
          { label: "VALUE", w: "w-24 text-right pr-4" },
          { label: "STATUS", w: "w-16 text-center" },
        ].map(h => (
          <span key={h.label} className={`text-[9px] font-bold uppercase tracking-[0.12em] text-[#334155] font-mono ${h.w}`}>
            {h.label}
          </span>
        ))}
      </div>

      {/* Body */}
      <div className="h-80 overflow-hidden">
        {isLoading ? (
          <div>{[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-sm text-[#475569]">{error}</p>
            <p className="text-xs text-[#334155]">The procurement network did not respond.</p>
            <button
              onClick={handleRefresh}
              className="text-xs font-bold text-[#60a5fa] border border-[#1e293b] px-4 py-2 rounded-lg hover:bg-[#0f172a] transition-colors"
            >
              ↻ Retry
            </button>
          </div>
        ) : tenders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-sm text-[#475569]">No procurement activity in the last 24 hours</p>
            <button onClick={handleRefresh} className="text-xs text-[#60a5fa] hover:underline">Refresh</button>
          </div>
        ) : (
          <div className="console-track">
            {doubled.map((t, i) => <ConsoleRow key={`${t.id}-${i}`} tender={t} />)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 py-3 border-t border-[#1e293b] bg-[#0f172a] flex items-center justify-between">
        <span className="text-[11px] font-mono text-[#334155]">
          {tenders.length > 0
            ? [...new Set(tenders.map(t => t.source))].slice(0, 6).join(" · ")
            : "GeM · CPPP · IREPS · Defence · State Portals · PSUs"}
        </span>
        {tenders.length > 0 && (
          <span className="text-[11px] font-mono text-[#22c55e]">
            ● {tenders.length} tenders · ₹{(totalValue / 100).toFixed(1)} Cr total
          </span>
        )}
      </div>
    </div>
  );
}
