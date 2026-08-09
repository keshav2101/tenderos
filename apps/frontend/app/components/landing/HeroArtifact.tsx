"use client";
import type { Tender } from "@/types/procurement";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

function fmt(date?: string) {
  if (!date) return "28 Aug 2026";
  try {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
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
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="6" stroke="#e2e8f0" />
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="6"
          stroke="#059669" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.8s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-[#111827] leading-none">{score}</span>
        <span className="text-[9px] text-[#9ca3af] font-medium font-mono mt-0.5">/100</span>
      </div>
    </div>
  );
}

interface Props {
  tender: Tender | null;
  isLoading: boolean;
}

export default function HeroArtifact({ tender, isLoading }: Props) {
  const title = tender?.title || "AI-based Fraud Detection System — Government of India";
  const dept = tender?.department || tender?.ministry || "Ministry of Finance · Department of Revenue · CPPP";
  const val = fmtCr(tender?.estimated_cost_lakhs);
  const deadline = fmt(tender?.submission_deadline);
  const portal = tender?.source ? `${tender.source} / GeM` : "CPPP / GeM";
  const nitNo = tender?.tender_id || "04812/2026";
  const score = tender?.msme_eligible ? 94 : 88;

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-sm transition-shadow min-w-0" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#f1f5f9]">
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
      <div className="mb-4">
        <h3 className="text-xs sm:text-sm font-bold text-[#111827] leading-snug line-clamp-2">{title}</h3>
        <p className="text-[11px] text-[#6b7280] mt-0.5 truncate">{dept}</p>
      </div>

      {/* 4 Metadata Columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pb-4 mb-4 border-b border-[#f1f5f9] text-xs min-w-0">
        <div>
          <div className="text-[10px] font-medium text-[#9ca3af]">Estimated Value</div>
          <div className="text-xs font-extrabold text-[#111827] mt-0.5 truncate">{val}</div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-[#9ca3af]">Bid Deadline</div>
          <div className="text-xs font-semibold text-[#111827] mt-0.5 truncate">{deadline}</div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-[#9ca3af]">Portal</div>
          <div className="text-xs font-semibold text-[#111827] mt-0.5 truncate">{portal}</div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-[#9ca3af]">NIT No.</div>
          <div className="text-xs font-semibold text-[#111827] mt-0.5 truncate">{nitNo}</div>
        </div>
      </div>

      {/* Score Dial & Recommendation Box */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-xl bg-[#f8fafc] border border-[#f1f5f9] mb-4">
        <div className="flex flex-col items-center flex-shrink-0">
          <ScoreArc score={score} />
          <span className="text-[9px] font-medium text-[#6b7280] mt-1">Match Score</span>
        </div>

        <div className="flex-1 w-full space-y-2.5 min-w-0">
          <div className="p-2.5 rounded-lg bg-[#ecfdf5] border border-[#a7f3d0]">
            <div className="text-[9px] font-bold text-[#047857] uppercase tracking-wider mb-0.5">AI Recommendation</div>
            <div className="text-xs font-extrabold text-[#065f46]">BID — High confidence</div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
            <div>
              <div className="text-[9px] text-[#9ca3af]">Win Prob.</div>
              <div className="font-bold text-[#059669] mt-0.5">81%</div>
            </div>
            <div>
              <div className="text-[9px] text-[#9ca3af]">Prep Time</div>
              <div className="font-semibold text-[#111827] mt-0.5">4 hrs</div>
            </div>
            <div>
              <div className="text-[9px] text-[#9ca3af]">EMD Status</div>
              <div className="font-bold text-[#059669] mt-0.5">WAIVED</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="flex items-center justify-between text-xs pt-0.5">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-[#6b7280]">L1 Price (Est.)</span>
          <span className="font-extrabold text-[#111827]">₹36.71 Cr</span>
        </div>
        <Link href="/dashboard" className="font-semibold text-[#1d4ed8] hover:underline flex items-center gap-1 flex-shrink-0 whitespace-nowrap ml-2">
          View Full Analysis <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
