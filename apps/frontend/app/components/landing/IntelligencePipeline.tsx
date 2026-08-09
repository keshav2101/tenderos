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
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between min-w-0" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="mb-4">
        <h3 className="text-base font-bold text-[#111827]">AI Processing Pipeline</h3>
      </div>

      <div className="grid md:grid-cols-[200px_1fr] gap-5 min-w-0">
        {/* Left Vertical Selector */}
        <div className="space-y-1 pr-2 border-r border-[#f1f5f9] hidden md:block">
          {STAGES.map((s, idx) => {
            const isActive = idx === activeStage;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStage(idx)}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left ${
                  isActive
                    ? "bg-[#1d4ed8] text-white shadow-xs font-semibold"
                    : "hover:bg-[#f8fafc] text-[#475569]"
                }`}
              >
                <span className={`text-[11px] font-mono font-bold w-5 text-center flex-shrink-0 ${isActive ? "text-white" : "text-[#9ca3af]"}`}>
                  {s.id}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`text-[11px] font-bold truncate ${isActive ? "text-white" : "text-[#111827]"}`}>
                    {s.name}
                  </div>
                  <div className={`text-[9px] truncate ${isActive ? "text-blue-100" : "text-[#9ca3af]"}`}>
                    {s.tagline}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile Horizontal Selector */}
        <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-2">
          {STAGES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveStage(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0 ${
                idx === activeStage ? "bg-[#1d4ed8] text-white" : "bg-[#f1f5f9] text-[#475569]"
              }`}
            >
              {s.id} {s.name}
            </button>
          ))}
        </div>

        {/* Right Active Panel */}
        <div className="flex flex-col justify-between space-y-4 min-w-0">
          <div>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#f1f5f9]">
              <div>
                <div className="text-[10px] font-mono text-[#9ca3af] font-bold">STAGE {stage.id} OF 07</div>
                <h4 className="text-xs font-extrabold text-[#111827] mt-0.5">{stage.name}</h4>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-[#059669] font-mono font-bold bg-[#ecfdf5] px-1.5 py-0.5 rounded text-[9px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" /> LIVE
                </span>
                <span className="text-[9px] font-mono text-[#9ca3af] truncate">Updated {nowTime}</span>
              </div>
            </div>

            {/* Objective */}
            <div className="mb-4">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1">Stage Objective</div>
              <p className="text-[11px] text-[#374151] leading-relaxed">{stage.objective}</p>
            </div>

            {/* Checks */}
            <div className="space-y-2 mb-4">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#9ca3af]">Automated Checks & Verifications</div>
              {stage.checks.map((chk, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {chk.status === "WARNING" ? (
                      <AlertCircle className="w-3.5 h-3.5 text-[#b45309] flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                    )}
                    <span className="font-medium text-[#111827] truncate">{chk.label}</span>
                  </div>
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded flex-shrink-0 whitespace-nowrap ${chk.badge}`}>
                    {chk.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="pt-1">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-semibold text-[#374151]">Pipeline Progress</span>
                <span className="font-mono text-[#9ca3af]">4 of 7 complete &middot; <strong className="text-[#111827]">57%</strong></span>
              </div>
              <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                <div className="h-full bg-[#1d4ed8] rounded-full" style={{ width: "57%" }} />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#f1f5f9] flex justify-end">
            <Link href="/dashboard" className="text-xs font-semibold text-[#1d4ed8] hover:underline flex items-center gap-1">
              View Full Pipeline <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
