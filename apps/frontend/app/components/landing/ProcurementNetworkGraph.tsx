"use client";

import { motion } from "framer-motion";
import { Landmark, Server, Shield, Radio, Database, Cpu, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PortalNode {
  id: string;
  name: string;
  count: string;
  color: string;
  x: number; // percentage
  y: number;
}

const PORTALS: PortalNode[] = [
  { id: "gem", name: "Government e-Marketplace (GeM)", count: "18,240+", color: "#16a34a", x: 20, y: 25 },
  { id: "cppp", name: "Central Public Procurement Portal (CPPP)", count: "14,180+", color: "#1d4ed8", x: 80, y: 25 },
  { id: "ireps", name: "Indian Railways E-Procurement (IREPS)", count: "6,320+", color: "#ea580c", x: 15, y: 75 },
  { id: "ddp", name: "Defence Procurement Portal (DDP/MoD)", count: "4,920+", color: "#dc2626", x: 85, y: 75 },
  { id: "states", name: "State eProcurement (36 Portals)", count: "9,100+", color: "#7c3aed", x: 50, y: 15 },
  { id: "psu", name: "PSUs (ONGC, BHEL, NTPC, IOCL)", count: "7,500+", color: "#475569", x: 50, y: 85 },
];

export default function ProcurementNetworkGraph() {
  return (
    <div className="bg-[#0b1329] text-white rounded-3xl p-6 sm:p-10 border border-[#1e293b] shadow-xl overflow-hidden relative" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Radial background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(29,78,216,0.15)_0,transparent_70%)] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold text-[#60a5fa] uppercase tracking-wider bg-[#1e293b] px-3 py-1 rounded-full mb-2">
            <Radio className="w-3 h-3 animate-pulse text-[#4ade80]" /> Live Ingestion Mesh
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Procurement Network Coverage
          </h2>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1 max-w-xl">
            TenderOS continuously ingests, normalizes, and indexes public tenders across 36+ Indian federal, state, railway, and defence portals.
          </p>
        </div>

        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#60a5fa] hover:text-white transition-colors">
          View All 36+ Portals <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Interactive Visual Mesh */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-center relative z-10">
        
        {/* Node Network Map */}
        <div className="relative w-full h-[360px] sm:h-[400px] bg-[#080d1a] border border-[#1e293b] rounded-2xl overflow-hidden flex items-center justify-center">
          
          {/* SVG Connecting Lines with animated data flow */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {PORTALS.map(p => (
              <g key={p.id}>
                {/* Static line */}
                <line x1={`${p.x}%`} y1={`${p.y}%`} x2="50%" y2="50%" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
                {/* Animated flowing line */}
                <line x1={`${p.x}%`} y1={`${p.y}%`} x2="50%" y2="50%" stroke={p.color} strokeWidth="0.8" opacity="0.4" />
              </g>
            ))}
          </svg>

          {/* Center Hub Node */}
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="z-20 flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#1d4ed8] text-white shadow-[0_0_40px_rgba(29,78,216,0.5)] border-2 border-[#60a5fa] text-center p-2"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-1">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xs tracking-tight">TenderOS</span>
            <span className="text-[9px] text-blue-200 font-mono">Procurement OS</span>
          </motion.div>

          {/* Outer Portal Nodes */}
          {PORTALS.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
              className="absolute z-20 flex flex-col items-center"
            >
              <div className="bg-[#0f172a] border border-[#334155] rounded-xl px-3 py-1.5 shadow-md flex items-center gap-2 hover:border-[#60a5fa] transition-colors cursor-pointer group">
                <span className="w-2 h-2 rounded-full flex-shrink-0 animate-ping" style={{ backgroundColor: p.color }} />
                <div className="text-left">
                  <div className="text-[11px] font-bold text-white group-hover:text-[#60a5fa] transition-colors truncate max-w-[140px]">
                    {p.name.split(" ")[0]}
                  </div>
                  <div className="text-[9px] font-mono text-[#94a3b8]">{p.count}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live Network Statistics Column */}
        <div className="space-y-3">
          {[
            { label: "Active Tenders", val: "60,260+", sub: "+2,340 indexed today", icon: Server },
            { label: "Union Ministries", val: "52+", sub: "Full central coverage", icon: Database },
            { label: "State & UT Portals", val: "36+", sub: "Including PWD & Municipal", icon: Cpu },
            { label: "Security & Exemption Rules", val: "GFR 2017", sub: "Automated MSME & MII rules", icon: Shield },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="p-4 rounded-xl border border-[#1e293b] bg-[#080d1a] flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#1e293b] text-[#60a5fa] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-[#94a3b8] font-medium uppercase tracking-wider">{stat.label}</div>
                  <div className="text-base font-extrabold text-white mt-0.5">{stat.val}</div>
                  <div className="text-[10px] text-[#64748b]">{stat.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
