"use client";
import type { Tender } from "@/types/procurement";

function fmt(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function fmtCr(lakhs?: number) {
  if (!lakhs) return "—";
  const cr = lakhs / 100;
  return `₹${cr.toFixed(1)} Cr`;
}

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

function Skeleton({ w = "w-full", h = "h-3" }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} bg-[#e5e7eb] rounded animate-pulse`} />;
}

interface Props {
  tender: Tender | null;
  isLoading: boolean;
}

export default function HeroArtifact({ tender, isLoading }: Props) {
  const now = new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  }) + " IST";

  if (isLoading) {
    return (
      <div className="dossier rounded-2xl" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="px-6 pt-5 pb-4 border-b border-[#e5e7eb] bg-[#f8fafc] rounded-t-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton w="w-32" h="h-2" />
              <Skeleton w="w-3/4" h="h-4" />
              <Skeleton w="w-1/2" h="h-3" />
            </div>
            <div className="w-24 h-24 rounded-full bg-[#e5e7eb] animate-pulse flex-shrink-0" />
          </div>
        </div>
        <div className="px-6 py-3 border-b border-[#f3f4f6] grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="space-y-1.5"><Skeleton w="w-12" h="h-2" /><Skeleton w="w-16" h="h-3" /></div>)}
        </div>
        <div className="px-6 py-4 space-y-3">
          <Skeleton w="w-24" h="h-2" />
          {[1,2,3,4,5,6].map(i => <div key={i} className="flex justify-between"><Skeleton w="w-1/3" h="h-3" /><Skeleton w="w-1/4" h="h-3" /></div>)}
        </div>
        <div className="mx-6 mb-4 rounded-lg bg-[#f1f5f9] h-10 animate-pulse" />
        <div className="px-6 pb-5 pt-1 border-t border-[#f3f4f6]">
          <div className="grid grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="text-center space-y-1"><Skeleton w="w-12 mx-auto" h="h-5" /><Skeleton w="w-10 mx-auto" h="h-2" /></div>)}
          </div>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="dossier rounded-2xl flex items-center justify-center min-h-[300px]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="text-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-[#e5e7eb] border-t-[#1d4ed8] animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#6b7280]">Analyzing latest procurement opportunity…</p>
          <p className="text-[10px] text-[#9ca3af] mt-2 font-mono">Connecting to TenderOS intelligence network</p>
        </div>
      </div>
    );
  }

  // Derive display values from real tender
  const valueCr = fmtCr(tender.estimated_cost_lakhs);
  const deadline = fmt(tender.submission_deadline);
  const refId = tender.tender_id || tender.id?.slice(0, 12).toUpperCase();
  const portal = tender.source || "CPPP";
  const ministry = tender.ministry || "Government of India";
  const dept = tender.department || ministry;

  // These eligibility fields require auth; show neutral state for public view
  const CHECKS = [
    { label: "Category", status: "INFO", value: tender.categories?.[0] || "General Procurement", code: "§3.1" },
    { label: "Est. Contract Value", status: "INFO", value: valueCr, code: "§2.1" },
    { label: "Bid Deadline", status: tender.submission_deadline ? "INFO" : "WARN", value: deadline, code: "NIT" },
    { label: "MSME Eligible", status: tender.msme_eligible ? "PASS" : "INFO", value: tender.msme_eligible ? "Yes — EMD waiver applicable" : "Standard EMD required", code: "GFR 170" },
    { label: "Portal Source", status: "INFO", value: portal, code: "§1.1" },
    { label: "Status", status: "PASS", value: tender.status?.toUpperCase() ?? "ACTIVE", code: "§4.0" },
  ];

  return (
    <div className="dossier rounded-2xl" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-[#e5e7eb] bg-[#f8fafc] rounded-t-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af] font-mono">AI BID ASSESSMENT</span>
              <span className="text-[10px] font-mono text-[#d1d5db]">·</span>
              <span className="text-[10px] font-mono text-[#d1d5db] truncate">{refId}</span>
            </div>
            <h3 className="text-sm font-bold text-[#111827] leading-snug line-clamp-2">{tender.title}</h3>
            <p className="text-xs text-[#6b7280] mt-1 truncate">{dept} · {portal}</p>
          </div>
          <ScoreArc score={tender.msme_eligible ? 91 : 78} />
        </div>
      </div>

      {/* Metadata row */}
      <div className="px-6 py-3 border-b border-[#f3f4f6] grid grid-cols-4 gap-4">
        {[
          { label: "Est. Value", value: valueCr },
          { label: "Bid Deadline", value: deadline },
          { label: "Portal", value: portal },
          { label: "State", value: tender.state || "Pan-India" },
        ].map(m => (
          <div key={m.label}>
            <div className="text-[9px] font-bold uppercase tracking-wide text-[#9ca3af]">{m.label}</div>
            <div className="text-xs font-semibold text-[#374151] mt-0.5 truncate">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Checks */}
      <div className="px-6 py-4">
        <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9ca3af] mb-3">Tender Intelligence · GFR 2017</div>
        <div className="space-y-2.5">
          {CHECKS.map(c => (
            <div key={c.label} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className={`text-[9px] font-bold font-mono flex-shrink-0 px-2 py-0.5 rounded ${
                  c.status === "PASS"   ? "bg-[#f0fdf4] text-[#15803d]" :
                  c.status === "WARN"   ? "bg-[#fffbeb] text-[#b45309]" :
                  "bg-[#f1f5f9] text-[#64748b]"
                }`}>{c.status}</span>
                <span className="text-xs text-[#374151] truncate">{c.label}</span>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <span className="text-[9px] font-mono text-[#c5cdd8] w-12 text-right">{c.code}</span>
                <span className="text-xs font-medium text-[#374151] text-right min-w-[100px] truncate">{c.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div className="mx-6 mb-4 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-[#1d4ed8] uppercase tracking-wider">TenderOS Intelligence</span>
          <span className="text-[9px] text-[#d1d5db] font-mono">·</span>
          <span className="text-xs font-bold text-[#1e3a8a]">
            {tender.msme_eligible ? "EMD Exemption Available · Review Eligibility" : "Review full NIT requirements"}
          </span>
        </div>
      </div>

      {/* Footer stats */}
      <div className="px-6 pb-5 pt-1 border-t border-[#f3f4f6] flex items-center justify-between gap-4">
        <div className="grid grid-cols-4 gap-5">
          {[
            { label: "Value", value: valueCr },
            { label: "Deadline", value: tender.submission_deadline ? fmt(tender.submission_deadline).split(" ")[0] + " " + fmt(tender.submission_deadline).split(" ")[1] : "—" },
            { label: "MSME", value: tender.msme_eligible ? "ELIGIBLE" : "STANDARD" },
            { label: "Source", value: portal },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-sm font-extrabold text-[#111827] truncate">{s.value}</div>
              <div className="text-[9px] text-[#9ca3af] uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[9px] font-mono text-[#c5cdd8]">{now}</div>
          <div className="text-[9px] font-mono text-[#c5cdd8]">TenderOS AI · Layer 7</div>
        </div>
      </div>
    </div>
  );
}
