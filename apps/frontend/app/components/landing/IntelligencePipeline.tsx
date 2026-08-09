"use client";
import { useState } from "react";

const STAGES = [
  {
    id: 0, num: "01", label: "RAW NIT RECEIVED", sub: "Government tender document",
    artifact: {
      title: "Notice Inviting Tender", ref: "CPPP/MF/2026/NIT-04812",
      lines: [
        { label: "Document type", value: "NIT · PDF · 42 pages" },
        { label: "Language", value: "English / Hindi" },
        { label: "Source portal", value: "Central Public Procurement Portal" },
        { label: "Published", value: "09 Aug 2026, 00:14 IST" },
        { label: "Status", value: "Received — queued for extraction" },
      ],
      meta: [
        { k: "Ministry", v: "Ministry of Finance" },
        { k: "Dept.", v: "Department of Revenue" },
        { k: "File size", v: "4.2 MB" },
        { k: "Hash", v: "SHA256:a3f9..." },
      ],
    },
  },
  {
    id: 1, num: "02", label: "AI EXTRACTION", sub: "847 clauses parsed across 42 pages",
    artifact: {
      title: "Extraction Report", ref: "EXT-04812-A",
      lines: [
        { label: "Clauses extracted", value: "847" },
        { label: "Tables parsed", value: "14" },
        { label: "Annexures", value: "6" },
        { label: "Confidence", value: "98.4%" },
        { label: "Processing time", value: "1.8 seconds" },
      ],
      meta: [
        { k: "Model", v: "TenderOS-NER v3.2" },
        { k: "Language", v: "Hindi + English" },
        { k: "Pages", v: "42" },
        { k: "Tokens", v: "82,440" },
      ],
    },
  },
  {
    id: 2, num: "03", label: "UNDERSTANDING", sub: "Mapped to procurement ontology",
    artifact: {
      title: "Ontology Mapping", ref: "ONT-04812-B",
      lines: [
        { label: "Category", value: "IT · AI/ML · Data Analytics" },
        { label: "Procurement type", value: "Works & Services" },
        { label: "Funding", value: "Central Government (Finance)" },
        { label: "Bid type", value: "Single-stage two-envelope" },
        { label: "Evaluation", value: "QCBS (70:30)" },
      ],
      meta: [
        { k: "NIC Code", v: "6202" },
        { k: "GFR Rule", v: "173(i)" },
        { k: "Category", v: "IT Services" },
        { k: "Portal", v: "CPPP" },
      ],
    },
  },
  {
    id: 3, num: "04", label: "ELIGIBILITY CHECK", sub: "Cross-referenced against your profile",
    artifact: {
      title: "Eligibility Matrix", ref: "ELG-04812-C",
      lines: [
        { label: "Turnover criterion", value: "PASS — ₹72.4 Cr vs ₹50 Cr req." },
        { label: "Experience criterion", value: "PASS — 8.2 yr vs 5 yr req." },
        { label: "EMD requirement", value: "EXEMPT — Udyam Rule 170" },
        { label: "Make in India", value: "PASS — Class-I Local Supplier" },
        { label: "Overall eligibility", value: "ELIGIBLE — 94% match score" },
      ],
      meta: [
        { k: "Match score", v: "94 / 100" },
        { k: "EMD", v: "WAIVED" },
        { k: "MII class", v: "Class-I" },
        { k: "MSME benefit", v: "15% price preference" },
      ],
    },
  },
  {
    id: 4, num: "05", label: "RISK ANALYSIS", sub: "3 risks identified",
    artifact: {
      title: "Risk Register", ref: "RSK-04812-D",
      lines: [
        { label: "ISO 27001", value: "HIGH — Not in current profile" },
        { label: "Deadline risk", value: "MED — 19 days remaining" },
        { label: "Locality clause", value: "LOW — Office presence required" },
        { label: "Performance bond", value: "LOW — PBG 10% of contract value" },
        { label: "Overall risk", value: "MEDIUM — manageable with action" },
      ],
      meta: [
        { k: "Critical risks", v: "1 (ISO 27001)" },
        { k: "PBG value", v: "~₹4.28 Cr" },
        { k: "Days left", v: "19" },
        { k: "Action items", v: "3 outstanding" },
      ],
    },
  },
  {
    id: 5, num: "06", label: "MARKET INTELLIGENCE", sub: "L1 price discovery & competitor data",
    artifact: {
      title: "Market Analysis", ref: "MKT-04812-E",
      lines: [
        { label: "Avg. L1 discount", value: "14.2% below estimate" },
        { label: "Estimated L1 price", value: "₹36.7 Cr" },
        { label: "Known competitors", value: "TCS, Wipro, Infosys (GOI)" },
        { label: "Ministry win history", value: "2 wins in MoF (2023–25)" },
        { label: "Bid cycle pattern", value: "Typically Aug–Sep each year" },
      ],
      meta: [
        { k: "Data points", v: "284 similar tenders" },
        { k: "Period", v: "FY 2021–2026" },
        { k: "L1 range", v: "₹34.2 – 38.8 Cr" },
        { k: "Win rate (GoI)", v: "34% in IT services" },
      ],
    },
  },
  {
    id: 6, num: "07", label: "BID DECISION", sub: "81% win probability · Recommend BID",
    artifact: {
      title: "Bid Recommendation", ref: "DEC-04812-F",
      lines: [
        { label: "Match score", value: "94 / 100" },
        { label: "Win probability", value: "81%" },
        { label: "Estimated bid price", value: "₹36.2 – 38.8 Cr" },
        { label: "Preparation time", value: "4 hours" },
        { label: "Final decision", value: "BID — High confidence" },
      ],
      meta: [
        { k: "Decision", v: "BID" },
        { k: "Confidence", v: "HIGH" },
        { k: "Risk level", v: "MEDIUM" },
        { k: "Deadline", v: "28 Aug 2026" },
      ],
    },
  },
];

