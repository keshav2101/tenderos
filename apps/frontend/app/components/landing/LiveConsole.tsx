"use client";

const FEED = [
  { time: "04:14:22", portal: "GeM", pid: "GEM/2026/B/84912", desc: "IT Services — Ministry of Electronics & IT", value: "₹18.4 Cr", dot: "#22c55e", status: "NEW" },
  { time: "04:08:51", portal: "CPPP", pid: "CPPP/2026/NIT-04812", desc: "Corrigendum No.2 — Financial Services NIT", value: "", dot: "#3b82f6", status: "CORRIG" },
  { time: "03:56:17", portal: "TN eProcure", pid: "TNRDC/2026/R-2241", desc: "Highway Package — Coimbatore-Salem Corridor", value: "₹124 Cr", dot: "#8b5cf6", status: "NEW" },
  { time: "03:42:09", portal: "IREPS", pid: "IREPS/NER/2026/00421", desc: "Track Inspection System — Northeast Railway Zone", value: "₹42.8 Cr", dot: "#f97316", status: "NEW" },
  { time: "03:19:44", portal: "Def Proc", pid: "MOD/DRDO/2026/UAV-019", desc: "Multi-Rotor UAV Systems — High Altitude Variant", value: "₹480 Cr", dot: "#ef4444", status: "SECURE" },
  { time: "03:05:33", portal: "GeM", pid: "GEM/2026/B/84891", desc: "Medical Diagnostic Equipment — AIIMS New Delhi", value: "₹8.2 Cr", dot: "#22c55e", status: "NEW" },
  { time: "02:48:19", portal: "ONGC", pid: "ONGC/WO/2026/04281", desc: "Offshore Maintenance Services — Mumbai High", value: "₹210 Cr", dot: "#64748b", status: "NEW" },
  { time: "02:33:06", portal: "MahaGov", pid: "PMC/2026/SC-0281", desc: "Smart Infrastructure — Pune Municipal Corp.", value: "₹62 Cr", dot: "#0ea5e9", status: "NEW" },
  { time: "02:11:52", portal: "BHEL", pid: "BHEL/HW/2026/T-1820", desc: "Turbine Blade Components — Haridwar Plant", value: "₹38.5 Cr", dot: "#64748b", status: "NEW" },
  { time: "01:55:37", portal: "Karnataka", pid: "BWSSB/2026/WS-4421", desc: "Water Supply Pipeline — North Bengaluru Phase 2", value: "₹94 Cr", dot: "#10b981", status: "NEW" },
  { time: "01:39:14", portal: "NTPC", pid: "NTPC/2026/EPC-0921", desc: "Solar Power Plant EPC — Rajasthan Zone", value: "₹840 Cr", dot: "#64748b", status: "HIGH" },
  { time: "01:22:08", portal: "CPPP", pid: "MoH/2026/AIIMS-0441", desc: "Hospital Management System — AIIMS Jodhpur", value: "₹12.6 Cr", dot: "#3b82f6", status: "NEW" },
];

type StatusKey = "NEW" | "CORRIG" | "SECURE" | "HIGH";

const STATUS_STYLE: Record<StatusKey, string> = {
  NEW:    "bg-[#0d2a16] text-[#4ade80]",
  CORRIG: "bg-[#0d1a2e] text-[#60a5fa]",
  SECURE: "bg-[#2a0d0d] text-[#f87171]",
  HIGH:   "bg-[#2a1a0d] text-[#fb923c]",
};

interface FeedEntry {
  time: string;
  portal: string;
  pid: string;
  desc: string;
  value: string;
  dot: string;
  status: string;
}

function ConsoleRow({ entry }: { entry: FeedEntry }) {
  const statusStyle = STATUS_STYLE[entry.status as StatusKey] ?? STATUS_STYLE.NEW;
  return (
    <div className="flex items-start gap-4 px-6 py-2.5 border-b border-[#1a2540] hover:bg-[#131c30] transition-colors group">
      <span className="font-mono text-[10px] text-[#475569] flex-shrink-0 mt-0.5 w-16">{entry.time}</span>
      <div className="flex items-center gap-1.5 w-28 flex-shrink-0 mt-0.5">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.dot }} />
        <span className="text-[11px] font-bold text-[#e2e8f0] truncate">{entry.portal}</span>
      </div>
      <span className="font-mono text-[10px] text-[#334155] flex-shrink-0 w-36 mt-0.5 truncate">{entry.pid}</span>
      <span className="text-[11px] text-[#94a3b8] flex-1 min-w-0 group-hover:text-[#e2e8f0] transition-colors truncate">{entry.desc}</span>
      {entry.value && (
        <span className="font-mono text-[11px] text-[#60a5fa] flex-shrink-0 w-20 text-right">{entry.value}</span>
      )}
      <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${statusStyle}`}>
        {entry.status}
      </span>
    </div>
  );
}

export default function LiveConsole() {
  const doubled = [...FEED, ...FEED];
  return (
    <div className="bg-[#0a0f1e] border border-[#1e293b] rounded-xl overflow-hidden">
      {/* Console header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1e293b] bg-[#0f172a]">
        <div className="flex items-center gap-3">
          <span className="live-dot w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#475569] font-mono">
            Procurement Intelligence Console
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-[#334155]">
          <span>36 portals active</span>
          <span className="text-[#1e293b]">·</span>
          <span>Sync: 4 min</span>
          <span className="text-[#1e293b]">·</span>
          <span className="text-emerald-500">LIVE</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-4 px-6 py-2 border-b border-[#1a2540] bg-[#0c1120]">
        {["TIME (IST)", "SOURCE", "REFERENCE", "TENDER DESCRIPTION", "VALUE", "STATUS"].map(h => (
          <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-[#334155] font-mono first:w-16 [&:nth-child(2)]:w-28 [&:nth-child(3)]:w-36 [&:nth-child(4)]:flex-1 [&:nth-child(5)]:w-20 [&:nth-child(5)]:text-right last:flex-shrink-0">
            {h}
          </span>
        ))}
      </div>

      {/* Scrolling entries */}
      <div className="h-72 overflow-hidden">
        <div className="console-track">
          {doubled.map((entry, i) => (
            <ConsoleRow key={i} entry={entry} />
          ))}
        </div>
      </div>

      {/* Console footer */}
      <div className="px-6 py-2.5 border-t border-[#1e293b] bg-[#0f172a] flex items-center justify-between">
        <span className="text-[10px] font-mono text-[#334155]">
          GeM · CPPP · IREPS · Def Proc · State Portals · PSUs · Autonomous Bodies
        </span>
        <span className="text-[10px] font-mono text-[#22c55e]">
          ● {FEED.length} tenders indexed tonight
        </span>
      </div>
    </div>
  );
}
