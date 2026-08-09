"use client";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

export default function BidDecisionEngine() {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 sm:p-8 shadow-sm" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="mb-6">
        <h3 className="text-base font-bold text-[#111827]">Bid Intelligence Engine</h3>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
        {/* Left Text Column */}
        <div className="space-y-4">
          <div className="text-sm font-extrabold text-[#111827] leading-snug">
            Not a list of tenders.<br />
            A procurement decision engine.
          </div>

          <p className="text-xs text-[#6b7280] leading-relaxed">
            Our AI cross-references your Company Digital Twin against every tender requirement and provides a decision with a cited rationale.
          </p>

          <ul className="space-y-2 text-xs text-[#374151] pt-1">
            {[
              "Eligibility & compliance automation",
              "EMD waiver detection (GFR 2017, MSME rules)",
              "Make in India classification",
              "Price intelligence & L1 discovery",
              "Risk scoring & clause analysis",
              "QCBS vs L1 strategy optimization",
            ].map(item => (
              <li key={item} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#1d4ed8] flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1d4ed8] hover:underline">
              How it works <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Flowchart Diagram */}
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-5 space-y-3 text-center">
          {/* Box 1 */}
          <div className="bg-white border border-[#bfdbfe] rounded-lg p-2.5 shadow-2xs">
            <div className="text-[10px] font-bold text-[#1d4ed8] uppercase tracking-wider">YOUR DIGITAL TWIN</div>
            <div className="text-[9px] text-[#6b7280] mt-0.5">Udyam &middot; GST &middot; PAN &middot; Financials &middot; Experience</div>
          </div>

          <div className="text-[#9ca3af] text-xs leading-none">&darr;</div>

          {/* Box 2 */}
          <div className="bg-white border border-[#e2e8f0] rounded-lg py-2 px-3 text-xs font-semibold text-[#374151] shadow-2xs">
            Tender Requirements
          </div>

          <div className="text-[#9ca3af] text-xs leading-none">&darr;</div>

          {/* Box 3 */}
          <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-lg py-2 px-3 text-xs font-bold text-[#1d4ed8] shadow-2xs">
            AI Analysis Engine
          </div>

          <div className="text-[#9ca3af] text-xs leading-none">&darr;</div>

          {/* 3 Columns */}
          <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold text-[#475569]">
            <div className="bg-white border border-[#e2e8f0] py-1.5 rounded">Eligibility</div>
            <div className="bg-white border border-[#e2e8f0] py-1.5 rounded">Risk</div>
            <div className="bg-white border border-[#e2e8f0] py-1.5 rounded">Opportunity</div>
          </div>

          <div className="text-[#9ca3af] text-xs leading-none">&darr;</div>

          {/* Decision Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#059669] text-white py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider shadow-2xs">
              BID
            </div>
            <div className="bg-[#e2e8f0] text-[#6b7280] py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider">
              NO BID
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
