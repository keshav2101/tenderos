"use client";

import { useState } from "react";
import { MessageSquare, Bot, User, FileText } from "lucide-react";

export default function AICopilotDemo() {
  const [activeTab, setActiveTab] = useState<"eligibility" | "emd" | "penalties">("eligibility");

  return (
    <div className="bg-white border border-[#D9E1E8] rounded p-6 sm:p-10 shadow-2xs min-w-0" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-xl mb-6">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#1F5A96] bg-[#F1F5F9] px-2.5 py-0.5 rounded border border-[#D9E1E8] uppercase tracking-wider mb-2">
          <MessageSquare className="w-3 h-3 text-[#1F5A96]" /> TENDER COPILOT INTELLIGENCE
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight">
          Ask Your Tenders. Get Cited Answers.
        </h2>
        <p className="text-xs sm:text-sm text-[#475569] mt-1">
          Query complex 200-page NIT documents in plain English and receive instant answers linked directly to original clause citations.
        </p>
      </div>

      {/* Interactive Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab("eligibility")}
          className={`px-3 py-1.5 rounded font-bold transition-colors ${activeTab === "eligibility" ? "bg-[#12355B] text-white" : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"}`}
        >
          Eligibility &amp; Turnover
        </button>
        <button
          onClick={() => setActiveTab("emd")}
          className={`px-3 py-1.5 rounded font-bold transition-colors ${activeTab === "emd" ? "bg-[#12355B] text-white" : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"}`}
        >
          EMD &amp; MSME Waiver
        </button>
        <button
          onClick={() => setActiveTab("penalties")}
          className={`px-3 py-1.5 rounded font-bold transition-colors ${activeTab === "penalties" ? "bg-[#12355B] text-white" : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"}`}
        >
          Liquidated Damages &amp; SLAs
        </button>
      </div>

      {/* Chat Window Mockup */}
      <div className="bg-[#F7F9FC] border border-[#D9E1E8] rounded p-5 space-y-4 text-xs min-w-0">
        
        {/* User Query */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded bg-[#12355B] text-white flex items-center justify-center flex-shrink-0 font-bold">
            <User className="w-4 h-4" />
          </div>
          <div className="bg-white border border-[#D9E1E8] rounded p-3 text-[#0B1F33] font-medium shadow-2xs">
            {activeTab === "eligibility" && "What are the specific turnover and past experience criteria for NIT CPPP/2026/NIT-04812?"}
            {activeTab === "emd" && "Are we exempt from submitting EMD for this Railway signaling tender?"}
            {activeTab === "penalties" && "What are the liquidated damages and SLA penalty clauses in Section 4?"}
          </div>
        </div>

        {/* AI Copilot Answer with Source Citation */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded bg-[#18794E] text-white flex items-center justify-center flex-shrink-0 font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div className="bg-[#EAF6EF] border border-[#A7F3D0] rounded p-4 text-[#0B1F33] space-y-2 flex-1 min-w-0">
            <div className="font-extrabold text-[#18794E] flex items-center gap-1.5">
              <span>TenderOS Copilot Answer</span>
              <span className="text-[9px] bg-white text-[#18794E] px-1.5 py-0.5 rounded border border-[#A7F3D0]">Verified</span>
            </div>

            {activeTab === "eligibility" && (
              <p className="leading-relaxed">
                The bidder must have an average annual turnover of <strong>₹10 Cr</strong> over the last 3 financial years and 3 completed similar projects worth <strong>₹15 Cr+</strong>. Your Company Twin reflects ₹12.4 Cr turnover — <strong>QUALIFIED (92% Confidence)</strong>.
              </p>
            )}

            {activeTab === "emd" && (
              <p className="leading-relaxed">
                <strong>YES — EXEMPT.</strong> Under GFR 2017 Rule 170(i), Udyam MSME registered firms are exempt from EMD deposit of ₹85 Lakhs.
              </p>
            )}

            {activeTab === "penalties" && (
              <p className="leading-relaxed">
                Liquidated damages are capped at <strong>0.5% per week up to maximum 10%</strong> of contract value. Milestone delay beyond 30 days permits buyer termination.
              </p>
            )}

            {/* Source Citation Badge */}
            <div className="pt-2 border-t border-[#A7F3D0] flex items-center gap-2 text-[10px] font-mono text-[#18794E]">
              <FileText className="w-3.5 h-3.5" />
              <span>Source Citation: NIT Document Section 3.2 &middot; Page 14 &middot; Clause 4.8.1</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
