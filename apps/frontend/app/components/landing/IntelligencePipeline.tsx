"use client";
import { useState } from "react";

const STAGES = [
  {
    id: 0,
    num: "01",
    label: "RAW NIT RECEIVED",
    sub: "Government tender document",
    artifact: {
      title: "Notice Inviting Tender",
      ref: "CPPP/MF/2026/NIT-04812",
      lines: [
        { label: "Document type", value: "NIT · PDF · 42 pages" },
        { label: "Language", value: "English / Hindi" },
        { label: "Source portal", value: "Central Public Procurement Portal" },
        { label: "Published", value: "09 Aug 2026, 00:14 IST" },
        { label: "Status", value: "Received — queued for extraction" },
      ],
    },
  },
  {
    id: 1,
    num: "02",
    label: "AI EXTRACTION",
    sub: "847 clauses parsed across 42 pages",
    artifact: {
      title: "Extraction Report",
      ref: "EXT-04812-A",
      lines: [
        { label: "Clauses extracted", value: "847" },
        { label: "Tables parsed", value: "14" },
        { label: "Annexures", value: "6" },
        { label: "Confidence", value: "98.4%" },
        { label: "Processing time", value: "1.8 seconds" },
      ],
    },
  },
  {
    id: 2,
    num: "03",
    label: "UNDERSTANDING",
    sub: "Mapped to procurement ontology",
    artifact: {
      title: "Ontology Mapping",
      ref: "ONT-04812-B",
      lines: [
        { label: "Category", value: "IT · AI/ML · Data Analytics" },
        { label: "Procurement type", value: "Works & Services" },
        { label: "Funding", value: "Central Government (Finance)" },
        { label: "Bid type", value: "Single-stage two-envelope" },
        { label: "Evaluation", value: "QCBS (70:30)" },
      ],
    },
  },
  {
    id: 3,
    num: "04",
    label: "ELIGIBILITY CHECK",
    sub: "Cross-referenced against your profile",
    artifact: {
      title: "Eligibility Matrix",
      ref: "ELG-04812-C",
      lines: [
        { label: "Turnover criterion", value: "PASS — ₹72.4 Cr vs ₹50 Cr req." },
        { label: "Experience criterion", value: "PASS — 8.2 yr vs 5 yr req." },
        { label: "EMD requirement", value: "EXEMPT — Udyam Rule 170" },
        { label: "Make in India", value: "PASS — Class-I Local Supplier" },
        { label: "Overall eligibility", value: "ELIGIBLE — 94% match score" },
      ],
    },
  },
  {
    id: 4,
    num: "05",
    label: "RISK ANALYSIS",
    sub: "3 risks identified",
    artifact: {
      title: "Risk Register",
      ref: "RSK-04812-D",
      lines: [
        { label: "ISO 27001", value: "HIGH — Not in current profile" },
        { label: "Deadline risk", value: "MED — 19 days remaining" },
        { label: "Locality clause", value: "LOW — Office presence required" },
        { label: "Performance bond", value: "LOW — PBG 10% of contract value" },
        { label: "Overall risk", value: "MEDIUM — manageable with action" },
      ],
    },
  },
  {
    id: 5,
    num: "06",
    label: "MARKET INTELLIGENCE",
    sub: "L1 price discovery & competitor data",
    artifact: {
      title: "Market Analysis",
      ref: "MKT-04812-E",
      lines: [
        { label: "Avg. L1 discount", value: "14.2% below estimate" },
        { label: "Estimated L1 price", value: "₹36.7 Cr" },
        { label: "Known competitors", value: "TCS, Wipro, Infosys (GOI)" },
        { label: "Ministry win history", value: "2 wins in MoF (2023–25)" },
        { label: "Bid cycle pattern", value: "Typically Aug–Sep each year" },
      ],
    },
  },
  {
    id: 6,
    num: "07",
    label: "BID DECISION",
    sub: "81% win probability · Recommend BID",
    artifact: {
      title: "Bid Recommendation",
      ref: "DEC-04812-F",
      lines: [
        { label: "Match score", value: "94 / 100" },
        { label: "Win probability", value: "81%" },
        { label: "Estimated bid price", value: "₹36.2 – 38.8 Cr" },
        { label: "Preparation time", value: "4 hours" },
        { label: "Final decision", value: "BID — High confidence" },
      ],
    },
  },
];

