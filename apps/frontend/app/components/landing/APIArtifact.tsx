"use client";
import { useState, useCallback } from "react";

// Predefined endpoint definitions — UI config, not business data
const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/search",
    label: "Semantic Search",
    defaultParam: "AI fraud detection system",
    paramKey: "q",
    description: "Hybrid keyword + vector search across procurement catalog",
  },
  {
    method: "GET",
    path: "/api/v1/tenders",
    label: "List Tenders",
    defaultParam: "20",
    paramKey: "page_size",
    description: "Paginated live tender feed with filters",
  },
  {
    method: "GET",
    path: "/api/v1/analytics/overview",
    label: "Platform Overview",
    defaultParam: "",
    paramKey: "",
    description: "Real-time platform-wide procurement statistics",
  },
];

interface ExecResult {
  status: number;
  latencyMs: number;
  body: unknown;
  resultCount?: number;
}

const API_HOST = process.env.NEXT_PUBLIC_API_URL || "https://tenderos-production.up.railway.app";

export default function APIArtifact() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [paramValue, setParamValue] = useState(ENDPOINTS[0].defaultParam);
  const [result, setResult] = useState<ExecResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ep = ENDPOINTS[selectedIdx];

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    const t0 = performance.now();
    try {
      let url = `${API_HOST}${ep.path}`;
      if (ep.paramKey && paramValue) {
        url += `?${ep.paramKey}=${encodeURIComponent(paramValue)}`;
      }
      const res = await fetch(url, {
        headers: { "Bypass-Tunnel-Reminder": "true" },
      });
      const latencyMs = Math.round(performance.now() - t0);
      const body = await res.json().catch(() => ({}));
      const resultCount =
        (body as Record<string, unknown>).total ??
        ((body as Record<string, unknown[]>).results?.length) ??
        ((body as Record<string, unknown[]>).items?.length) ??
        undefined;
      setResult({ status: res.status, latencyMs, body, resultCount: resultCount as number | undefined });
    } catch (e) {
      const latencyMs = Math.round(performance.now() - t0);
      setError(`Request failed · ${latencyMs}ms`);
    } finally {
      setLoading(false);
    }
  }, [ep, paramValue]);

  function handleSelect(idx: number) {
    setSelectedIdx(idx);
    setParamValue(ENDPOINTS[idx].defaultParam);
    setResult(null);
    setError(null);
  }

  const statusColor =
    !result ? "#64748b" :
    result.status >= 200 && result.status < 300 ? "#22c55e" :
    result.status >= 400 ? "#ef4444" : "#f97316";

  const preview = result
    ? JSON.stringify(result.body, null, 2).slice(0, 900) + (JSON.stringify(result.body).length > 900 ? "\n\n  // … truncated" : "")
    : null;

  return (
    <div className="bg-[#0a0f1e] border border-[#1e293b] rounded-2xl overflow-hidden" style={{ fontFamily: "Inter Mono, JetBrains Mono, monospace" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1e293b] bg-[#0f172a]">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ef4444] opacity-60" />
            <span className="w-3 h-3 rounded-full bg-[#f97316] opacity-60" />
            <span className="w-3 h-3 rounded-full bg-[#22c55e] opacity-60" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#475569] ml-1">TenderOS API Console</span>
        </div>
        {result && (
          <span className="text-[10px] font-mono" style={{ color: statusColor }}>
            {result.status} · {result.latencyMs}ms{result.resultCount != null ? ` · ${result.resultCount} results` : ""}
          </span>
        )}
      </div>

      {/* Endpoint selector */}
      <div className="px-6 pt-4 pb-3 border-b border-[#1a2540]">
        <div className="text-[9px] text-[#334155] uppercase tracking-wider mb-2 font-bold">ENDPOINT</div>
        <div className="flex flex-col gap-1">
          {ENDPOINTS.map((e, i) => (
            <button key={e.path}
              onClick={() => handleSelect(i)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                i === selectedIdx ? "bg-[#1e293b]" : "hover:bg-[#111827]"
              }`}
            >
              <span className="text-[9px] font-bold text-[#3b82f6] font-mono w-8">{e.method}</span>
              <span className="text-[11px] text-[#94a3b8] font-mono flex-1">{e.path}</span>
              <span className="text-[9px] text-[#475569]">{e.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Param input */}
      {ep.paramKey && (
        <div className="px-6 py-3 border-b border-[#1a2540]">
          <div className="text-[9px] text-[#334155] uppercase tracking-wider mb-2 font-bold">
            PARAMETER <span className="text-[#1e293b] ml-1">/</span> <span className="text-[#475569] ml-1 font-mono">{ep.paramKey}</span>
          </div>
          <input
            type="text"
            value={paramValue}
            onChange={e => setParamValue(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") execute(); }}
            className="w-full bg-[#0c1120] border border-[#1e293b] rounded-lg px-3 py-2 text-[11px] text-[#94a3b8] font-mono outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#334155]"
            placeholder={ep.defaultParam}
          />
        </div>
      )}

      {/* Execute button */}
      <div className="px-6 py-3 border-b border-[#1a2540]">
        <button
          onClick={execute}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#1d4ed8] hover:bg-[#1e40af] disabled:bg-[#1e293b] text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
        >
          {loading ? (
            <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Executing…</>
          ) : (
            <>▶ Execute Request</>
          )}
        </button>
      </div>

      {/* Response panel */}
      <div className="px-6 pt-3 pb-5" style={{ minHeight: "180px" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] text-[#334155] uppercase tracking-wider font-bold">RESPONSE</span>
          {result && (
            <span className="text-[9px] font-mono" style={{ color: statusColor }}>
              HTTP {result.status} · {result.latencyMs}ms
            </span>
          )}
        </div>
        {!result && !error && !loading && (
          <div className="text-[11px] text-[#334155] font-mono pt-2">
            <span className="text-[#1e293b]">{"// "}</span>
            Select an endpoint and click Execute to run a live API call
          </div>
        )}
        {loading && (
          <div className="space-y-2 pt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-2 bg-[#1e293b] rounded animate-pulse`} style={{ width: `${60 + Math.random() * 35}%` }} />
            ))}
          </div>
        )}
        {error && (
          <div className="text-[11px] text-[#ef4444] font-mono pt-2">{error}</div>
        )}
        {preview && (
          <pre className="text-[10px] text-[#60a5fa] font-mono overflow-auto leading-relaxed whitespace-pre-wrap" style={{ maxHeight: "220px" }}>
            {preview}
          </pre>
        )}
      </div>
    </div>
  );
}
