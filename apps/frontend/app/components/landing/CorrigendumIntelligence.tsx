"use client";

import { RefreshCcw, AlertTriangle, ArrowRight, Check } from "lucide-react";

export default function CorrigendumIntelligence() {
  return (
    <div className="bg-white border border-[#D9E1E8] rounded p-6 sm:p-10 shadow-2xs min-w-0" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-xl mb-8">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#A16207] bg-[#FFF7E6] px-2.5 py-0.5 rounded border border-[#FDE68A] uppercase tracking-wider mb-2">
          <RefreshCcw className="w-3 h-3 text-[#A16207]" /> CORRIGENDUM &amp; CHANGE INTELLIGENCE
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight">
          Never Miss a Tender Amendment
        </h2>
        <p className="text-xs sm:text-sm text-[#475569] mt-1">
          TenderOS continuously monitors published corrigendums, addendums, and deadline extensions, analyzing exact structural changes.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-center">
        
        {/* Original vs Corrigendum Comparison Card */}
        <div className="p-5 rounded border border-[#D9E1E8] bg-[#F7F9FC] space-y-4 min-w-0">
          <div className="flex items-center justify-between pb-3 border-b border-[#D9E1E8]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#A16207]" />
              <span className="font-extrabold text-xs text-[#0B1F33]">Corrigendum #02 Detected</span>
            </div>
            <span className="text-[10px] font-mono text-[#64748B]">Updated 10 min ago</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded bg-white border border-[#E2E8F0] space-y-1">
              <div className="text-[10px] font-bold text-[#B42318] uppercase">Original Requirement</div>
              <div className="text-[#475569]">Bid Deadline: 21 Aug 2026 &middot; Min Turnover: ₹15 Cr</div>
            </div>

            <div className="p-3 rounded bg-[#EAF6EF] border border-[#A7F3D0] space-y-1">
              <div className="text-[10px] font-bold text-[#18794E] uppercase">Amended Corrigendum Clause</div>
              <div className="text-[#0B1F33] font-semibold">Bid Deadline extended to 28 Aug 2026 &middot; Turnover relaxed to ₹10 Cr</div>
            </div>
          </div>
        </div>

        {/* Impact Analysis Explanation */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-[#0B1F33]">
            Instant Impact Analysis &amp; Action Plan
          </h3>

          <div className="space-y-2.5 text-xs text-[#475569]">
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-[#18794E] flex-shrink-0 mt-0.5" />
              <span><strong>Turnover Eligibility Impact:</strong> Lowered threshold expands qualification to your firm.</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-[#18794E] flex-shrink-0 mt-0.5" />
              <span><strong>Preparation Buffer:</strong> 7 additional days granted for bid submission.</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-[#18794E] flex-shrink-0 mt-0.5" />
              <span><strong>Instant Alert Dispatch:</strong> SMS, Email &amp; Webhook alerts dispatched to your bid team.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
