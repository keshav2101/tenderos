"use client";
import { useState, useEffect } from "react";

const ENDPOINTS = [
  { method: "GET", path: "/v1/tenders", desc: "Search & filter tenders" },
  { method: "GET", path: "/v1/tenders/:id/ai-summary", desc: "AI interpretation" },
  { method: "POST", path: "/v1/eligibility/score", desc: "Bid qualification" },
  { method: "GET", path: "/v1/market/ministry-spend", desc: "Spend intelligence" },
  { method: "GET", path: "/v1/predictions/upcoming", desc: "Procurement forecasts" },
  { method: "GET", path: "/v1/competitors/win-history", desc: "L1 price discovery" },
];

const RESPONSE_LINES = [
  `{`,
  `  "status": "ok",`,
  `  "results": 1840,`,
  `  "latency_ms": 98,`,
  `  "data": [`,
  `    {`,
  `      "id": "CPPP-MF-2026-04812",`,
  `      "title": "AI-based Fraud Detection",`,
  `      "ministry": "Ministry of Finance",`,
  `      "value_cr": 42.8,`,
  `      "portal": "CPPP",`,
  `      "match_score": 94,`,
  `      "emd_exempt": true,`,
  `      "deadline": "2026-08-28"`,
  `    },`,
  `    { "..." }`,
  `  ]`,
  `}`,
];

export default function APIArtifact() {
  const [active, setActive] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    setVisibleLines(0);
    const timer = setInterval(() => {
      setVisibleLines(prev => {
        if (prev >= RESPONSE_LINES.length) { clearInterval(timer); return prev; }
        return prev + 1;
      });
    }, 60);
    return () => clearInterval(timer);
  }, [active]);

  const ep = ENDPOINTS[active];

  return (
    <div className="bg-[#0a0f1e] rounded-xl border border-[#1e293b] overflow-hidden" style={{ fontFamily: "JetBrains Mono, monospace" }}>
      {/* Terminal chrome */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e293b] bg-[#0f172a]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1e293b]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#1e293b]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#1e293b]" />
          <span className="text-[10px] text-[#475569] ml-2">TenderOS API Console</span>
        </div>
        <span className="text-[10px] text-emerald-500">● Connected</span>
      </div>

      {/* Endpoint selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border-b border-[#1e293b]">
        {ENDPOINTS.map((e, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-4 py-2 text-left border-r border-b border-[#1e293b] last:border-r-0 transition-colors ${
              i === active ? "bg-[#1e293b]" : "hover:bg-[#131c30]"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`text-[9px] font-bold ${e.method === "GET" ? "text-[#22c55e]" : "text-[#60a5fa]"}`}>
                {e.method}
              </span>
              <span className="text-[9px] text-[#334155] truncate">{e.path}</span>
            </div>
            <div className="text-[9px] text-[#475569] truncate">{e.desc}</div>
          </button>
        ))}
      </div>

      {/* Request */}
      <div className="px-5 py-3 border-b border-[#1e293b]">
        <div className="text-[9px] text-[#475569] mb-1.5 uppercase tracking-widest">Request</div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold ${ep.method === "GET" ? "text-[#22c55e]" : "text-[#60a5fa]"}`}>
            {ep.method}
          </span>
          <span className="text-[11px] text-[#e2e8f0]">api.tenderos.in{ep.path}</span>
        </div>
        <div className="mt-1.5 text-[10px] text-[#334155]">
          Authorization: Bearer tk_live_••••••••••••
        </div>
      </div>

      {/* Response */}
      <div className="px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] text-[#475569] uppercase tracking-widest">Response</span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-emerald-400 font-bold">200 OK</span>
            <span className="text-[10px] text-[#475569]">98ms</span>
            <span className="text-[10px] text-[#475569]">1,840 results</span>
          </div>
        </div>
        <div className="space-y-0.5 min-h-[160px]">
          {RESPONSE_LINES.slice(0, visibleLines).map((line, i) => (
            <div key={i} className="text-[10px] leading-relaxed">
              {line.includes('"status"') || line.includes('"results"') || line.includes('"latency') ? (
                <span className="text-[#94a3b8]">
                  {line.split(':')[0]}: <span className="text-[#86efac]">{line.split(':').slice(1).join(':')}</span>
                </span>
              ) : line.includes('"match_score"') ? (
                <span className="text-[#94a3b8]">
                  {line.split(':')[0]}: <span className="text-[#60a5fa]">{line.split(':').slice(1).join(':')}</span>
                </span>
              ) : (
                <span className="text-[#64748b]">{line}</span>
              )}
            </div>
          ))}
          {visibleLines < RESPONSE_LINES.length && (
            <span className="inline-block w-1.5 h-3 bg-[#60a5fa] animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
