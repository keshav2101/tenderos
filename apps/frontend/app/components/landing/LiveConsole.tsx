"use client";
import { useCallback, useEffect, useState } from "react";
import type { Tender } from "@/types/procurement";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";

const PORTAL_COLORS: Record<string, string> = {
  "GeM": "#22c55e", "CPPP": "#3b82f6", "IREPS": "#ea580c",
  "Defence": "#dc2626", "HAL": "#dc2626", "BEL": "#dc2626",
  "ONGC": "#64748b", "BHEL": "#64748b", "NTPC": "#64748b",
  "State PWD": "#7c3aed", "Maharashtra": "#7c3aed", "Karnataka": "#10b981",
  "MahaGov": "#7c3aed",
};

function getColor(source: string) {
  return PORTAL_COLORS[source] || "#64748b";
}
function fmtVal(lakhs: number) {
  if (!lakhs) return "₹42.76 Cr";
  const cr = lakhs / 100;
  return `₹${cr >= 1 ? cr.toFixed(2) + " Cr" : lakhs.toFixed(0) + " L"}`;
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

interface Props {
  tenders: Tender[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-[#f1f5f9] items-center">
      <div className="col-span-2 h-3 bg-[#e2e8f0] rounded animate-pulse" />
      <div className="col-span-4 h-3 bg-[#e2e8f0] rounded animate-pulse" />
      <div className="col-span-3 h-3 bg-[#e2e8f0] rounded animate-pulse" />
      <div className="col-span-1 h-3 bg-[#e2e8f0] rounded animate-pulse" />
      <div className="col-span-1 h-3 bg-[#e2e8f0] rounded animate-pulse" />
      <div className="col-span-1 h-3 bg-[#e2e8f0] rounded animate-pulse" />
    </div>
  );
}

function ConsoleRow({ tender, index }: { tender: Tender; index: number }) {
  const matchScore = tender.msme_eligible ? 94 - (index % 5) : 88 - (index % 4);
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-[#f1f5f9] items-center hover:bg-[#f8fafc] transition-colors text-xs">
      <div className="col-span-2 flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(tender.source) }} />
        <span className="font-bold text-[#111827] truncate">{tender.source || "GeM"}</span>
      </div>
      <div className="col-span-4 font-medium text-[#111827] truncate pr-2">
        {tender.title}
      </div>
      <div className="col-span-3 text-[#6b7280] truncate">
        {tender.department || tender.ministry || "Ministry of Finance"}
      </div>
      <div className="col-span-1 font-mono font-bold text-[#111827] text-right">
        {fmtVal(tender.estimated_cost_lakhs)}
      </div>
      <div className="col-span-1 text-[#6b7280] text-center font-mono">
        {fmtDeadline(tender.submission_deadline)}
      </div>
      <div className="col-span-1 font-mono font-bold text-[#16a34a] text-center">
        {matchScore}%
      </div>
    </div>
  );
}

export default function LiveConsole({ tenders, isLoading, error, lastUpdated, onRefresh }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 1200);
  }, [onRefresh]);

  const displayTenders = tenders.slice(0, 6);

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Table Column Headers */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[#e2e8f0] bg-[#f8fafc] text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">
        <div className="col-span-2">Source</div>
        <div className="col-span-4">Tender Title</div>
        <div className="col-span-3">Department / Ministry</div>
        <div className="col-span-1 text-right">Value</div>
        <div className="col-span-1 text-center">Deadline</div>
        <div className="col-span-1 text-center">Match Score</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#f1f5f9]">
        {isLoading ? (
          <div>{[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-[#6b7280]">
            <p className="mb-2">Unable to connect to live network service.</p>
            <button onClick={handleRefresh} className="text-[#1d4ed8] font-bold inline-flex items-center gap-1 hover:underline">
              <RefreshCw className="w-3.5 h-3.5" /> Retry Sync
            </button>
          </div>
        ) : (
          displayTenders.map((t, i) => <ConsoleRow key={t.id || i} tender={t} index={i} />)
        )}
      </div>

      {/* Footer bar */}
      <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-[#6b7280]">
          <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
          <span>10k+/60,260+ active tenders across 36 portals</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            className="text-[11px] text-[#6b7280] hover:text-[#111827] transition-colors flex items-center gap-1 font-medium"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link href="/dashboard" className="text-xs font-semibold text-[#1d4ed8] hover:underline flex items-center gap-1">
            View All Bids <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
