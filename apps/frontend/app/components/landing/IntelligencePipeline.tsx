"use client";
import { useState } from "react";
import {
  FileText, Cpu, Eye, ShieldCheck, AlertTriangle, BarChart2, CheckCircle2, ChevronRight
} from "lucide-react";

// Stage definition configuration (UI architectural structure, no static target business numbers)
const STAGES = [
  {
    id: "01",
    name: "RAW NIT INGESTION",
    tagline: "PDF & OCR Parsing",
    icon: FileText,
    summary: "Automated ingestion, OCR, and document layout parsing for multi-page NIT tender documents across scanned & digital PDFs.",
    checks: [
      { label: "OCR & Document Hierarchy Extraction", status: "PASS" },
      { label: "BOQ Schedule Identification", status: "PASS" },
      { label: "Corrigendum & Addendum Linking", status: "PASS" },
    ],
    accent: "#3b82f6",
  },
  {
    id: "02",
    name: "CLAUSE EXTRACTION",
    tagline: "NLP Clause Classification",
    icon: Cpu,
    summary: "Deep NLP scanning identifies critical clauses, technical specifications, and legal conditions from procurement notices.",
    checks: [
      { label: "Turnover & Net Worth Criteria", status: "PASS" },
      { label: "EMD & Security Deposit Clause", status: "PASS" },
      { label: "Delivery Timeline & Penalty Terms", status: "PASS" },
    ],
    accent: "#1d4ed8",
  },
  {
    id: "03",
    name: "SEMANTIC UNDERSTANDING",
    tagline: "Entity & Domain Vectorization",
    icon: Eye,
    summary: "Vector embeddings map complex technical requirements to standard industry taxonomy and capability vectors.",
    checks: [
      { label: "CPV / GeM Category Mapping", status: "PASS" },
      { label: "Scope of Work Entity Parsing", status: "PASS" },
      { label: "OEM Authorization Rules", status: "PASS" },
    ],
    accent: "#6366f1",
  },
  {
    id: "04",
    name: "ELIGIBILITY MATCHING",
    tagline: "Digital Twin Verification",
    icon: ShieldCheck,
    summary: "Automated cross-referencing of tender requirements against your company's credentials, certificates, and financials.",
    checks: [
      { label: "Turnover Compliance Verification", status: "PASS" },
      { label: "Prior Work Experience Validation", status: "PASS" },
      { label: "Udyam MSME Exemption Check", status: "EXEMPT" },
    ],
    accent: "#15803d",
  },
  {
    id: "05",
    name: "RISK ANALYSIS",
    tagline: "Contractual & Commercial Risks",
    icon: AlertTriangle,
    summary: "Flags unusual liquid damages clauses, onerous payment terms, or restrictive eligibility criteria.",
    checks: [
      { label: "Arbitration & Jurisdiction Review", status: "PASS" },
      { label: "Payment Milestone Vulnerability", status: "WARN" },
      { label: "Price Escalation Clause Scan", status: "PASS" },
    ],
    accent: "#b45309",
  },
  {
    id: "06",
    name: "MARKET INTELLIGENCE",
    tagline: "Historical Bid Analytics",
    icon: BarChart2,
    summary: "Analyzes 5 years of historical L1 prices, buyer tendering patterns, and competitor win rates for accurate estimation.",
    checks: [
      { label: "Historical L1 Price Discovery", status: "PASS" },
      { label: "Competitor Participation Density", status: "PASS" },
      { label: "Buyer Payment Timeliness Index", status: "PASS" },
    ],
    accent: "#0284c7",
  },
  {
    id: "07",
    name: "BID DECISION ENGINE",
    tagline: "Go / No-Go Determination",
    icon: CheckCircle2,
    summary: "Generates final strategic decision report with probability score, pricing recommendations, and automated proposal outlines.",
    checks: [
      { label: "QCBS Score Optimization", status: "PASS" },
      { label: "Win Probability Assessment", status: "PASS" },
      { label: "Automated Draft Proposal Structure", status: "PASS" },
    ],
    accent: "#16a34a",
  },
];

