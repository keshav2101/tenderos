"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

const STAGES = [
  {
    id: "01",
    name: "RAW NIT INGESTION",
    tagline: "Document Ingestion",
    objective: "Automated ingestion, OCR, and document layout parsing for multi-page NIT tender documents across scanned & digital PDFs.",
    checks: [
      { label: "OCR & Document Hierarchy Extraction", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
      { label: "BOQ Schedule Identification", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
      { label: "Corrigendum & Addendum Linking", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
    ],
  },
  {
    id: "02",
    name: "CLAUSE EXTRACTION",
    tagline: "NLP Clause Extraction",
    objective: "Deep NLP scanning identifies critical clauses, technical specifications, and legal conditions from procurement notices.",
    checks: [
      { label: "Turnover & Net Worth Criteria", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
      { label: "EMD & Security Deposit Clause", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
      { label: "Delivery Timeline & Penalty Terms", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
    ],
  },
  {
    id: "03",
    name: "SEMANTIC UNDERSTANDING",
    tagline: "Intent & Domain Mapping",
    objective: "Vector embeddings map complex technical requirements to standard industry taxonomy and capability vectors.",
    checks: [
      { label: "CPV / GeM Category Mapping", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
      { label: "Scope of Work Entity Parsing", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
      { label: "OEM Authorization Rules", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
    ],
  },
  {
    id: "04",
    name: "ELIGIBILITY MATCHING",
    tagline: "Digital Twin Verification",
    objective: "Automated cross-referencing of tender requirements against your company's credentials, certificates, and financials.",
    checks: [
      { label: "Turnover Compliance Verification", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
      { label: "Prior Work Experience Validation", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
      { label: "Udyam MSME Exemption Check", status: "EXEMPT", badge: "bg-[#eff6ff] text-[#1d4ed8]" },
      { label: "ISO 27001 Certification", status: "WARNING", badge: "bg-[#fffbeb] text-[#b45309]" },
    ],
  },
  {
    id: "05",
    name: "RISK ANALYSIS",
    tagline: "Contractual & Commercial Risks",
    objective: "Flags unusual liquid damages clauses, onerous payment terms, or restrictive eligibility criteria.",
    checks: [
      { label: "Arbitration & Jurisdiction Review", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
      { label: "Payment Milestone Vulnerability", status: "WARNING", badge: "bg-[#fffbeb] text-[#b45309]" },
      { label: "Price Escalation Clause Scan", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
    ],
  },
  {
    id: "06",
    name: "MARKET INTELLIGENCE",
    tagline: "Historical & Price Analytics",
    objective: "Analyzes 5 years of historical L1 prices, buyer tendering patterns, and competitor win rates for accurate estimation.",
    checks: [
      { label: "Historical L1 Price Discovery", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
      { label: "Competitor Participation Density", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
      { label: "Buyer Payment Timeliness Index", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
    ],
  },
  {
    id: "07",
    name: "BID DECISION ENGINE",
    tagline: "Go / No-Go Recommendation",
    objective: "Generates final strategic decision report with probability score, pricing recommendations, and automated proposal outlines.",
    checks: [
      { label: "QCBS Score Optimization", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
      { label: "Win Probability Assessment", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
      { label: "Automated Draft Proposal Structure", status: "PASS", badge: "bg-[#ecfdf5] text-[#047857]" },
    ],
  },
];

export default function IntelligencePipeline() {
  const [activeStage, setActiveStage] = useState(3);
  const stage = STAGES[activeStage];

  const nowTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Kolkata",
  }) + " IST";

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="mb-6">
        <h3 className="text-base font-bold text-[#111827]">AI Processing Pipeline</h3>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        {/* Left Vertical Selector */}
        <div className="space-y-1.5 border-r border-[#f1f5f9] pr-4">
          {STAGES.map((s, idx) => {
            const isActive = idx === activeStage;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStage(idx)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  isActive
                    ? "bg-[#1d4ed8] text-white shadow-sm font-semibold"
                    : "hover:bg-[#f8fafc] text-[#475569]"
                }`}
              >
                <span className={`text-xs font-mono font-bold w-6 text-center ${isActive ? "text-white" : "text-[#9ca3af]"}`}>
                  {s.id}
                </span>
                <div className="min-w-0">
                  <div className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-[#111827]"}`}>
                    {s.name}
                  </div>
                  <div className={`text-[10px] truncate ${isActive ? "text-blue-100" : "text-[#9ca3af]"}`}>
                    {s.tagline}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Active Panel */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-[#f1f5f9]">
              <div>
                <div className="text-[10px] font-mono text-[#9ca3af] font-bold">STAGE {stage.id} OF 07</div>
                <h4 className="text-sm font-extrabold text-[#111827] mt-0.5">{stage.name}</h4>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-[#059669] font-mono font-bold bg-[#ecfdf5] px-2 py-0.5 rounded text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" /> LIVE
                </span>
                <span className="text-[10px] font-mono text-[#9ca3af]">Updated {nowTime}</span>
                <RefreshCw className="w-3 h-3 text-[#9ca3af] cursor-pointer hover:text-[#111827]" />
              </div>
            </div>

            {/* Stage Content Grid */}
            <div className="grid md:grid-cols-[1fr_180px] gap-6">
              <div className="space-y-5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1">Stage Objective</div>
                  <p className="text-xs text-[#374151] leading-relaxed">{stage.objective}</p>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-3">Automated Checks & Verifications</div>
                  <div className="space-y-2">
                    {stage.checks.map((chk, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {chk.status === "WARNING" ? (
                            <AlertCircle className="w-3.5 h-3.5 text-[#b45309] flex-shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                          )}
                          <span className="font-medium text-[#111827] truncate">{chk.label}</span>
                        </div>
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded flex-shrink-0 ml-2 ${chk.badge}`}>
                          {chk.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[#374151]">Pipeline Progress</span>
                    <span className="font-mono text-[#9ca3af]">4 of 7 stages complete &middot; <strong className="text-[#111827]">57%</strong></span>
                  </div>
                  <div className="w-full h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#1d4ed8] rounded-full" style={{ width: "57%" }} />
                  </div>
                </div>
              </div>

              {/* Analysis Metrics Box (Right Side) */}
              <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#f1f5f9] space-y-3 text-xs">
                <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-2">Analysis Metrics</div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Match Score</span>
                  <span className="font-mono font-bold text-[#111827]">94 <span className="text-[9px] text-[#9ca3af]">/100</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Win Probability</span>
                  <span className="font-mono font-bold text-[#059669]">81%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">EMD Status</span>
                  <span className="font-mono font-bold text-[#059669]">WAIVED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Preparation Time</span>
                  <span className="font-mono text-[#111827]">4 hrs</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#e2e8f0]">
                  <span className="text-[#6b7280]">L1 Price (Est.)</span>
                  <span className="font-mono font-bold text-[#111827]">₹36.71 Cr</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#f1f5f9] flex justify-end">
            <Link href="/dashboard" className="text-xs font-semibold text-[#1d4ed8] hover:underline flex items-center gap-1">
              View Full Pipeline <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
