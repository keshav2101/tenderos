"use client";

import { FileText, ArrowRight, Download, CheckCircle2 } from "lucide-react";

export default function ProposalGeneratorFlow() {
  return (
    <div className="bg-white border border-[#D9E1E8] rounded p-6 sm:p-10 shadow-2xs min-w-0" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-xl mb-8">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#1F5A96] bg-[#F1F5F9] px-2.5 py-0.5 rounded border border-[#D9E1E8] uppercase tracking-wider mb-2">
          <FileText className="w-3 h-3 text-[#1F5A96]" /> AUTOMATED PROPOSAL ENGINE
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight">
          From Tender Discovery to Submitted Proposal
        </h2>
        <p className="text-xs sm:text-sm text-[#475569] mt-1">
          Generate compliant technical proposals, executive summaries, and BOQ cost schedules aligned with government tender specifications.
        </p>
      </div>

      {/* Proposal Sequence Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { step: "01", title: "Clause Extraction", desc: "TenderOS extracts technical scope, SLAs, and required compliance certificates." },
          { step: "02", title: "Credentials Mapping", desc: "Company Digital Twin maps past completion certificates and audited financial sheets." },
          { step: "03", title: "Proposal Drafting", desc: "Generates technical bid draft, executive summary, and BOQ pricing schedule." },
          { step: "04", title: "Compliance Review & Export", desc: "Final compliance check against NIT instructions with 1-click PDF/Word export." },
        ].map((s, idx) => (
          <div key={s.step} className="p-4 rounded border border-[#D9E1E8] bg-[#F7F9FC] flex flex-col justify-between space-y-3 min-w-0">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono font-bold text-[#1F5A96]">STEP {s.step}</span>
                <CheckCircle2 className="w-4 h-4 text-[#18794E]" />
              </div>
              <h3 className="text-xs font-extrabold text-[#0B1F33] mb-1">{s.title}</h3>
              <p className="text-[11px] text-[#475569] leading-relaxed">{s.desc}</p>
            </div>
            {idx === 3 && (
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-[#18794E] px-2.5 py-1 rounded w-full justify-center">
                  <Download className="w-3 h-3" /> Ready to Export
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