export default function IntelligencePipeline() {
  const [activeStage, setActiveStage] = useState(3);
  const stage = STAGES[activeStage];
  const Icon = stage.icon;

  const timestamp = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }) + " IST";

  return (
    <div className="grid lg:grid-cols-[300px_1fr] bg-white rounded-2xl overflow-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Stage Selector Column */}
      <div className="border-r border-[#e5e7eb] bg-[#f8fafc] p-4 flex flex-col justify-between">
        <div>
          <div className="px-3 py-2 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af] font-mono">
              PROCESSING LAYERS
            </span>
            <span className="text-[10px] font-mono text-[#1d4ed8] font-bold">7 STAGES</span>
          </div>

          <div className="space-y-1">
            {STAGES.map((s, idx) => {
              const StageIcon = s.icon;
              const isActive = idx === activeStage;

              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStage(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                    isActive
                      ? "bg-white shadow-sm border border-[#e5e7eb] text-[#111827]"
                      : "hover:bg-[#f1f5f9] text-[#6b7280]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                        isActive
                          ? "bg-[#eff6ff] text-[#1d4ed8]"
                          : "bg-[#e2e8f0] text-[#475569]"
                      }`}
                    >
                      {s.id}
                    </span>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${isActive ? "text-[#111827]" : "text-[#374151]"}`}>
                        {s.name}
                      </div>
                      <div className="text-[10px] text-[#9ca3af] truncate">{s.tagline}</div>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-[#1d4ed8] flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 mt-4 border-t border-[#e2e8f0] bg-white rounded-xl">
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1 font-mono">PIPELINE STATUS</div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#15803d] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              OPERATIONAL
            </span>
            <span className="text-[10px] font-mono text-[#9ca3af]">{timestamp}</span>
          </div>
        </div>
      </div>

      {/* Main Analysis Output Panel */}
      <div className="p-8 xl:p-12 bg-white flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#f0f5ff] border border-[#bfdbfe] flex items-center justify-center">
                <Icon className="w-6 h-6 text-[#1d4ed8]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#f1f5f9] text-[#475569]">
                    STAGE {stage.id} OF 07
                  </span>
                  <span className="text-xs font-mono text-[#9ca3af]">{stage.tagline}</span>
                </div>
                <h3 className="text-xl font-extrabold text-[#111827] mt-1">{stage.name}</h3>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-mono text-[#9ca3af]">ANALYSIS MODE</div>
              <div className="text-xs font-bold text-[#1d4ed8] font-mono">LIVE AI EXECUTION</div>
            </div>
          </div>

          {/* Body content */}
          <div className="space-y-8">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-2 font-mono">STAGE OBJECTIVE</h4>
              <p className="text-base text-[#374151] leading-relaxed max-w-2xl">{stage.summary}</p>
            </div>

            {/* Checks list */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] mb-4 font-mono">AUTOMATED CHECKS & VERIFICATIONS</h4>
              <div className="grid md:grid-cols-3 gap-4">
                {stage.checks.map((check, i) => (
                  <div key={i} className="p-4 rounded-xl border border-[#e5e7eb] bg-[#f8fafc]">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${
                        check.status === "PASS" ? "bg-[#f0fdf4] text-[#15803d]" :
                        check.status === "EXEMPT" ? "bg-[#eff6ff] text-[#1d4ed8]" :
                        "bg-[#fffbeb] text-[#b45309]"
                      }`}>
                        {check.status}
                      </span>
                      <span className="text-[9px] font-mono text-[#9ca3af]">RULE #{i+1}</span>
                    </div>
                    <p className="text-xs font-semibold text-[#111827]">{check.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="pt-8 mt-8 border-t border-[#f1f5f9] flex flex-wrap items-center justify-between text-xs text-[#6b7280] gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Layer output verified by GFR 2017 & Procurement Rules</span>
          </div>
          <span className="font-mono text-[#9ca3af]">TenderOS Core Engine &middot; Real-time AI Pipeline</span>
        </div>
      </div>
    </div>
  );
}
