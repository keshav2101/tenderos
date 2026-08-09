"use client";

import { motion } from "framer-motion";
import { Landmark, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

const PORTAL_LIST = [
  { name: "Government e-Marketplace (GeM)", count: "18,240+", icon: "bg-[#16a34a]" },
  { name: "Central Public Procurement Portal (CPPP)", count: "14,180+", icon: "bg-[#2563eb]" },
  { name: "Indian Railways E-Procurement (IREPS)", count: "6,320+", icon: "bg-[#ea580c]" },
  { name: "Defence Procurement Portal (DDP/MoD)", count: "4,920+", icon: "bg-[#dc2626]" },
  { name: "State eProcurement (36 Portals)", count: "9,100+", icon: "bg-[#7c3aed]" },
  { name: "PSUs (ONGC, BHEL, NTPC, IOCL, HAL)", count: "7,500+", icon: "bg-[#64748b]" },
];

export default function ProcurementNetworkGraph() {
  return (
    <div className="bg-[#0f172a]/95 border border-[#1e293b] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between min-w-0" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div>
        {/* Header */}
        <div className="mb-5">
          <h3 className="text-base font-bold text-white">Procurement Network</h3>
          <p className="text-xs text-[#94a3b8] mt-0.5">Real-time coverage across India&apos;s procurement ecosystem</p>
        </div>

        {/* 2 Column Visual: Left India Map Graphic / Right Portal List */}
        <div className="grid md:grid-cols-2 gap-5 items-center mb-5">
          
          {/* Left India Map Node Hub Graphic */}
          <div className="relative w-full h-[240px] bg-[#080d1a] border border-[#1e293b] rounded-xl overflow-hidden flex items-center justify-center p-3">
            <svg className="absolute inset-0 w-full h-full opacity-30 text-[#3b82f6]" viewBox="0 0 200 200" fill="none">
              {/* Subtle India map silhouette outline path */}
              <path d="M 90 20 Q 110 30 130 50 Q 150 70 140 100 Q 130 130 110 160 Q 90 180 80 150 Q 70 120 60 90 Q 50 60 70 30 Z" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>

            {/* Pulsing Central Hub Node */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="z-10 flex flex-col items-center justify-center w-24 h-24 rounded-full bg-[#1d4ed8] text-white shadow-[0_0_30px_rgba(37,99,235,0.6)] border border-[#60a5fa] text-center p-1.5"
            >
              <Landmark className="w-5 h-5 text-white mb-0.5" />
              <span className="font-extrabold text-[11px] leading-none">TenderOS</span>
              <span className="text-[8px] text-blue-200 mt-0.5">Intelligence Network</span>
            </motion.div>

            {/* Glowing Peripheral Nodes */}
            {[
              { label: "GeM", top: "15%", left: "20%", color: "#16a34a" },
              { label: "CPPP", top: "20%", left: "75%", color: "#2563eb" },
              { label: "IREPS", top: "70%", left: "15%", color: "#ea580c" },
              { label: "Defence", top: "75%", left: "75%", color: "#dc2626" },
            ].map(n => (
              <div key={n.label} className="absolute z-10 flex items-center gap-1 bg-[#0f172a]/90 border border-[#334155] px-2 py-0.5 rounded-md text-[9px] font-bold text-white shadow-md" style={{ top: n.top, left: n.left }}>
                <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: n.color }} />
                <span>{n.label}</span>
              </div>
            ))}
          </div>

          {/* Right Portal List */}
          <div className="space-y-2">
            {PORTAL_LIST.map(p => (
              <div key={p.name} className="flex items-center justify-between p-2 rounded-lg border border-[#1e293b] bg-[#080d1a] text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.icon}`} />
                  <span className="font-medium text-[#e2e8f0] truncate text-[11px]">{p.name}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <span className="font-mono font-bold text-white text-[11px]">{p.count}</span>
                  <span className="text-[9px] font-mono font-bold text-[#4ade80] bg-[#064e3b]/40 px-1 py-0.5 rounded border border-[#059669]/50">● LIVE</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <div className="pt-3 border-t border-[#1e293b]">
        <Link href="/dashboard" className="text-xs font-semibold text-[#60a5fa] hover:text-white flex items-center gap-1">
          View all 36+ portals <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
