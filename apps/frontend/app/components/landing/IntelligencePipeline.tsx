"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

const STAGES = [
  {
    id: "01",
    name: "RAW NIT INGESTION",
    tagline: "Document Layout Parsing",
    objective: "Automated OCR and document hierarchy parsing for multi-page NIT tender notices across scanned and digital PDFs.",
    checks: [
      { label: "OCR & Document Hierarchy Extraction", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
      { label: "BOQ Schedule Identification", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
      { label: "Corrigendum & Addendum Linking", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
    ],
  },
  {
    id: "02",
    name: "CLAUSE EXTRACTION",
    tagline: "NLP Clause Classification",
    objective: "Deep NLP scanning identifies technical specifications, financial eligibility criteria, and legal conditions from notices.",
    checks: [
      { label: "Turnover & Net Worth Criteria", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
      { label: "EMD & Security Deposit Clause", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
      { label: "Delivery Timeline & Penalty Terms", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
    ],
  },
  {
    id: "03",
    name: "SEMANTIC UNDERSTANDING",
    tagline: "Taxonomy & Domain Mapping",
    objective: "Vector embeddings map complex technical requirements to standard CPV and GeM procurement classifications.",
    checks: [
      { label: "CPV / GeM Category Mapping", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
      { label: "Scope of Work Entity Parsing", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
      { label: "OEM Authorization Rules", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
    ],
  },
  {
    id: "04",
    name: "ELIGIBILITY MATCHING",
    tagline: "Digital Twin Verification",
    objective: "Automated cross-referencing of tender requirements against your company's credentials, certificates, and financials.",
    checks: [
      { label: "Turnover Compliance Verification", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
      { label: "Prior Work Experience Validation", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
      { label: "Udyam MSME Exemption Check", status: "EXEMPT", badge: "bg-[#F1F5F9] text-[#1F5A96] border border-[#D9E1E8]" },
      { label: "ISO 27001 Certification", status: "WARNING", badge: "bg-[#FFF7E6] text-[#A16207] border border-[#FDE68A]" },
    ],
  },
  {
    id: "05",
    name: "RISK ANALYSIS",
    tagline: "Contractual & SLA Risk Scan",
    objective: "Flags onerous liquid damages clauses, tight SLA timelines, or restrictive qualification criteria.",
    checks: [
      { label: "Arbitration & Jurisdiction Review", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
      { label: "Payment Milestone Vulnerability", status: "WARNING", badge: "bg-[#FFF7E6] text-[#A16207] border border-[#FDE68A]" },
      { label: "Price Escalation Clause Scan", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
    ],
  },
  {
    id: "06",
    name: "MARKET INTELLIGENCE",
    tagline: "Historical Price Discovery",
    objective: "Analyzes 5 years of historical L1 prices, buyer tendering patterns, and competitor win rates.",
    checks: [
      { label: "Historical L1 Price Discovery", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
      { label: "Competitor Density Index", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
      { label: "Buyer Payment Timeliness Rating", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
    ],
  },
  {
    id: "07",
    name: "BID DECISION ENGINE",
    tagline: "Final Recommendation",
    objective: "Generates final strategic decision report with probability score, pricing recommendations, and proposal outline.",
    checks: [
      { label: "QCBS Score Optimization", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
      { label: "Win Probability Assessment", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
      { label: "Automated Draft Proposal Outline", status: "PASS", badge: "bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0]" },
    ],
  },
];

export default function IntelligencePipeline() {
  const [activeStage, setActiveStage] = useState(3);
  const stage = STAGES[activeStage];

  return (
    <div className="bg-white border border-[#D9E1E8] rounded p-6 shadow-2xs flex flex-col justify-between min-w-0" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-extrabold text-[#0B1F33]">AI Processing Pipeline</h3>
          <p className="text-xs text-[#475569] mt-0.5">7-stage AI pipeline that processes every tender opportunity</p>
        </div>

        <div className="grid md:grid-cols-[210px_1fr] gap-6 min-w-0">
          {/* Left Vertical Selector */}
          <div className="space-y-1.5 pr-3 border-r border-[#D9E1E8] hidden md:block">
            {STAGES.map((s, idx) => {
              const isActive = idx === activeStage;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStage(idx)}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded transition-all text-left ${
                    isActive
                      ? "bg-[#12355B] text-white font-bold"
                      : "hover:bg-[#F1F5F9] text-[#475569]"
                  }`}
                >
                  <span className={`text-[11px] font-mono font-bold w-5 text-center flex-shrink-0 ${isActive ? "text-white" : "text-[#64748B]"}`}>
                    {s.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[11px] font-bold truncate ${isActive ? "text-white" : "text-[#0B1F33]"}`}>
                      {s.name}
                    </div>
                    <div className={`text-[9px] truncate ${isActive ? "text-[#E2E8F0]" : "text-[#64748B]"}`}>
                      {s.tagline}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Active Stage Panel */}
          <div className="flex flex-col justify-between space-y-4 min-w-0">
            <div>
              <div className="pb-3 mb-3 border-b border-[#D9E1E8]">
                <div className="text-[10px] font-mono text-[#64748B] font-bold">STAGE {stage.id} OF 07</div>
                <h4 className="text-xs font-extrabold text-[#0B1F33] mt-0.5">{stage.name}</h4>
              </div>

              <div className="mb-4">
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#64748B] mb-1">STAGE OBJECTIVE</div>
                <p className="text-[11px] text-[#475569] leading-relaxed">{stage.objective}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">AUTOMATED CHECKS &amp; VERIFICATIONS</div>
                {stage.checks.map((chk, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2.5 rounded border border-[#D9E1E8] bg-[#F7F9FC] text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {chk.status === "WARNING" ? (
                        <AlertCircle className="w-3.5 h-3.5 text-[#A16207] flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#18794E] flex-shrink-0" />
                      )}
                      <span className="font-medium text-[#0B1F33] truncate">{chk.label}</span>
                    </div>
                    <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded flex-shrink-0 whitespace-nowrap ${chk.badge}`}>
                      {chk.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-1">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-semibold text-[#475569]">Pipeline Progress</span>
                  <span className="font-mono text-[#64748B]">4 of 7 complete &middot; <strong className="text-[#0B1F33]">57%</strong></span>
                </div>
                <div className="w-full h-1.5 bg-[#E2E8F0] rounded overflow-hidden">
                  <div className="h-full bg-[#12355B] rounded" style={{ width: "57%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
