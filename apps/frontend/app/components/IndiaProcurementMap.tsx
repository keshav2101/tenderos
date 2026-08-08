"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, TrendingUp, ChevronRight, Building2 } from "lucide-react";

export interface StateProcurementData {
  name: string;
  code: string;
  activeTenders: number;
  valueCr: number;
  topCategory: string;
  pathD: string;
  centroid: [number, number];
}

// Representative GeoSVG paths for Indian States/Territories (simplified, clean vector representation)
const STATE_MAP_DATA: StateProcurementData[] = [
  { name: "Maharashtra", code: "MH", activeTenders: 1240, valueCr: 4820, topCategory: "Infrastructure", pathD: "M 150 280 L 230 270 L 250 330 L 190 380 L 140 340 Z", centroid: [190, 320] },
  { name: "Tamil Nadu", code: "TN", activeTenders: 980, valueCr: 3450, topCategory: "IT & Electronics", pathD: "M 200 450 L 240 440 L 250 510 L 210 530 L 190 490 Z", centroid: [218, 480] },
  { name: "Karnataka", code: "KA", activeTenders: 890, valueCr: 3100, topCategory: "Software & Services", pathD: "M 170 380 L 220 370 L 210 450 L 160 430 Z", centroid: [190, 410] },
  { name: "Gujarat", code: "GJ", activeTenders: 840, valueCr: 2950, topCategory: "Energy & Petrochem", pathD: "M 90 240 L 160 230 L 160 290 L 110 300 Z", centroid: [130, 260] },
  { name: "Delhi (NCT)", code: "DL", activeTenders: 1120, valueCr: 5200, topCategory: "Urban Infra & Telecom", pathD: "M 205 155 L 220 155 L 220 170 L 205 170 Z", centroid: [212, 162] },
  { name: "Uttar Pradesh", code: "UP", activeTenders: 1050, valueCr: 4100, topCategory: "Civil & Roads", pathD: "M 210 160 L 310 150 L 320 220 L 230 230 Z", centroid: [265, 190] },
  { name: "West Bengal", code: "WB", activeTenders: 620, valueCr: 1980, topCategory: "Railways & Logistics", pathD: "M 340 230 L 380 220 L 370 290 L 330 270 Z", centroid: [355, 250] },
  { name: "Telangana", code: "TS", activeTenders: 540, valueCr: 1850, topCategory: "Pharma & Tech", pathD: "M 210 320 L 260 310 L 250 360 L 200 360 Z", centroid: [230, 335] },
  { name: "Rajasthan", code: "RJ", activeTenders: 710, valueCr: 2400, topCategory: "Renewable Energy", pathD: "M 120 160 L 200 150 L 200 230 L 110 230 Z", centroid: [160, 190] },
  { name: "Madhya Pradesh", code: "MP", activeTenders: 680, valueCr: 2150, topCategory: "Water & Agriculture", pathD: "M 190 230 L 290 220 L 280 280 L 180 280 Z", centroid: [235, 250] },
  { name: "Kerala", code: "KL", activeTenders: 410, valueCr: 1200, topCategory: "Healthcare & Ports", pathD: "M 180 470 L 200 460 L 190 530 L 175 510 Z", centroid: [186, 495] },
  { name: "Odisha", code: "OD", activeTenders: 490, valueCr: 1650, topCategory: "Mining & Heavy Industry", pathD: "M 300 260 L 350 250 L 340 310 L 290 300 Z", centroid: [320, 280] },
  { name: "Assam & North East", code: "NE", activeTenders: 380, valueCr: 1100, topCategory: "Border Infra & Telecom", pathD: "M 390 180 L 450 170 L 460 220 L 390 220 Z", centroid: [420, 195] },
  { name: "Punjab & Haryana", code: "PB", activeTenders: 590, valueCr: 1780, topCategory: "Agriculture & Civil", pathD: "M 170 120 L 220 110 L 210 160 L 170 150 Z", centroid: [192, 135] },
  { name: "Jammu & Kashmir & Ladakh", code: "JK", activeTenders: 310, valueCr: 950, topCategory: "Strategic Roadways", pathD: "M 160 50 L 240 40 L 230 110 L 160 100 Z", centroid: [195, 75] },
];

interface IndiaProcurementMapProps {
  onSelectState?: (stateName: string) => void;
  selectedState?: string;
  faintBackground?: boolean;
}

