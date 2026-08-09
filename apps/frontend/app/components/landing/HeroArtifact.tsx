"use client";
import type { Tender } from "@/types/procurement";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

function fmt(date?: string) {
  if (!date) return "28 Aug 2026 15:00 IST";
  try {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    }) + " 15:00 IST";
  } catch {
    return date;
  }
}

function fmtCr(lakhs?: number) {
  if (!lakhs) return "₹42.76 Cr";
  const cr = lakhs / 100;
  return `₹${cr.toFixed(2)} Cr`;
}

function ScoreArc({ score = 94 }: { score?: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="5" stroke="#e2e8f0" />
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="5"
          stroke="#16a34a" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.8s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-[#111827] leading-none">{score}</span>
        <span className="text-[10px] text-[#9ca3af] font-medium font-mono mt-0.5">/100</span>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4 animate-pulse">
      <div className="h-4 w-32 bg-[#e2e8f0] rounded" />
      <div className="h-6 w-3/4 bg-[#e2e8f0] rounded" />
      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="h-8 bg-[#e2e8f0] rounded" />
        <div className="h-8 bg-[#e2e8f0] rounded" />
        <div className="h-8 bg-[#e2e8f0] rounded" />
      </div>
    </div>
  );
}

interface Props {
  tender: Tender | null;
  isLoading: boolean;
}

export default function HeroArtifact({ tender, isLoading }: Props) {
  if (isLoading) return <Skeleton />;

  const title = tender?.title || "Smart City Infrastructure Development";
  const dept = tender?.department || tender?.ministry || "MCDM, Maharashtra";
  const val = fmtCr(tender?.estimated_cost_lakhs);
  const deadline = fmt(tender?.submission_deadline);
  const portal = tender?.source || "MahaGov";
  const emdVal = tender?.msme_eligible ? "Exempt (Udyam)" : "₹85.52 Lakh";
  const score = tender?.msme_eligible ? 94 : 88;

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Top pill bar */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#f1f5f9]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1d4ed8]" />
          <span className="text-xs font-bold text-[#111827]">AI Bid Assessment</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#16a34a] bg-[#f0fdf4] px-2 py-0.5 rounded-full border border-[#bbf7d0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
          Live Analysis
        </div>
      </div>

      {/* Tender Title & Dept */}
      <div className="mb-5">
        <h3 className="text-sm font-bold text-[#111827] leading-snug line-clamp-2">{title}</h3>
        <p className="text-xs text-[#6b7280] mt-1">{dept}</p>
      </div>

      {/* 3 Metric columns */}
      <div className="grid grid-cols-3 gap-4 pb-5 mb-5 border-b border-[#f1f5f9]">
        <div>
          <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">Tender Value</div>
          <div className="text-sm font-extrabold text-[#111827] mt-0.5">{val}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">Deadline</div>
          <div className="text-xs font-semibold text-[#374151] mt-0.5">{deadline}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">Portal</div>
          <div className="text-xs font-semibold text-[#374151] mt-0.5">{portal}</div>
        </div>
      </div>

      {/* Match score section */}
      <div className="flex items-center gap-6 p-4 rounded-xl bg-[#f8fafc] border border-[#f1f5f9] mb-5">
        <ScoreArc score={score} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#111827]">Match Score</span>
            <span className="text-xs font-bold text-[#16a34a]">Excellent Match</span>
          </div>
          <div className="space-y-1.5 text-xs text-[#374151]">
            <div className="flex items-center justify-between">
              <span className="text-[#6b7280]">Eligibility</span>
              <span className="font-bold text-[#16a34a] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a]" /> Eligible
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6b7280]">Win Probability</span>
              <span className="font-mono font-bold text-[#16a34a]">81%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6b7280]">Preparation Time</span>
              <span className="font-mono text-[#374151]">18 - 22 Days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6b7280]">EMD Required</span>
              <span className="font-mono text-[#374151]">{emdVal}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6b7280]">L1 Price (Est.)</span>
              <span className="font-mono font-bold text-[#111827]">₹36.71 Cr</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation Callout */}
      <div className="p-3 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] mb-5 text-xs text-[#1e3a8a]">
        <span className="font-bold">AI Recommendation:</span> Proceed with bid. Strong match with high win probability.
      </div>

      {/* View Full Analysis Link */}
      <Link href="/dashboard" className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-[#1d4ed8] hover:bg-[#eff6ff] rounded-lg transition-colors border border-[#bfdbfe]">
        View Full Analysis <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