export default function IntelligencePipeline() {
  const [active, setActive] = useState(3);
  const stage = STAGES[active];

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-0 min-h-[480px]">
      {/* Left: stage list */}
      <div className="border-r border-[#e5e7eb] pr-0">
        <div className="relative">
          {/* Vertical connector */}
          <div className="absolute left-[27px] top-[28px] bottom-[28px] w-px bg-[#e5e7eb]" />

          <div className="space-y-1 py-2">
            {STAGES.map((s) => (
              <div
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`pipeline-stage flex items-center gap-3 px-5 py-2.5 rounded-none group ${active === s.id ? "active bg-[#f0f5ff]" : "hover:bg-[#f9fafb]"}`}
              >
                <span className={`stage-num w-7 h-7 rounded-full border text-[10px] font-bold flex items-center justify-center flex-shrink-0 font-mono z-10 transition-all ${
                  active === s.id
                    ? "bg-[#1d4ed8] text-white border-[#1d4ed8]"
                    : s.id < active
                    ? "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]"
                    : "bg-white text-[#9ca3af] border-[#e5e7eb]"
                }`}>{s.num}</span>
                <div className="min-w-0">
                  <div className={`stage-label text-[11px] font-bold tracking-wide truncate transition-all ${
                    active === s.id ? "text-[#1d4ed8]" : "text-[#374151]"
                  }`}>{s.label}</div>
                  <div className="text-[10px] text-[#9ca3af] truncate">{s.sub}</div>
                </div>
                {s.id < active && (
                  <span className="ml-auto text-[#15803d] text-xs flex-shrink-0">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: stage artifact */}
      <div className="p-8 bg-[#f8fafc]">
        <div className="dossier rounded-xl max-w-md">
          <div className="px-5 py-3 border-b border-[#e5e7eb] bg-[#f8fafc] flex items-start justify-between">
            <div>
              <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#9ca3af]">
                TenderOS · Layer {active + 1}
              </div>
              <div className="text-xs font-bold text-[#111827] mt-0.5">{stage.artifact.title}</div>
            </div>
            <span className="text-[9px] font-mono text-[#c5cdd8]">{stage.artifact.ref}</span>
          </div>
          <div className="px-5 py-4 space-y-2.5">
            {stage.artifact.lines.map((l) => (
              <div key={l.label} className="flex items-start justify-between gap-4">
                <span className="text-[10px] text-[#6b7280] flex-shrink-0">{l.label}</span>
                <span className={`text-[10px] font-semibold text-right ${
                  l.value.startsWith("PASS") ? "text-[#15803d]" :
                  l.value.startsWith("EXEMPT") ? "text-[#1d4ed8]" :
                  l.value.startsWith("HIGH") ? "text-[#b91c1c]" :
                  l.value.startsWith("MED") ? "text-[#b45309]" :
                  l.value.startsWith("LOW") ? "text-[#15803d]" :
                  l.value.startsWith("BID") ? "text-[#1d4ed8] font-bold" :
                  l.value.startsWith("ELIGIBLE") ? "text-[#15803d]" :
                  "text-[#374151]"
                }`}>{l.value}</span>
              </div>
            ))}
          </div>
          <div className="px-5 pb-3 border-t border-[#f3f4f6] pt-2">
            <div className="text-[9px] font-mono text-[#c5cdd8]">
              Stage {active + 1} of {STAGES.length} · TenderOS AI Processing Pipeline
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
