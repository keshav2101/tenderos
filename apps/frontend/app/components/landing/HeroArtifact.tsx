"use client";

const CHECKS = [
  { label: "Category Match", status: "PASS", value: "AI / Data Analytics", code: "§3.1" },
  { label: "Annual Turnover (₹50 Cr avg)", status: "PASS", value: "₹72.4 Cr — 3yr avg ✔", code: "§5.2" },
  { label: "Prior Experience (5 yrs min)", status: "PASS", value: "8.2 years ✔", code: "§5.3" },
  { label: "EMD (₹18.4 L)", status: "EXEMPT", value: "Udyam No. UP-32-0041882", code: "GFR 170" },
  { label: "ISO 27001 Certification", status: "WARN", value: "Not in profile ⚠", code: "§6.1" },
  { label: "Make in India Class", status: "PASS", value: "Class-I Local Supplier", code: "OM 2017" },
];

function ScoreArc({ score }: { score: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="5" stroke="#e5e7eb" />
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="5"
          stroke="#15803d" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.8s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-[#15803d] leading-none">{score}</span>
        <span className="text-[9px] text-[#9ca3af] font-bold uppercase tracking-wider mt-0.5">Match</span>
      </div>
    </div>
  );
}

export default function HeroArtifact() {
  return (
    <div className="dossier rounded-2xl" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Document Header */}
      <div className="px-6 pt-5 pb-4 border-b border-[#e5e7eb] bg-[#f8fafc] rounded-t-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af] font-mono">
                AI BID ASSESSMENT
              </span>
              <span className="text-[10px] font-mono text-[#d1d5db]">·</span>
              <span className="text-[10px] font-mono text-[#d1d5db]">REF/MF/2026/AID-04812</span>
            </div>
            <h3 className="text-sm font-bold text-[#111827] leading-snug">
              AI-based Fraud Detection System — Government of India
            </h3>
            <p className="text-xs text-[#6b7280] mt-1">Ministry of Finance · Dept. of Revenue · CPPP</p>
          </div>
          <ScoreArc score={94} />
        </div>
      </div>

      {/* Tender metadata row */}
      <div className="px-6 py-3 border-b border-[#f3f4f6] grid grid-cols-4 gap-4">
        {[
          { label: "Est. Value", value: "₹42.8 Cr" },
          { label: "Bid Deadline", value: "28 Aug 2026" },
          { label: "Portal", value: "CPPP / GeM" },
          { label: "NIT No.", value: "04812/2026" },
        ].map(m => (
          <div key={m.label}>
            <div className="text-[9px] font-bold uppercase tracking-wide text-[#9ca3af]">{m.label}</div>
            <div className="text-xs font-semibold text-[#374151] mt-0.5">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Compliance checks */}
      <div className="px-6 py-4">
        <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9ca3af] mb-3">Eligibility Analysis · GFR 2017</div>
        <div className="space-y-2">
          {CHECKS.map(c => (
            <div key={c.label} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className={`text-[9px] font-bold font-mono flex-shrink-0 px-2 py-0.5 rounded ${
                  c.status === "PASS"   ? "bg-[#f0fdf4] text-[#15803d]" :
                  c.status === "EXEMPT" ? "bg-[#eff6ff] text-[#1d4ed8]" :
                  "bg-[#fffbeb] text-[#b45309]"
                }`}>{c.status}</span>
                <span className="text-xs text-[#374151] truncate">{c.label}</span>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <span className="text-[9px] font-mono text-[#c5cdd8] w-14 text-right">{c.code}</span>
                <span className={`text-xs font-medium text-right min-w-[120px] ${
                  c.status === "PASS"   ? "text-[#15803d]" :
                  c.status === "EXEMPT" ? "text-[#1d4ed8]" :
                  "text-[#b45309]"
                }`}>{c.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="mx-6 mb-4 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-[#15803d] uppercase tracking-wider">AI Recommendation</span>
          <span className="text-[9px] text-[#d1d5db] font-mono">·</span>
          <span className="text-xs font-bold text-[#14532d]">BID — High confidence</span>
        </div>
        <span className="text-xs font-bold text-[#15803d]">Win probability: 81%</span>
      </div>

      {/* Bottom stats */}
      <div className="px-6 pb-5 pt-1 border-t border-[#f3f4f6] flex items-center justify-between gap-4">
        <div className="grid grid-cols-4 gap-6">
          {[
            { label: "Win Prob.", value: "81%" },
            { label: "Prep Time", value: "4 hrs" },
            { label: "EMD", value: "WAIVED" },
            { label: "L1 Price", value: "₹36.7 Cr" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-base font-extrabold text-[#111827]">{s.value}</div>
              <div className="text-[9px] text-[#9ca3af] uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[9px] font-mono text-[#c5cdd8]">09 Aug 2026 · 04:14 IST</div>
          <div className="text-[9px] font-mono text-[#c5cdd8]">TenderOS AI · Layer 7</div>
        </div>
      </div>
    </div>
  );
}
