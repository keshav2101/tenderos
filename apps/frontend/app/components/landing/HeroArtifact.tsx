"use client";

const CHECKS = [
  { label: "Category Match", status: "PASS", value: "AI / Data Analytics", code: "§3.1" },
  { label: "Annual Turnover (₹50 Cr avg)", status: "PASS", value: "₹72.4 Cr — 3yr avg ✔", code: "§5.2" },
  { label: "Prior Experience (5 yrs min)", status: "PASS", value: "8.2 years ✔", code: "§5.3" },
  { label: "EMD (₹18.4 L)", status: "EXEMPT", value: "Udyam No. UP-32-0041882", code: "GFR 170" },
  { label: "ISO 27001 Certification", status: "WARN", value: "Not in profile ⚠ — obtain before submission", code: "§6.1" },
  { label: "Make in India Class", status: "PASS", value: "Class-I Local Supplier", code: "OM 2017" },
];

function ScoreArc({ score }: { score: number }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="5" stroke="#e5e7eb" />
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="5"
          stroke="#15803d" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.6s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold text-[#15803d] leading-none">{score}</span>
        <span className="text-[8px] text-[#9ca3af] font-semibold uppercase tracking-wide">Match</span>
      </div>
    </div>
  );
}

export default function HeroArtifact() {
  return (
    <div className="dossier rounded-xl" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Document Header */}
      <div className="px-5 pt-4 pb-3 border-b border-[#e5e7eb] bg-[#f8fafc]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9ca3af] font-mono">
                AI BID ASSESSMENT
              </span>
              <span className="text-[9px] font-mono text-[#c5cdd8]">·</span>
              <span className="text-[9px] font-mono text-[#c5cdd8]">REF/MF/2026/AID-04812</span>
            </div>
            <h3 className="text-xs font-bold text-[#111827] leading-snug max-w-[200px]">
              AI-based Fraud Detection System
            </h3>
            <p className="text-[10px] text-[#6b7280] mt-0.5">Ministry of Finance · Dept. of Revenue</p>
          </div>
          <ScoreArc score={94} />
        </div>
      </div>

      {/* Tender metadata row */}
      <div className="px-5 py-2.5 border-b border-[#f3f4f6] grid grid-cols-3 gap-3">
        {[
          { label: "Est. Value", value: "₹42.8 Cr" },
          { label: "Bid Deadline", value: "28 Aug 2026" },
          { label: "Portal", value: "CPPP / GeM" },
        ].map(m => (
          <div key={m.label}>
            <div className="text-[9px] font-bold uppercase tracking-wide text-[#9ca3af]">{m.label}</div>
            <div className="text-[10px] font-semibold text-[#374151] mt-0.5">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Compliance checks */}
      <div className="px-5 py-3">
        <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#9ca3af] mb-2">Eligibility Analysis</div>
        <div className="space-y-1.5">
          {CHECKS.map(c => (
            <div key={c.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[9px] font-bold font-mono flex-shrink-0 w-11 text-center py-0.5 rounded ${
                  c.status === "PASS"   ? "bg-[#f0fdf4] text-[#15803d]" :
                  c.status === "EXEMPT" ? "bg-[#eff6ff] text-[#1d4ed8]" :
                  "bg-[#fffbeb] text-[#b45309]"
                }`}>{c.status}</span>
                <span className="text-[10px] text-[#374151] truncate">{c.label}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[9px] font-mono text-[#c5cdd8]">{c.code}</span>
                <span className={`text-[10px] font-medium ${
                  c.status === "PASS"   ? "text-[#15803d]" :
                  c.status === "EXEMPT" ? "text-[#1d4ed8]" :
                  "text-[#b45309]"
                }`}>{c.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outcome strip */}
      <div className="mx-5 mb-3 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 flex items-center gap-2">
        <span className="text-[9px] font-bold text-[#15803d] uppercase tracking-wider">AI Recommendation</span>
        <span className="text-[9px] text-[#c5cdd8] font-mono">·</span>
        <span className="text-[10px] font-bold text-[#14532d]">BID — High confidence · Win probability 81%</span>
      </div>

      {/* Footer */}
      <div className="px-5 pb-3 pt-1 border-t border-[#f3f4f6] flex items-center justify-between">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Win Prob.", value: "81%" },
            { label: "Prep Time", value: "4 hrs" },
            { label: "EMD Status", value: "WAIVED" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-sm font-bold text-[#111827]">{s.value}</div>
              <div className="text-[9px] text-[#9ca3af] uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="text-right">
          <div className="text-[9px] font-mono text-[#c5cdd8]">Generated 09 Aug 2026 04:14 IST</div>
          <div className="text-[9px] font-mono text-[#c5cdd8]">TenderOS AI · Layer 6</div>
        </div>
      </div>
    </div>
  );
}
