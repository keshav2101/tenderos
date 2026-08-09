"use client";

import { Landmark, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";

const PORTAL_LIST = [
  { name: "Government e-Marketplace (GeM)", count: "18,240+", badge: "bg-[#EAF6EF] text-[#18794E] border-[#A7F3D0]" },
  { name: "Central Public Procurement Portal (CPPP)", count: "14,180+", badge: "bg-[#EAF6EF] text-[#18794E] border-[#A7F3D0]" },
  { name: "Indian Railways E-Procurement (IREPS)", count: "6,320+", badge: "bg-[#EAF6EF] text-[#18794E] border-[#A7F3D0]" },
  { name: "Defence Procurement Portal (DDP/MoD)", count: "4,920+", badge: "bg-[#EAF6EF] text-[#18794E] border-[#A7F3D0]" },
  { name: "State eProcurement (36 Portals)", count: "9,100+", badge: "bg-[#EAF6EF] text-[#18794E] border-[#A7F3D0]" },
  { name: "PSUs (ONGC, BHEL, NTPC, IOCL, HAL)", count: "7,500+", badge: "bg-[#EAF6EF] text-[#18794E] border-[#A7F3D0]" },
];

export default function ProcurementNetworkGraph() {
  return (
    <div className="bg-white border border-[#D9E1E8] rounded p-6 shadow-2xs flex flex-col justify-between min-w-0" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div>
        {/* Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#1F5A96] uppercase tracking-wider bg-[#F1F5F9] px-2.5 py-0.5 rounded border border-[#D9E1E8] mb-2">
            <Shield className="w-3 h-3 text-[#1F5A96]" /> NATIONAL PROCUREMENT NETWORK COVERAGE
          </div>
          <h3 className="text-xl font-extrabold text-[#0B1F33]">National Procurement Network</h3>
          <p className="text-xs text-[#475569] mt-0.5">Real-time indexing across federal, state, railway, and defence portals</p>
        </div>

        {/* 2 Column Visual Layout */}
        <div className="grid md:grid-cols-2 gap-6 items-center mb-6">
          
          {/* Left India Map Network Graphic */}
          <div className="relative w-full h-[250px] bg-[#F7F9FC] border border-[#D9E1E8] rounded p-4 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full text-[#1F5A96]" viewBox="0 0 200 200" fill="none">
              <path d="M 90 20 Q 110 30 130 50 Q 150 70 140 100 Q 130 130 110 160 Q 90 180 80 150 Q 70 120 60 90 Q 50 60 70 30 Z" stroke="#1F5A96" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
            </svg>

            {/* Central Infrastructure Hub Node */}
            <div className="z-10 flex flex-col items-center justify-center w-28 h-28 rounded bg-[#12355B] text-white shadow-sm border border-[#1F5A96] text-center p-2">
              <Landmark className="w-6 h-6 text-white mb-1" />
              <span className="font-extrabold text-xs leading-none">TenderOS</span>
              <span className="text-[9px] text-[#E2E8F0] mt-1 font-mono">National Infrastructure</span>
            </div>

            {/* Portal Nodes */}
            {[
              { label: "GeM", top: "15%", left: "15%" },
              { label: "CPPP", top: "20%", left: "75%" },
              { label: "IREPS", top: "75%", left: "15%" },
              { label: "Defence", top: "75%", left: "75%" },
            ].map(n => (
              <div key={n.label} className="absolute z-10 flex items-center gap-1.5 bg-white border border-[#D9E1E8] px-2.5 py-1 rounded text-[10px] font-bold text-[#0B1F33] shadow-2xs" style={{ top: n.top, left: n.left }}>
                <span className="w-2 h-2 rounded-full bg-[#18794E]" />
                <span>{n.label}</span>
              </div>
            ))}
          </div>

          {/* Right Portal Coverage List */}
          <div className="space-y-2.5">
            {PORTAL_LIST.map(p => (
              <div key={p.name} className="flex items-center justify-between p-3 rounded border border-[#D9E1E8] bg-[#F7F9FC] text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#18794E] flex-shrink-0" />
                  <span className="font-semibold text-[#0B1F33] truncate text-[11px]">{p.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="font-mono font-bold text-[#0B1F33] text-[11px]">{p.count}</span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${p.badge}`}>● LIVE</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <div className="pt-3 border-t border-[#D9E1E8]">
        <Link href="/dashboard" className="text-xs font-bold text-[#1F5A96] hover:text-[#12355B] flex items-center gap-1">
          View All 36+ Portals <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