function valueColor(v: string) {
  if (v.startsWith("PASS") || v.startsWith("ELIGIBLE")) return "text-[#15803d]";
  if (v.startsWith("EXEMPT") || v.startsWith("BID")) return "text-[#1d4ed8]";
  if (v.startsWith("HIGH")) return "text-[#b91c1c]";
  if (v.startsWith("MED")) return "text-[#b45309]";
  if (v.startsWith("LOW")) return "text-[#15803d]";
  return "text-[#374151]";
}

export default function IntelligencePipeline() {
  const [active, setActive] = useState(3);
  const stage = STAGES[active];

  return (
    <div className="flex min-h-[600px]">
      {/* ── Left: stage navigation list ─────────────────────────── */}
      <div className="w-[300px] flex-shrink-0 border-r border-[#e5e7eb] bg-white">
        <div className="relative py-3">
          {/* Vertical connector line */}
          <div className="absolute left-[36px] top-[40px] bottom-[40px] w-px bg-[#e5e7eb]" />
          {STAGES.map((s) => (
            <div
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`pipeline-stage flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                active === s.id
                  ? "active bg-[#f0f5ff] border-r-2 border-[#1d4ed8]"
                  : "hover:bg-[#f9fafb]"
              }`}
            >
              <span className={`stage-num w-8 h-8 rounded-full border text-[11px] font-bold flex items-center justify-center flex-shrink-0 font-mono z-10 transition-all ${
                active === s.id
                  ? "bg-[#1d4ed8] text-white border-[#1d4ed8]"
                  : s.id < active
                  ? "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]"
                  : "bg-white text-[#9ca3af] border-[#e5e7eb]"
              }`}>{s.num}</span>
              <div className="min-w-0 flex-1">
                <div className={`stage-label text-xs font-bold tracking-wide transition-all ${
                  active === s.id ? "text-[#1d4ed8]" : "text-[#374151]"
                }`}>{s.label}</div>
                <div className="text-[10px] text-[#9ca3af] leading-snug mt-0.5">{s.sub}</div>
              </div>
              {s.id < active && <span className="text-[#15803d] text-xs flex-shrink-0 font-bold">✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: active stage artifact ─────────────────────────── */}
      <div className="flex-1 bg-[#f8fafc] p-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-[#9ca3af] mb-1">
              TenderOS AI Pipeline · Stage {active + 1} of {STAGES.length}
            </div>
            <h3 className="text-xl font-bold text-[#111827]">{stage.artifact.title}</h3>
            <p className="text-sm text-[#6b7280] mt-1">
              {stage.label.charAt(0) + stage.label.slice(1).toLowerCase()} — {stage.sub}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono text-[#c5cdd8]">{stage.artifact.ref}</div>
            <div className="text-[10px] font-mono text-[#c5cdd8] mt-0.5">09 Aug 2026 · 04:14 IST</div>
          </div>
        </div>

        {/* Main content: two-column */}
        <div className="grid grid-cols-2 gap-5 flex-1">
          {/* Left: eligibility lines */}
          <div className="dossier rounded-xl h-full">
            <div className="px-5 py-3 border-b border-[#e5e7eb] bg-[#f8fafc]">
              <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#9ca3af]">Analysis Output</div>
            </div>
            <div className="px-5 py-5 space-y-4">
              {stage.artifact.lines.map((l) => (
                <div key={l.label} className="flex items-start justify-between gap-6">
                  <span className="text-sm text-[#6b7280] flex-shrink-0">{l.label}</span>
                  <span className={`text-sm font-semibold text-right ${valueColor(l.value)}`}>{l.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: metadata + progress */}
          <div className="flex flex-col gap-5">
            {/* Metadata card */}
            <div className="dossier rounded-xl">
              <div className="px-5 py-3 border-b border-[#e5e7eb] bg-[#f8fafc]">
                <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#9ca3af]">Stage Parameters</div>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-3">
                {stage.artifact.meta.map((m) => (
                  <div key={m.k}>
                    <div className="text-[9px] font-bold uppercase tracking-wide text-[#9ca3af]">{m.k}</div>
                    <div className="text-sm font-semibold text-[#111827] mt-0.5">{m.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline progress */}
            <div className="dossier rounded-xl flex-1">
              <div className="px-5 py-3 border-b border-[#e5e7eb] bg-[#f8fafc]">
                <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#9ca3af]">Pipeline Progress</div>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[#6b7280]">{active + 1} of {STAGES.length} stages complete</span>
                  <span className="text-xs font-bold text-[#1d4ed8]">{Math.round(((active + 1) / STAGES.length) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1d4ed8] rounded-full transition-all duration-500"
                    style={{ width: `${((active + 1) / STAGES.length) * 100}%` }}
                  />
                </div>
                <div className="mt-5 space-y-2">
                  {STAGES.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        s.id < active ? "bg-[#15803d]" : s.id === active ? "bg-[#1d4ed8]" : "bg-[#e5e7eb]"
                      }`} />
                      <span className={`text-[10px] ${
                        s.id === active ? "font-bold text-[#1d4ed8]" :
                        s.id < active ? "text-[#15803d]" : "text-[#9ca3af]"
                      }`}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#e5e7eb]">
          <div className="text-[10px] font-mono text-[#c5cdd8]">
            NIT CPPP/MF/2026/NIT-04812 · TenderOS AI Processing Pipeline · Layer {active + 1}
          </div>
          <div className="flex items-center gap-2">
            {active > 0 && (
              <button onClick={() => setActive(active - 1)}
                className="text-xs text-[#374151] border border-[#e5e7eb] px-3 py-1 rounded-md hover:border-[#1d4ed8] hover:text-[#1d4ed8] transition-colors">
                ← Prev
              </button>
            )}
            {active < STAGES.length - 1 && (
              <button onClick={() => setActive(active + 1)}
                className="text-xs font-semibold text-white bg-[#1d4ed8] px-3 py-1 rounded-md hover:bg-[#1e40af] transition-colors">
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
