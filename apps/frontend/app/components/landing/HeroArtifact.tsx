"use client";
import type { Tender } from "@/types/procurement";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

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
  if (!lakhs) return "₹42.8 Cr";
  const cr = lakhs / 100;
  return `₹${cr.toFixed(1)} Cr`;
}

function ScoreArc({ score = 94 }: { score?: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="6" stroke="#e2e8f0" />
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="6"
          stroke="#059669" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.8s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-[#111827] leading-none">{score}</span>
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
      <div className="grid grid-cols-4 gap-3 pt-2">
        <div className="h-8 bg-[#e2e8f0] rounded" />
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

  const title = tender?.title || "AI-based Fraud Detection System — Government of India";
  const dept = tender?.department || tender?.ministry || "Ministry of Finance · Department of Revenue · CPPP";
  const val = fmtCr(tender?.estimated_cost_lakhs);
  const deadline = fmt(tender?.submission_deadline);
  const portal = tender?.source ? `${tender.source} / GeM` : "CPPP / GeM";
  const nitNo = tender?.tender_id || "04812/2026";
  const score = tender?.msme_eligible ? 94 : 88;

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#f1f5f9]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1d4ed8]" />
          </div>
          <span className="text-xs font-bold text-[#111827]">AI Bid Assessment</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#059669]">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
          Live Analysis
        </div>
      </div>

      {/* Tender Title & Ministry */}
      <div className="mb-5">
        <h3 className="text-sm font-bold text-[#111827] leading-snug line-clamp-2">{title}</h3>
        <p className="text-xs text-[#6b7280] mt-1 truncate">{dept}</p>
      </div>

      {/* 4 Metadata Columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-5 mb-5 border-b border-[#f1f5f9]">
        <div>
          <div className="text-[10px] font-medium text-[#9ca3af]">Estimated Value</div>
          <div className="text-sm font-extrabold text-[#111827] mt-0.5">{val}</div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-[#9ca3af]">Bid Deadline</div>
          <div className="text-xs font-semibold text-[#111827] mt-0.5">{deadline}</div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-[#9ca3af]">Portal</div>
          <div className="text-xs font-semibold text-[#111827] mt-0.5">{portal}</div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-[#9ca3af]">NIT No.</div>
          <div className="text-xs font-semibold text-[#111827] mt-0.5">{nitNo}</div>
        </div>
      </div>

      {/* Score Dial & Recommendation Box */}
      <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-[#f8fafc] border border-[#f1f5f9] mb-5">
        <div className="flex flex-col items-center">
          <ScoreArc score={score} />
          <span className="text-[10px] font-medium text-[#6b7280] mt-1">Match Score</span>
        </div>

        <div className="flex-1 w-full space-y-3">
          {/* Green AI Recommendation Box */}
          <div className="p-3 rounded-lg bg-[#ecfdf5] border border-[#a7f3d0]">
            <div className="text-[10px] font-bold text-[#047857] uppercase tracking-wider mb-0.5">AI Recommendation</div>
            <div className="text-xs font-extrabold text-[#065f46]">BID — High confidence</div>
          </div>

          {/* 3 Metric Pills */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-[10px] text-[#9ca3af]">Win Probability</div>
              <div className="font-bold text-[#059669] mt-0.5">81%</div>
            </div>
            <div>
              <div className="text-[10px] text-[#9ca3af]">Preparation Time</div>
              <div className="font-semibold text-[#111827] mt-0.5">4 hrs</div>
            </div>
            <div>
              <div className="text-[10px] text-[#9ca3af]">EMD Status</div>
              <div className="font-bold text-[#059669] mt-0.5">WAIVED</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[#6b7280]">L1 Price (Est.)</span>
          <span className="font-extrabold text-[#111827]">₹36.71 Cr</span>
        </div>
        <Link href="/dashboard" className="font-semibold text-[#1d4ed8] hover:underline flex items-center gap-1">
          View Full Analysis <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