export function IndiaProcurementMap({
  onSelectState,
  selectedState,
  faintBackground = false,
}: IndiaProcurementMapProps) {
  const router = useRouter();
  const [hoveredState, setHoveredState] = useState<StateProcurementData | null>(null);

  const activeStateObj = hoveredState || STATE_MAP_DATA.find(s => s.name === selectedState);

  const handleClick = (state: StateProcurementData) => {
    if (onSelectState) {
      onSelectState(state.name);
    } else {
      router.push(`/dashboard/states/${encodeURIComponent(state.name)}`);
    }
  };

  if (faintBackground) {
    return (
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden flex items-center justify-center">
        <svg viewBox="0 0 500 560" className="w-full h-full max-w-lg stroke-slate-900 dark:stroke-white fill-slate-900/10 dark:fill-white/10" strokeWidth="1">
          {STATE_MAP_DATA.map((st) => (
            <path key={st.code} d={st.pathD} />
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col lg:flex-row items-center gap-6 p-5 bg-base border border-subtle rounded-xl shadow-xs overflow-hidden">
      {/* Map Graphic View */}
      <div className="relative w-full lg:w-3/5 h-80 flex items-center justify-center bg-subtle/50 rounded-lg p-2 border border-subtle">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-data-grid opacity-50 pointer-events-none" />

        <svg
          viewBox="50 30 420 520"
          className="w-full h-full max-h-76 drop-shadow-sm select-none z-10"
        >
          {STATE_MAP_DATA.map((st) => {
            const isSelected = selectedState === st.name;
            const isHovered = hoveredState?.code === st.code;

            return (
              <g key={st.code} className="cursor-pointer transition-all duration-150" onClick={() => handleClick(st)}>
                <path
                  d={st.pathD}
                  fill={isSelected ? "var(--brand)" : isHovered ? "var(--brand-light)" : "var(--bg-base)"}
                  stroke={isSelected ? "var(--brand-hover)" : isHovered ? "var(--brand)" : "var(--border-strong)"}
                  strokeWidth={isSelected || isHovered ? "2" : "1"}
                  className="transition-colors duration-150"
                  onMouseEnter={() => setHoveredState(st)}
                  onMouseLeave={() => setHoveredState(null)}
                />

                {/* Hotspot node */}
                <circle
                  cx={st.centroid[0]}
                  cy={st.centroid[1]}
                  r={isSelected || isHovered ? "5" : "3.5"}
                  fill={isSelected ? "#ffffff" : isHovered ? "var(--brand)" : "var(--brand)"}
                  stroke="var(--bg-base)"
                  strokeWidth="1.5"
                  className="pointer-events-none transition-all duration-150"
                />

                <text
                  x={st.centroid[0]}
                  y={st.centroid[1] + 13}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill={isSelected ? "var(--brand-hover)" : "var(--text-secondary)"}
                  className="pointer-events-none select-none font-mono"
                >
                  {st.code}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-2 left-3 text-[10px] text-muted font-mono bg-base/80 px-2 py-0.5 rounded border border-subtle backdrop-blur-xs">
          Interactive Geo-Intelligence · 36 States/UTs
        </div>
      </div>

      {/* State Detail Inspector Panel */}
      <div className="w-full lg:w-2/5 flex flex-col justify-between h-80 p-4 bg-base rounded-lg border border-subtle shadow-xs">
        {activeStateObj ? (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono block">Selected Region</span>
                <h3 className="text-base font-bold text-primary flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand" />
                  {activeStateObj.name}
                </h3>
              </div>
              <span className="portal-badge portal-gem font-mono">{activeStateObj.code}</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Active Solicitations</span>
                <span className="font-mono font-bold text-primary">{activeStateObj.activeTenders.toLocaleString("en-IN")}</span>
              </div>
              <div className="w-full bg-subtle h-1.5 rounded-full overflow-hidden">
                <div className="bg-brand h-1.5 rounded-full" style={{ width: `${Math.min(100, (activeStateObj.activeTenders / 1400) * 100)}%` }} />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted">Estimated Volume</span>
                <span className="font-mono font-bold text-primary">₹{activeStateObj.valueCr.toLocaleString("en-IN")} Cr</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted">Primary Sector</span>
                <span className="font-semibold text-secondary">{activeStateObj.topCategory}</span>
              </div>
            </div>

            <div className="p-2.5 bg-subtle/60 rounded-md border border-subtle text-[11px] text-tertiary flex items-start gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-brand flex-shrink-0 mt-0.5" />
              <span>State portal data synced live with local eProcurement nodes & GeM regional catalog.</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Building2 className="w-8 h-8 text-muted opacity-40 mb-2" />
            <span className="text-xs font-semibold text-secondary">Hover or select a state</span>
            <span className="text-[11px] text-muted mt-1 max-w-[200px]">Click any state on the map to inspect regional procurement activity & volume.</span>
          </div>
        )}

        <button
          onClick={() => handleClick(activeStateObj || STATE_MAP_DATA[0])}
          className="btn btn-secondary w-full text-xs justify-center gap-1 mt-2"
        >
          Explore {activeStateObj?.name || "State"} Tenders <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
