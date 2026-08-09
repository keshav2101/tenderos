"use client";

import { Clock, Check, X } from "lucide-react";

export default function OutcomeComparison() {
  return (
    <div className="bg-white border border-[#D9E1E8] rounded p-6 sm:p-10 shadow-2xs" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-2xl mb-8">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#1F5A96] bg-[#F1F5F9] px-2.5 py-0.5 rounded border border-[#D9E1E8] uppercase tracking-wider mb-2">
          <Clock className="w-3 h-3 text-[#1F5A96]" /> EFFICIENCY &amp; BUSINESS IMPACT
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight">
          From 6 Hours of Manual Research to 10 Minutes of Intelligence
        </h2>
        <p className="text-xs sm:text-sm text-[#475569] mt-1">
          Compare the traditional manual tender discovery workflow with automated TenderOS intelligence.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Left: Traditional Manual Process */}
        <div className="p-5 rounded border border-[#FEF0EF] bg-[#FFF7F6] space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#FEE2E2]">
            <span className="text-xs font-extrabold text-[#B42318] uppercase tracking-wider">Traditional Manual Process</span>
            <span className="text-xs font-mono font-bold text-[#B42318]">~6 Hours per Tender</span>
          </div>

          <ul className="space-y-2 text-xs text-[#475569]">
            {[
              "Manually check 36 separate government portal websites daily",
              "Download 100+ page NIT tender PDFs individually",
              "Read dense legal text to locate turnover & net worth criteria",
              "Manually check MSME EMD waiver eligibility under GFR rules",
              "Unstructured competitor research and manual price guessing",
              "High risk of missing critical corrigendum deadline extensions",
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <X className="w-4 h-4 text-[#B42318] flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: TenderOS Platform */}
        <div className="p-5 rounded border border-[#A7F3D0] bg-[#EAF6EF] space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#BBF7D0]">
            <span className="text-xs font-extrabold text-[#18794E] uppercase tracking-wider">TenderOS Intelligence Engine</span>
            <span className="text-xs font-mono font-bold text-[#18794E]">~10 Minutes Automated</span>
          </div>

          <ul className="space-y-2 text-xs text-[#0B1F33]">
            {[
              "Unified live feed across 36+ portals with real-time alerting",
              "Automated OCR & clause extraction across multi-page NIT PDFs",
              "Company Digital Twin automatically checks turnover compliance",
              "Instant MSME & Startup India EMD exemption detection",
              "5 years of historical L1 price trends & competitor win rates",
              "Automated corrigendum change tracking and instant impact alerts",
            ].map(item => (
              <li key={item} className="flex items-start gap-2 font-medium">
                <Check className="w-4 h-4 text-[#18794E] flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
