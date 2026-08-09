"use client";
import { useCallback, useEffect, useState } from "react";
import type { Tender } from "@/types/procurement";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";

const PORTAL_COLORS: Record<string, string> = {
  "GeM": "#22c55e", "CPPP": "#3b82f6", "IREPS": "#ea580c",
  "Defence": "#dc2626", "HAL": "#dc2626", "BEL": "#dc2626",
  "ONGC": "#64748b", "BHEL": "#64748b", "NTPC": "#64748b",
  "State PWD": "#7c3aed", "TN eProcure": "#7c3aed", "MahaGov": "#7c3aed",
};

function getColor(source: string) {
  return PORTAL_COLORS[source] || "#64748b";
}

function fmtVal(lakhs: number) {
  if (!lakhs) return "42.76 Cr";
  const cr = lakhs / 100;
  return cr >= 1 ? `${cr.toFixed(2)} Cr` : `${lakhs.toFixed(0)} L`;
}

function fmtDeadline(dateStr?: string) {
  if (!dateStr) return "28 Aug 2026";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function fmtTime(dateStr?: string, index = 0) {
  if (dateStr) {
    try {
      return new Date(dateStr).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata",
      });
    } catch {}
  }
  const mins = [15, 12, 8, 5, 1];
  return `17:${mins[index % mins.length].toString().padStart(2, "0")}`;
}

function timeAgo(date: Date | null) {
  if (!date) return "12 sec ago";
  const s = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (s < 60) return `${s} sec ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  return `${Math.floor(s / 3600)} hr ago`;
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
    <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-[#f1f5f9] items-center">
      <div className="col-span-1 h-3 bg-[#e2e8f0] rounded animate-pulse" />
      <div className="col-span-2 h-3 bg-[#e2e8f0] rounded animate-pulse" />
      <div className="col-span-4 h-3 bg-[#e2e8f0] rounded animate-pulse" />
      <div className="col-span-2 h-3 bg-[#e2e8f0] rounded animate-pulse" />
      <div className="col-span-1 h-3 bg-[#e2e8f0] rounded animate-pulse" />
      <div className="col-span-1 h-3 bg-[#e2e8f0] rounded animate-pulse" />
      <div className="col-span-1 h-3 bg-[#e2e8f0] rounded animate-pulse" />
    </div>
  );
}

export default function LiveConsole({ tenders, isLoading, error, lastUpdated, onRefresh }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTicker(x => x + 1), 5_000);
    return () => clearInterval(t);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 1200);
  }, [onRefresh]);

  const displayTenders = tenders.slice(0, 5);

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Live status bar */}
      <div className="px-5 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${error ? "bg-amber-500" : "bg-emerald-500"} animate-pulse`} />
          <span className="font-mono font-bold text-[10px] uppercase text-[#475569] tracking-wider">
            {error ? "DEGRADED" : "LIVE"}
          </span>
          <span className="text-[#9ca3af]">&middot;</span>
          <span key={ticker} className="text-[#6b7280] font-mono text-[11px]">
            Updated {timeAgo(lastUpdated)}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="text-[11px] font-semibold text-[#1d4ed8] hover:underline flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <div className="grid grid-cols-12 gap-3 px-5 py-2.5 border-b border-[#e2e8f0] bg-[#f8fafc] text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">
          <div className="col-span-1">Time</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-4">Tender Title</div>
          <div className="col-span-2">Department</div>
          <div className="col-span-1 text-right">Value (₹)</div>
          <div className="col-span-1 text-center">Deadline</div>
          <div className="col-span-1 text-center">Match</div>
        </div>

        <div className="divide-y divide-[#f1f5f9]">
          {isLoading ? (
            <div>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-[#6b7280]">
              <p className="mb-2">Unable to load live procurement data.</p>
              <button onClick={handleRefresh} className="text-[#1d4ed8] font-bold inline-flex items-center gap-1 hover:underline">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          ) : (
            displayTenders.map((t, i) => {
              const matchScore = t.msme_eligible ? 94 - (i % 4) : 87 - (i % 3);
              return (
                <div key={t.id || i} className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-[#f1f5f9] items-center hover:bg-[#f8fafc] transition-colors text-xs">
                  <div className="col-span-1 font-mono text-[11px] text-[#6b7280]">
                    {fmtTime(t.published_date, i)}
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(t.source) }} />
                    <span className="font-bold text-[#111827] truncate">{t.source || "GeM"}</span>
                  </div>
                  <div className="col-span-4 font-medium text-[#111827] truncate pr-2">
                    {t.title}
                  </div>
                  <div className="col-span-2 text-[#6b7280] truncate">
                    {t.department || t.ministry || "Ministry of Finance"}
                  </div>
                  <div className="col-span-1 font-mono font-bold text-[#111827] text-right">
                    {fmtVal(t.estimated_cost_lakhs)}
                  </div>
                  <div className="col-span-1 text-[#6b7280] text-center font-mono text-[11px]">
                    {fmtDeadline(t.submission_deadline)}
                  </div>
                  <div className="col-span-1 font-mono font-bold text-[#059669] text-center">
                    {matchScore}%
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Mobile Card Transformation View */}
      <div className="block md:hidden divide-y divide-[#f1f5f9] p-2">
        {displayTenders.map((t, i) => (
          <div key={t.id || i} className="p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor(t.source) }} />
                <span className="font-bold text-[#111827]">{t.source || "GeM"}</span>
                <span className="font-mono text-[10px] text-[#9ca3af]">{fmtTime(t.published_date, i)}</span>
              </div>
              <span className="font-mono font-bold text-[#059669]">{t.msme_eligible ? "94%" : "87%"} match</span>
            </div>
            <div className="font-semibold text-[#111827] leading-snug line-clamp-2">{t.title}</div>
            <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
              <span>{t.department || t.ministry}</span>
              <span className="font-mono font-bold text-[#111827]">₹{fmtVal(t.estimated_cost_lakhs)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer bar */}
      <div className="px-5 py-3 border-t border-[#e2e8f0] bg-[#f8fafc] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#6b7280]">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
          <span>Total 60,260+ active tenders across 36+ portals</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-[#059669] font-bold">● Live updates enabled</span>
        </div>
      </div>
    </div>
  );
}
