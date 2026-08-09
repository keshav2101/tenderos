"use client";
import Link from "next/link";
import { ArrowRight, Check, ArrowDown } from "lucide-react";
import { CANONICAL_FEATURED_RECOMMENDATION } from "./HeroArtifact";

export default function BidDecisionEngine() {
  const rec = CANONICAL_FEATURED_RECOMMENDATION;

  return (
    <div className="bg-white border border-[#D9E1E8] rounded p-6 shadow-2xs flex flex-col justify-between min-w-0" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div>
        <div className="mb-5">
          <h3 className="text-xl font-extrabold text-[#0B1F33]">Bid Intelligence Decision Engine</h3>
          <p className="text-xs text-[#475569] mt-0.5">Automated cross-referencing of Company Digital Twin against tender specifications</p>
        </div>

        {/* Official Decision Architecture Tree */}
        <div className="bg-[#F7F9FC] border border-[#D9E1E8] rounded p-5 mb-5 space-y-3 text-center min-w-0">
          
          {/* Level 1: Tender */}
          <div className="inline-block bg-white border border-[#D9E1E8] rounded px-4 py-1.5 text-xs font-bold text-[#0B1F33] shadow-2xs">
            TENDER SPECIFICATION
          </div>

          <div className="flex justify-center text-[#64748B]">
            <ArrowDown className="w-3.5 h-3.5" />
          </div>

          {/* Level 2: Requirement Analysis */}
          <div className="inline-block bg-white border border-[#D9E1E8] rounded px-4 py-1.5 text-xs font-semibold text-[#334155] shadow-2xs">
            REQUIREMENT EXTRACTION &amp; CLAUSE PARSING
          </div>

          <div className="flex justify-center text-[#64748B]">
            <ArrowDown className="w-3.5 h-3.5" />
          </div>

          {/* Level 3: Company Profile */}
          <div className="inline-block bg-[#F1F5F9] border border-[#12355B] rounded px-4 py-1.5 text-xs font-bold text-[#12355B] shadow-2xs">
            COMPANY DIGITAL TWIN (GST · PAN · Udyam · Audited Financials)
          </div>

          <div className="flex justify-center text-[#64748B]">
            <ArrowDown className="w-3.5 h-3.5" />
          </div>

          {/* Level 4: 3 Metric Evaluation Columns */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs max-w-md mx-auto">
            <div className="bg-[#EAF6EF] border border-[#A7F3D0] p-2 rounded">
              <div className="text-[10px] font-semibold text-[#475569]">ELIGIBILITY</div>
              <div className="font-mono font-extrabold text-[#18794E] mt-0.5">{rec.eligibility_score}% PASS</div>
            </div>
            <div className="bg-[#EAF6EF] border border-[#A7F3D0] p-2 rounded">
              <div className="text-[10px] font-semibold text-[#475569]">RISK SCORE</div>
              <div className="font-mono font-extrabold text-[#18794E] mt-0.5">{rec.risk_level.toUpperCase()} RISK</div>
            </div>
            <div className="bg-[#EAF6EF] border border-[#A7F3D0] p-2 rounded">
              <div className="text-[10px] font-semibold text-[#475569]">WIN PROBABILITY</div>
              <div className="font-mono font-extrabold text-[#18794E] mt-0.5">{rec.win_probability}%</div>
            </div>
          </div>

          <div className="flex justify-center text-[#64748B]">
            <ArrowDown className="w-3.5 h-3.5" />
          </div>

          {/* Level 5: Final Canonical Decision (Matching Hero preview) */}
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto pt-1">
            <div className="bg-[#18794E] text-white py-2.5 rounded text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-2xs">
              <Check className="w-4 h-4" /> BID ({rec.confidence.toUpperCase()} CONFIDENCE)
            </div>
            <div className="bg-[#E2E8F0] text-[#64748B] py-2.5 rounded text-xs font-extrabold uppercase tracking-wider flex items-center justify-center opacity-60">
              NO BID
            </div>
          </div>

        </div>
      </div>

      <div className="pt-3 border-t border-[#D9E1E8]">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs font-bold text-[#1F5A96] hover:text-[#12355B]">
          How Decision Engine Works <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
