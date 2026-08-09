"use client";

import { useState } from "react";
import { MapPin, Activity, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";

interface StateInfo {
  name: string;
  tenders: string;
  value: string;
  density: "High" | "Medium" | "Active";
}

const TOP_STATES: StateInfo[] = [
  { name: "Maharashtra", tenders: "9,100+", value: "₹18,420 Cr", density: "High" },
  { name: "Karnataka", tenders: "4,820+", value: "₹9,340 Cr", density: "High" },
  { name: "Uttar Pradesh", tenders: "5,640+", value: "₹12,180 Cr", density: "High" },
  { name: "Tamil Nadu", tenders: "3,450+", value: "₹7,210 Cr", density: "Medium" },
  { name: "Gujarat", tenders: "4,120+", value: "₹8,950 Cr", density: "High" },
  { name: "Delhi & NCR", tenders: "6,890+", value: "₹15,600 Cr", density: "High" },
  { name: "West Bengal", tenders: "2,980+", value: "₹5,420 Cr", density: "Medium" },
  { name: "Telangana", tenders: "3,120+", value: "₹6,150 Cr", density: "Medium" },
];

export default function IndiaCoverageMap() {
  const [selectedState, setSelectedState] = useState<StateInfo>(TOP_STATES[0]);

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-3xl p-6 sm:p-10 shadow-xs" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#16a34a] uppercase tracking-wider bg-[#f0fdf4] px-3 py-1 rounded-full mb-2">
            <Activity className="w-3 h-3 text-[#16a34a]" /> 36 States &amp; UT Coverage
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            National Procurement Distribution
          </h2>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-1">
            Real-time indexing across state eProcurement portals, Public Works Departments (PWD), and municipal corporations.
          </p>
        </div>

        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1d4ed8] hover:underline">
          View Full State Analytics <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
        
        {/* Interactive State Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TOP_STATES.map(s => {
            const isSelected = selectedState.name === s.name;
            return (
              <button
                key={s.name}
                onClick={() => setSelectedState(s)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "border-[#1d4ed8] bg-[#eff6ff] shadow-sm"
                    : "border-[#e2e8f0] bg-[#f8fafc] hover:bg-white hover:border-[#bfdbfe]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-[#6b7280] truncate">{s.name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.density === "High" ? "bg-[#16a34a]" : "bg-[#3b82f6]"}`} />
                </div>
                <div className="text-sm font-extrabold text-[#111827]">{s.tenders}</div>
                <div className="text-[10px] font-mono text-[#6b7280] mt-0.5">{s.value}</div>
              </button>
            );
          })}
        </div>

        {/* State Detail Panel */}
        <div className="bg-[#0b1329] text-white border border-[#1e293b] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#60a5fa]" />
              <span className="font-extrabold text-sm">{selectedState.name}</span>
            </div>
            <span className="text-[9px] font-mono font-bold text-[#4ade80] bg-[#1e293b] px-2 py-0.5 rounded">
              {selectedState.density} Density
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#080d1a] border border-[#1e293b]">
              <div className="text-[10px] text-[#94a3b8]">Active Tenders</div>
              <div className="text-lg font-extrabold text-white mt-1">{selectedState.tenders}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#080d1a] border border-[#1e293b]">
              <div className="text-[10px] text-[#94a3b8]">Estimated Volume</div>
              <div className="text-lg font-extrabold text-[#60a5fa] mt-1">{selectedState.value}</div>
            </div>
          </div>

          <div className="pt-1 text-[11px] text-[#94a3b8] leading-relaxed">
            Automatic indexing includes PWD, Irrigation, Urban Development, Health Services, and Smart City Special Purpose Vehicles (SPVs).
          </div>
        </div>

      </div>
    </div>
  );
}
