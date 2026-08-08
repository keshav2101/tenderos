"use client";

const ENTRIES = [
  { time: "04:14", portal: "GeM", msg: "New IT Services — Ministry of Electronics", value: "₹18.4 Cr", color: "#22c55e" },
  { time: "04:08", portal: "CPPP", msg: "Corrigendum issued — Deadline extended 7 days", value: "", color: "#3b82f6" },
  { time: "03:56", portal: "TN eProcure", msg: "Road Infrastructure — TNRDC Highways", value: "₹124 Cr", color: "#8b5cf6" },
  { time: "03:42", portal: "IREPS", msg: "Track Inspection System — Northeast Railway", value: "₹42.8 Cr", color: "#f97316" },
  { time: "03:19", portal: "Def Proc", msg: "UAV Systems — Ministry of Defence", value: "₹480 Cr", color: "#ef4444" },
  { time: "03:05", portal: "GeM", msg: "Medical Equipment — AIIMS New Delhi", value: "₹8.2 Cr", color: "#22c55e" },
  { time: "02:48", portal: "ONGC", msg: "Offshore Maintenance — Western Offshore", value: "₹210 Cr", color: "#64748b" },
  { time: "02:33", portal: "MahaGov", msg: "Smart City Infrastructure — Pune Municipal", value: "₹62 Cr", color: "#0ea5e9" },
  { time: "02:11", portal: "BHEL", msg: "Turbine Components — Haridwar Plant", value: "₹38.5 Cr", color: "#64748b" },
  { time: "01:55", portal: "Karnataka", msg: "Water Supply Pipeline — Bengaluru BWSSB", value: "₹94 Cr", color: "#10b981" },
];

interface Entry {
  time: string;
  portal: string;
  msg: string;
  value: string;
  color: string;
}

function TickerEntry({ entry }: { entry: Entry }) {
  return (
    <div className="flex items-center gap-5 px-8 flex-shrink-0 border-r border-[#1e293b]">
      <span className="font-mono text-[10px] text-[#475569] flex-shrink-0">{entry.time}</span>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
        <span className="text-[11px] font-bold text-[#e2e8f0] flex-shrink-0">{entry.portal}</span>
      </div>
      <span className="text-[11px] text-[#94a3b8] flex-shrink-0">{entry.msg}</span>
      {entry.value && (
        <span className="text-[11px] font-mono font-semibold text-[#60a5fa] flex-shrink-0">{entry.value}</span>
      )}
    </div>
  );
}

export default function ProcurementTicker() {
  const doubled = [...ENTRIES, ...ENTRIES];
  return (
    <div className="bg-[#0a0f1e] border-b border-[#1e293b] overflow-hidden">
      <div className="flex items-stretch">
        <div className="flex items-center gap-2 px-5 py-2 border-r border-[#1e293b] bg-[#0f172a] flex-shrink-0">
          <span className="live-dot w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-bold text-[#475569] uppercase tracking-widest font-mono whitespace-nowrap">
            Live Network
          </span>
        </div>
        <div className="overflow-hidden flex-1 py-2">
          <div className="ticker-track">
            {doubled.map((e, i) => (
              <TickerEntry key={i} entry={e} />
            ))}
          </div>
        </div>
        <div className="flex items-center px-5 border-l border-[#1e293b] bg-[#0f172a] flex-shrink-0">
          <span className="text-[10px] font-mono text-[#475569]">36 portals</span>
        </div>
      </div>
    </div>
  );
}
