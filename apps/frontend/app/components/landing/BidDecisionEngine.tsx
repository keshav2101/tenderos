"use client";
import Link from "next/link";
import { ArrowRight, Brain, Check } from "lucide-react";

export default function BidDecisionEngine() {
  return (
    <div className="bg-[#0f172a]/95 border border-[#1e293b] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between min-w-0" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div>
        <div className="mb-5">
          <h3 className="text-base font-bold text-white">Bid Intelligence Engine</h3>
          <p className="text-xs text-[#94a3b8] mt-0.5">AI-powered decision engine for smarter bidding</p>
        </div>

        {/* 3 Column Flowchart Visual Diagram */}
        <div className="bg-[#080d1a] border border-[#1e293b] rounded-xl p-4 sm:p-5 mb-5 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-center">
            
            {/* Column 1: Digital Twin & Tender Requirements */}
            <div className="space-y-2">
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-2">
                <div className="text-[8px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">YOUR DIGITAL TWIN</div>
                <div className="flex flex-wrap justify-center gap-1 text-[8px] font-mono text-white">
                  <span className="bg-[#1e293b] px-1.5 py-0.5 rounded">Udyam</span>
                  <span className="bg-[#1e293b] px-1.5 py-0.5 rounded">GST</span>
                  <span className="bg-[#1e293b] px-1.5 py-0.5 rounded">PAN</span>
                  <span className="bg-[#1e293b] px-1.5 py-0.5 rounded">Financials</span>
                  <span className="bg-[#1e293b] px-1.5 py-0.5 rounded">Experience</span>
                </div>
              </div>

              <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-2">
                <div className="text-[8px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">TENDER REQUIREMENTS</div>
                <div className="flex flex-wrap justify-center gap-1 text-[8px] font-mono text-white">
                  <span className="bg-[#1e293b] px-1.5 py-0.5 rounded">Documents</span>
                  <span className="bg-[#1e293b] px-1.5 py-0.5 rounded">Clauses</span>
                  <span className="bg-[#1e293b] px-1.5 py-0.5 rounded">Eligibility</span>
                  <span className="bg-[#1e293b] px-1.5 py-0.5 rounded">Commercials</span>
                </div>
              </div>
            </div>

            {/* Column 2: AI Analysis Engine Center Node */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="w-16 h-16 rounded-full bg-[#1e1b4b] border border-[#4338ca] text-[#818cf8] flex flex-col items-center justify-center p-2 shadow-[0_0_20px_rgba(67,56,202,0.5)]">
                <Brain className="w-6 h-6 text-[#818cf8] mb-0.5" />
                <span className="text-[7px] font-bold text-center leading-none text-white">AI ANALYSIS ENGINE</span>
              </div>
            </div>

            {/* Column 3: 3 Outcome Metrics */}
            <div className="space-y-1.5">
              <div className="bg-[#064e3b]/30 border border-[#059669]/50 rounded-lg py-1.5 px-2 text-[10px] flex justify-between items-center">
                <span className="text-[#94a3b8] text-[9px] uppercase font-bold">ELIGIBILITY</span>
                <span className="font-mono font-bold text-[#4ade80]">92%</span>
              </div>
              <div className="bg-[#064e3b]/30 border border-[#059669]/50 rounded-lg py-1.5 px-2 text-[10px] flex justify-between items-center">
                <span className="text-[#94a3b8] text-[9px] uppercase font-bold">RISK SCORE</span>
                <span className="font-mono font-bold text-[#4ade80]">Low</span>
              </div>
              <div className="bg-[#064e3b]/30 border border-[#059669]/50 rounded-lg py-1.5 px-2 text-[10px] flex justify-between items-center">
                <span className="text-[#94a3b8] text-[9px] uppercase font-bold">OPPORTUNITY</span>
                <span className="font-mono font-bold text-[#4ade80]">High</span>
              </div>
            </div>

          </div>

          {/* Decision Buttons Row */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#1e293b]">
            <div className="bg-[#059669] text-white py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(5,150,105,0.4)]">
              <Check className="w-3.5 h-3.5" /> BID
            </div>
            <div className="bg-[#1e293b] text-[#64748b] py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center justify-center">
              NO BID
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-[#1e293b]">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs font-semibold text-[#60a5fa] hover:text-white">
          How it works <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
