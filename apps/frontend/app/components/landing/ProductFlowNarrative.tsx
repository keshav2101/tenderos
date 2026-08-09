"use client";

import { CheckCircle2, ArrowRight } from "lucide-react";

const STAGES = [
  { id: "01", name: "36+ Sources", desc: "GeM, CPPP, IREPS, Defence & State Portals" },
  { id: "02", name: "Continuous Ingestion", desc: "Real-time OCR & document structure extraction" },
  { id: "03", name: "Clause Intelligence", desc: "NLP extraction of eligibility & penalty terms" },
  { id: "04", name: "Digital Twin", desc: "Company GST, PAN, Udyam & audited financials" },
  { id: "05", name: "Eligibility Matching", desc: "Automated qualification & turnover verification" },
  { id: "06", name: "Risk Analysis", desc: "Onerous clause, SLA & LD penalty detection" },
  { id: "07", name: "Market Intelligence", desc: "Historical L1 price & competitor win analysis" },
  { id: "08", name: "Bid / No-Bid Decision", desc: "AI Go / No-Go decision with rationale" },
  { id: "09", name: "Proposal Generation", desc: "Automated technical proposal & BOQ drafting" },
  { id: "10", name: "Post-Bid Intelligence", desc: "L1 opening results & PBG release tracking" },
];

export default function ProductFlowNarrative() {
  return (
    <div className="bg-[#12355B] text-white rounded p-8 sm:p-10 shadow-sm" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-2xl mb-8">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#EAF6EF] bg-[#18794E] px-2.5 py-0.5 rounded uppercase tracking-wider mb-2">
          END-TO-END PROCUREMENT OPERATING SYSTEM
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          How TenderOS Powers Your Bidding Lifecycle
        </h2>
        <p className="text-xs sm:text-sm text-[#E2E8F0] mt-1 leading-relaxed">
          From raw portal ingestion to proposal generation and PBG tracking — TenderOS replaces manual procurement research with systematic intelligence.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STAGES.map((s, idx) => (
          <div key={s.id} className="p-3.5 rounded bg-[#0B1F33] border border-[#1F5A96] flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold text-[#1F5A96]">{s.id}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#18794E]" />
              </div>
              <div className="text-xs font-bold text-white mb-1 truncate">{s.name}</div>
              <div className="text-[10px] text-[#94A3B8] leading-tight line-clamp-2">{s.desc}</div>
            </div>
            {idx < STAGES.length - 1 && (
              <div className="pt-2 flex justify-end text-[#1F5A96] hidden sm:flex">
                <ArrowRight className="w-3 h-3" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
