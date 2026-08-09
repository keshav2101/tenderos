"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

const STAGES = [
  {
    id: "01",
    name: "RAW NIT INGESTION",
    tagline: "Document Ingestion",
    objective: "Automated ingestion, OCR, and document layout parsing for multi-page NIT tender documents across scanned & digital PDFs.",
    checks: [
      { label: "OCR & Document Hierarchy Extraction", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
      { label: "BOQ Schedule Identification", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
      { label: "Corrigendum & Addendum Linking", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
    ],
  },
  {
    id: "02",
    name: "CLAUSE EXTRACTION",
    tagline: "NLP Clause Extraction",
    objective: "Deep NLP scanning identifies critical clauses, technical specifications, and legal conditions from procurement notices.",
    checks: [
      { label: "Turnover & Net Worth Criteria", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
      { label: "EMD & Security Deposit Clause", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
      { label: "Delivery Timeline & Penalty Terms", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
    ],
  },
  {
    id: "03",
    name: "SEMANTIC UNDERSTANDING",
    tagline: "Intent & Domain Mapping",
    objective: "Vector embeddings map complex technical requirements to standard industry taxonomy and capability vectors.",
    checks: [
      { label: "CPV / GeM Category Mapping", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
      { label: "Scope of Work Entity Parsing", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
      { label: "OEM Authorization Rules", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
    ],
  },
  {
    id: "04",
    name: "ELIGIBILITY MATCHING",
    tagline: "Digital Twin Verification",
    objective: "Automated cross-referencing of tender requirements against your company's credentials, certificates, and financials.",
    checks: [
      { label: "Turnover Compliance Verification", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
      { label: "Prior Work Experience Validation", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
      { label: "Udyam MSME Exemption Check", status: "EXEMPT", badge: "bg-[#1e1b4b]/80 text-[#60a5fa] border border-[#3b82f6]/50" },
      { label: "ISO 27001 Certification", status: "WARNING", badge: "bg-[#451a03]/60 text-[#fbbf24] border border-[#d97706]/50" },
    ],
  },
  {
    id: "05",
    name: "RISK ANALYSIS",
    tagline: "Contractual & Commercial Risks",
    objective: "Flags unusual liquid damages clauses, onerous payment terms, or restrictive eligibility criteria.",
    checks: [
      { label: "Arbitration & Jurisdiction Review", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
      { label: "Payment Milestone Vulnerability", status: "WARNING", badge: "bg-[#451a03]/60 text-[#fbbf24] border border-[#d97706]/50" },
      { label: "Price Escalation Clause Scan", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
    ],
  },
  {
    id: "06",
    name: "MARKET INTELLIGENCE",
    tagline: "Historical & Price Analytics",
    objective: "Analyzes 5 years of historical L1 prices, buyer tendering patterns, and competitor win rates for accurate estimation.",
    checks: [
      { label: "Historical L1 Price Discovery", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
      { label: "Competitor Participation Density", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
      { label: "Buyer Payment Timeliness Index", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
    ],
  },
  {
    id: "07",
    name: "BID DECISION ENGINE",
    tagline: "Go / No-Go Recommendation",
    objective: "Generates final strategic decision report with probability score, pricing recommendations, and automated proposal outlines.",
    checks: [
      { label: "QCBS Score Optimization", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
      { label: "Win Probability Assessment", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
      { label: "Automated Draft Proposal Structure", status: "PASS", badge: "bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/50" },
    ],
  },
];

export default function IntelligencePipeline() {
  const [activeStage, setActiveStage] = useState(3);
  const stage = STAGES[activeStage];

  return (
    <div className="bg-[#0f172a]/95 border border-[#1e293b] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between min-w-0" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div>
        <div className="mb-4">
          <h3 className="text-base font-bold text-white">AI Processing Pipeline</h3>
          <p className="text-xs text-[#94a3b8] mt-0.5">7-stage AI pipeline that analyzes every tender opportunity</p>
        </div>

        <div className="grid md:grid-cols-[200px_1fr] gap-5 min-w-0">
          {/* Left Vertical Selector */}
          <div className="space-y-1 pr-2 border-r border-[#1e293b] hidden md:block">
            {STAGES.map((s, idx) => {
              const isActive = idx === activeStage;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStage(idx)}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left ${
                    isActive
                      ? "bg-[#2563eb] text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] font-semibold"
                      : "hover:bg-[#1e293b] text-[#94a3b8]"
                  }`}
                >
                  <span className={`text-[11px] font-mono font-bold w-5 text-center flex-shrink-0 ${isActive ? "text-white" : "text-[#64748b]"}`}>
                    {s.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[11px] font-bold truncate ${isActive ? "text-white" : "text-[#e2e8f0]"}`}>
                      {s.name}
                    </div>
                    <div className={`text-[9px] truncate ${isActive ? "text-blue-200" : "text-[#64748b]"}`}>
                      {s.tagline}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Active Panel */}
          <div className="flex flex-col justify-between space-y-4 min-w-0">
            <div>
              <div className="pb-3 mb-3 border-b border-[#1e293b]">
                <div className="text-[10px] font-mono text-[#64748b] font-bold">STAGE {stage.id} OF 07</div>
                <h4 className="text-xs font-extrabold text-white mt-0.5">{stage.name}</h4>
              </div>

              <div className="mb-4">
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#64748b] mb-1">STAGE OBJECTIVE</div>
                <p className="text-[11px] text-[#94a3b8] leading-relaxed">{stage.objective}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">AUTOMATED CHECKS &amp; VERIFICATIONS</div>
                {stage.checks.map((chk, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[#1e293b] bg-[#080d1a] text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {chk.status === "WARNING" ? (
                        <AlertCircle className="w-3.5 h-3.5 text-[#fbbf24] flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80] flex-shrink-0" />
                      )}
                      <span className="font-medium text-[#e2e8f0] truncate">{chk.label}</span>
                    </div>
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded flex-shrink-0 whitespace-nowrap ${chk.badge}`}>
                      {chk.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-1">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-semibold text-[#94a3b8]">Pipeline Progress</span>
                  <span className="font-mono text-[#64748b]">4 of 7 stages complete &middot; <strong className="text-white">57%</strong></span>
                </div>
                <div className="w-full h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                  <div className="h-full bg-[#2563eb] rounded-full shadow-[0_0_10px_rgba(37,99,235,0.6)]" style={{ width: "57%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
