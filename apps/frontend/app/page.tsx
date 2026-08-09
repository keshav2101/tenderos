"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Search, ArrowRight, Landmark, ChevronRight,
  Database, Brain, ShieldCheck, Activity, RefreshCw
} from "lucide-react";
import { useProcurementStats } from "@/hooks/useProcurementStats";
import { useLiveTenders } from "@/hooks/useLiveTenders";
import { usePortalStats } from "@/hooks/usePortalStats";
import { useLatestTender } from "@/hooks/useLatestTender";

const ProcurementTicker = dynamic(() => import("@/app/components/landing/ProcurementTicker"), { ssr: false });
const HeroArtifact       = dynamic(() => import("@/app/components/landing/HeroArtifact"),       { ssr: false });
const IntelligencePipeline = dynamic(() => import("@/app/components/landing/IntelligencePipeline"), { ssr: false });
const BidDecisionEngine  = dynamic(() => import("@/app/components/landing/BidDecisionEngine"),  { ssr: false });
const LiveConsole        = dynamic(() => import("@/app/components/landing/LiveConsole"),         { ssr: false });
const APIArtifact        = dynamic(() => import("@/app/components/landing/APIArtifact"),         { ssr: false });

// ── Unified container — used in every section ───────────────────────────
const C = "mx-auto w-full max-w-[1600px] px-6 sm:px-10 lg:px-16";

function IndiaBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: 0.025 }} aria-hidden>
      <svg viewBox="0 0 600 700" className="absolute right-0 top-0 h-full w-auto" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M300,20 L340,24 L380,18 L420,28 L450,22 L480,38 L500,60 L510,85 L505,110 L515,135 L520,160 L510,185 L515,210 L505,235 L490,258 L480,280 L465,300 L450,320 L438,342 L425,360 L415,380 L405,400 L395,415 L385,428 L372,440 L358,450 L345,462 L330,474 L318,488 L308,502 L298,516 L290,530 L282,520 L272,506 L260,492 L248,478 L235,462 L220,448 L205,434 L192,418 L180,402 L168,385 L155,368 L142,350 L130,330 L118,310 L105,290 L92,268 L80,246 L70,222 L62,198 L58,172 L60,148 L68,124 L80,102 L98,84 L118,68 L140,54 L162,42 L188,34 L215,26 L245,20 L275,18 Z" className="text-[#111827]" />
      </svg>
    </div>
  );
}

// Portal network SVG — renders dynamically from live portal stats
function DynamicPortalNetwork({ sources }: { sources: Array<{ name: string; count: number; color: string }> }) {
  const defaultNodes = [
    { cx: 250, cy: 70,  label: "CPPP",        count: "—", color: "#1d4ed8" },
    { cx: 430, cy: 155, label: "GeM",          count: "—", color: "#16a34a" },
    { cx: 430, cy: 345, label: "IREPS",        count: "—", color: "#ea580c" },
    { cx: 250, cy: 430, label: "State Portals",count: "—", color: "#7c3aed" },
    { cx: 70,  cy: 345, label: "PSUs",         count: "—", color: "#475569" },
    { cx: 70,  cy: 155, label: "Defence",      count: "—", color: "#dc2626" },
  ];

  const nodes = defaultNodes.map(node => {
    const found = sources.find(s => s.name.toLowerCase().includes(node.label.toLowerCase()) || node.label.toLowerCase().includes(s.name.toLowerCase()));
    return {
      ...node,
      count: found ? found.count.toLocaleString("en-IN") : node.count,
      color: found?.color || node.color,
    };
  });

  return (
    <svg viewBox="0 0 500 500" className="w-full h-full" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <circle cx="250" cy="250" r="50" fill="#1d4ed8" opacity="0.06" />
      <circle cx="250" cy="250" r="34" fill="#1d4ed8" opacity="0.10" />
      <circle cx="250" cy="250" r="20" fill="#1d4ed8" />
      <text x="250" y="246" textAnchor="middle" fontSize="7" fontWeight="900" fill="white" letterSpacing="0.5">TENDER</text>
      <text x="250" y="258" textAnchor="middle" fontSize="7" fontWeight="900" fill="white" letterSpacing="0.5">OS</text>
      {nodes.map(n => (
        <g key={n.label}>
          <line x1="250" y1="250" x2={n.cx} y2={n.cy} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx={n.cx} cy={n.cy} r="36" fill="white" stroke={n.color} strokeWidth="2" />
          <circle cx={n.cx} cy={n.cy} r="5" fill={n.color} />
          <text x={n.cx} y={n.cy + 22} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#374151">{n.label}</text>
          <text x={n.cx} y={n.cy + 35} textAnchor="middle" fontSize="7.5" fill="#9ca3af">{n.count}</text>
        </g>
      ))}
      <circle cx="250" cy="250" r="155" fill="none" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="5 5" />
    </svg>
  );
}

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Live Data Hooks — zero hardcoding
  const { state: statsState, refresh: refreshStats } = useProcurementStats();
  const { state: tendersState, refresh: refreshTenders } = useLiveTenders(12);
  const { state: portalState } = usePortalStats();
  const { tender: latestTender, isLoading: isTenderLoading } = useLatestTender();

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#111827]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Live Ticker */}
      <ProcurementTicker />

      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-20 bg-white/96 backdrop-blur-sm border-b border-[#e5e7eb]">
        <div className={`${C} h-14 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#1d4ed8] flex items-center justify-center">
              <Landmark className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-[#111827] tracking-tight">TenderOS</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe]">INDIA</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#374151]">
            <a href="#platform" className="hover:text-[#111827] transition-colors">Platform</a>
            <a href="#intelligence" className="hover:text-[#111827] transition-colors">Intelligence</a>
            <a href="#api" className="hover:text-[#111827] transition-colors">API</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-[#374151] hover:text-[#111827] px-3 py-1.5 transition-colors">Sign in</Link>
            <Link href="/register" className="text-sm font-semibold bg-[#1d4ed8] text-white px-4 py-1.5 rounded-lg hover:bg-[#1e40af] transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - Generous spacing (100px - 120px padding) */}
      <section className="relative overflow-hidden bg-white border-b border-[#e5e7eb] py-24 lg:py-32" style={{ minHeight: "780px" }}>
        <IndiaBg />
        <div className={`${C} relative z-10`}>
          <div className="grid lg:grid-cols-[5fr_7fr] gap-16 xl:gap-24 items-center">

            {/* Left column */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9ca3af] font-mono">
                  01 · PROCUREMENT INTELLIGENCE
                </span>
                <span className="h-px w-8 bg-[#e5e7eb]" />
                <span className="text-[10px] font-mono text-[#c5cdd8]">India · Govt Procurement Platform</span>
              </div>

              <h1 className="fade-up" style={{ fontSize: "clamp(52px, 6.5vw, 96px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.03em", color: "#111827", marginBottom: "24px" }}>
                WIN MORE<br />
                GOVERNMENT<br />
                <span style={{ color: "#1d4ed8" }}>TENDERS.</span>
              </h1>
              <p className="fade-up-1" style={{ fontSize: "clamp(24px, 2.8vw, 38px)", fontWeight: 300, letterSpacing: "-0.02em", color: "#374151", lineHeight: 1.1, marginBottom: "32px" }}>
                INTELLIGENTLY.
              </p>

              <p className="text-lg text-[#6b7280] leading-relaxed mb-10 max-w-lg fade-up-2">
                India&apos;s premier AI procurement intelligence platform. Every tender notice from GeM,
                CPPP, IREPS, Defence, and State Portals — extracted, structured, and scored for your business.
              </p>

              {/* Search */}
              <div className="bg-white border border-[#e5e7eb] rounded-xl p-1.5 flex items-center gap-2 mb-4 fade-up-3 shadow-sm">
                <Search className="w-4 h-4 text-[#9ca3af] ml-2 flex-shrink-0" />
                <input
                  type="text" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") window.location.href = `/dashboard/search?q=${encodeURIComponent(searchQuery)}`; }}
                  placeholder="Search live tenders — ministry, category, portal…"
                  className="flex-1 text-sm text-[#111827] placeholder:text-[#9ca3af] bg-transparent outline-none py-2.5"
                />
                <Link href={`/dashboard/search?q=${encodeURIComponent(searchQuery)}`}
                  className="text-sm font-semibold bg-[#1d4ed8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1e40af] transition-colors flex items-center gap-2 flex-shrink-0">
                  Search <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-xs text-[#9ca3af] mb-12 fade-up-3">
                GeM &middot; CPPP &middot; IREPS &middot; Defence Procurement &middot; 36 State Portals &middot; PSUs &middot; Autonomous Bodies
              </p>

              <div className="flex items-center gap-4 fade-up-3">
                <Link href="/dashboard" className="inline-flex items-center gap-2 font-semibold bg-[#111827] text-white px-7 py-3.5 rounded-xl hover:bg-[#1d4ed8] transition-all duration-200 text-sm">
                  Enter Command Center <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-[#374151] border border-[#e5e7eb] bg-white px-7 py-3.5 rounded-xl hover:border-[#1d4ed8] hover:text-[#1d4ed8] transition-all duration-200">
                  Free Account <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right column: AI Dossier (Live Tender Assessment) */}
            <div className="hidden lg:flex flex-col fade-up-2">
              <HeroArtifact tender={latestTender} isLoading={isTenderLoading} />
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC LIVE STATS BAND (Clean 80px vertical rhythm) */}
      <section className="bg-white border-b border-[#e5e7eb] py-16">
        <div className={C}>
          {statsState.status === "loading" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-3">
                  <div className="h-3 w-24 bg-[#e5e7eb] rounded animate-pulse" />
                  <div className="h-12 w-32 bg-[#e5e7eb] rounded animate-pulse" />
                  <div className="h-3 w-40 bg-[#e5e7eb] rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : statsState.status === "success" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#f1f5f9]">
              {[
                {
                  num: statsState.data.total_active_tenders.toLocaleString("en-IN"),
                  label: "ACTIVE TENDERS",
                  sub: "Live across all portals",
                  icon: Database
                },
                {
                  num: `${statsState.data.active_ministries}+`,
                  label: "UNION MINISTRIES",
                  sub: "Full procurement coverage",
                  icon: Landmark
                },
                {
                  num: statsState.data.active_states > 0 ? statsState.data.active_states.toString() : "36",
                  label: "STATES & UTs",
                  sub: "Including autonomous bodies",
                  icon: Activity
                },
                {
                  num: statsState.data.tenders_indexed_today.toLocaleString("en-IN"),
                  label: "INDEXED TODAY",
                  sub: "New tenders processed by AI",
                  icon: Brain
                },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="flex flex-col gap-4 px-8 xl:px-14 py-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9ca3af] font-mono">{s.label}</div>
                    <div className="font-extrabold text-[#111827] leading-none" style={{ fontSize: "clamp(38px, 3.6vw, 56px)", fontVariantNumeric: "tabular-nums" }}>
                      {s.num}
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-[#9ca3af]" />
                      <span className="text-xs text-[#6b7280]">{s.sub}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 flex items-center justify-between text-xs text-[#6b7280]">
              <span>Data temporarily unavailable. Live procurement network is active.</span>
              <button onClick={refreshStats} className="text-[#1d4ed8] font-bold flex items-center gap-1 hover:underline">
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}
        </div>
      </section>

      {/* PORTAL COVERAGE — Spacing: 96px - 120px */}
      <section className="bg-[#f8fafc] border-b border-[#e5e7eb] py-28">
        <div className={C}>
          <div className="grid lg:grid-cols-[45fr_55fr] gap-12 xl:gap-20 items-center">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9ca3af] font-mono mb-5">02 · PORTAL COVERAGE</div>
              <h2 className="font-extrabold text-[#111827] leading-tight mb-6 tracking-tight" style={{ fontSize: "clamp(32px, 3.5vw, 48px)" }}>
                Every Indian<br />government portal.<br />
                <span className="text-[#1d4ed8]">One platform.</span>
              </h2>
              <p className="text-lg text-[#6b7280] leading-relaxed mb-10 max-w-md">
                Real-time aggregation across central and state procurement portals,
                PSUs, Railways, Defence, and autonomous bodies. Updated continuously, 24×7.
              </p>

              <div className="border border-[#e5e7eb] rounded-2xl overflow-hidden bg-white">
                {portalState.status === "loading" ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="h-3 w-48 bg-[#e5e7eb] rounded animate-pulse" />
                        <div className="h-3 w-16 bg-[#e5e7eb] rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : portalState.status === "success" ? (
                  portalState.data.map((p, i, arr) => (
                    <div key={p.name}
                      className={`flex items-center justify-between px-5 py-4 ${i < arr.length - 1 ? "border-b border-[#f3f4f6]" : ""} hover:bg-[#f9fafb] transition-colors`}>
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-sm font-medium text-[#374151]">{p.full_name}</span>
                      </div>
                      <span className="text-sm font-mono font-bold text-[#1d4ed8]">{p.count.toLocaleString("en-IN")} tenders</span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-xs text-[#6b7280]">Portal status index updating...</div>
                )}
              </div>
            </div>

            {/* Dynamic Network Diagram */}
            <div className="flex items-center justify-center" style={{ minHeight: "440px" }}>
              <DynamicPortalNetwork sources={portalState.status === "success" ? portalState.data : []} />
            </div>
          </div>
        </div>
      </section>

      {/* AI PIPELINE - Spacing: 96px */}
      <section id="platform" className="bg-[#f4f6f8] border-b border-[#e5e7eb] py-28">
        <div className={C}>
          <div className="mb-12">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9ca3af] font-mono mb-5">03 · AI PROCESSING PIPELINE</div>
            <h2 className="font-extrabold text-[#111827] leading-tight tracking-tight mb-4" style={{ fontSize: "clamp(28px, 3.2vw, 44px)" }}>
              From raw tender notices<br />
              <span className="text-[#1d4ed8]">to structured decision intelligence.</span>
            </h2>
            <p className="text-lg text-[#6b7280] max-w-xl">
              Seven AI processing layers transform raw government documents
              into computable procurement intelligence. Click any stage to explore.
            </p>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-sm">
            <IntelligencePipeline />
          </div>
        </div>
      </section>

      {/* BID INTELLIGENCE ENGINE - Spacing: 96px */}
      <section id="intelligence" className="bg-white border-b border-[#e5e7eb] py-28">
        <div className={C}>
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-24 items-center">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9ca3af] font-mono mb-8">04 · BID INTELLIGENCE ENGINE</div>
              <div className="mb-8">
                <div className="font-extrabold text-[#111827] leading-[1.0] tracking-tight" style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>
                  NOT A LIST<br />OF TENDERS.
                </div>
                <div className="mt-4 font-light text-[#374151] leading-[1.0] tracking-tight" style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>
                  A PROCUREMENT<br />DECISION ENGINE.
                </div>
              </div>
              <p className="text-lg text-[#6b7280] leading-relaxed mb-8 max-w-lg">
                The engine cross-references your Company Digital Twin against every tender requirement —
                turnover, experience, certifications, geography, MSME status — and returns
                a decision with a cited rationale, not a list.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  "EMD waiver detection — Udyam Rule 170 & GFR 2017",
                  "Make in India Class-I / Class-II supplier classification",
                  "L1 price discovery from historical procurement records",
                  "CVC integrity compliance and NIT clause risk analysis",
                  "QCBS vs. L1 evaluation strategy optimisation",
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#374151]">
                    <ShieldCheck className="w-4 h-4 text-[#15803d] mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="inline-flex items-center gap-2 font-semibold bg-[#1d4ed8] text-white px-6 py-3.5 rounded-lg hover:bg-[#1e40af] transition-colors text-sm">
                Open Bid Intelligence <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Decision diagram */}
            <div className="flex items-center justify-center py-8">
              <BidDecisionEngine />
            </div>
          </div>
        </div>
      </section>

      {/* LIVE NETWORK CONSOLE - Spacing: 96px */}
      <section className="bg-[#060c1a] border-b border-[#1e293b] py-28">
        <div className={C}>
          <div className="mb-10">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#334155] font-mono mb-5">05 · LIVE PROCUREMENT NETWORK</div>
            <h2 className="font-extrabold text-white leading-tight tracking-tight" style={{ fontSize: "clamp(28px, 3.5vw, 46px)" }}>
              The procurement network<br />
              <span className="text-[#60a5fa]">is live & continuously updating.</span>
            </h2>
          </div>
          <LiveConsole
            tenders={tendersState.status === "success" ? tendersState.data : []}
            isLoading={tendersState.status === "loading"}
            error={tendersState.status === "error" ? tendersState.message : null}
            lastUpdated={tendersState.status === "success" ? tendersState.lastUpdated : null}
            onRefresh={refreshTenders}
          />
        </div>
      </section>

      {/* API SECTION - Spacing: 96px */}
      <section id="api" className="bg-[#f8fafc] border-b border-[#e5e7eb] py-28">
        <div className={C}>
          <div className="grid lg:grid-cols-[5fr_7fr] gap-12 xl:gap-20 items-start">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9ca3af] font-mono mb-5">06 · PROCUREMENT API</div>
              <h2 className="font-extrabold text-[#111827] leading-tight tracking-tight mb-6" style={{ fontSize: "clamp(28px, 3.2vw, 44px)" }}>
                Procurement intelligence<br />
                <span className="text-[#1d4ed8]">becomes infrastructure.</span>
              </h2>
              <p className="text-lg text-[#6b7280] leading-relaxed mb-8">
                ERP platforms, CRMs, consulting firms and enterprise procurement teams use the TenderOS API
                to embed live tender data, AI bid scores, and market intelligence into their existing workflows.
              </p>
              <div className="border border-[#e5e7eb] rounded-xl overflow-hidden bg-white mb-8">
                {[
                  { label: "REST API",       desc: "JSON · OAuth 2.0 · Rate limited" },
                  { label: "Webhook Events", desc: "New tender · Corrigendum · Award" },
                  { label: "Bulk Export",    desc: "CSV / JSONL for analytics pipelines" },
                  { label: "SLA",            desc: "99.9% uptime · High availability" },
                ].map((item, i, arr) => (
                  <div key={item.label} className={`flex items-center gap-4 px-5 py-4 ${i < arr.length - 1 ? "border-b border-[#f3f4f6]" : ""} hover:bg-[#f9fafb] transition-colors`}>
                    <span className="text-xs font-bold text-[#111827] w-32 flex-shrink-0">{item.label}</span>
                    <span className="text-sm text-[#6b7280]">{item.desc}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <Link href="/register" className="inline-flex items-center gap-2 font-semibold bg-[#1d4ed8] text-white px-6 py-3.5 rounded-lg hover:bg-[#1e40af] transition-colors text-sm">
                  Get API Key
                </Link>
                <a href="#" className="inline-flex items-center gap-1 text-sm font-semibold text-[#374151] hover:text-[#1d4ed8] transition-colors">
                  API Documentation <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            <APIArtifact />
          </div>
        </div>
      </section>

      {/* CTA SECTION - Spacing: 120px */}
      <section className="bg-[#0a0f1e] py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        <div className={`${C} relative`}>
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#334155] font-mono mb-8">
              07 · ENTER TENDEROS
            </div>
            <h2 className="font-extrabold text-white leading-tight tracking-tight mb-6" style={{ fontSize: "clamp(32px, 4.5vw, 58px)" }}>
              The procurement network<br />is already moving.
            </h2>
            <p className="text-[#64748b] text-xl mb-3">Make your next bid decision before it does.</p>
            <p className="text-[#334155] text-sm mb-14">
              Real-time central & state portal aggregation &middot; GFR 2017 & MSME Compliant
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link href="/register" className="inline-flex items-center gap-2 font-bold bg-white text-[#111827] px-10 py-4 rounded-xl hover:bg-[#f0f5ff] hover:text-[#1d4ed8] transition-all text-sm w-full sm:w-auto justify-center">
                Enter TenderOS <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard" className="inline-flex items-center gap-2 font-semibold text-[#475569] border border-[#1e293b] px-10 py-4 rounded-xl hover:bg-[#0f172a] transition-all text-sm w-full sm:w-auto justify-center">
                Explore Dashboard
              </Link>
            </div>
            <p className="text-[11px] text-[#334155]">
              No credit card required &nbsp;·&nbsp; Official Government of India data sources &nbsp;·&nbsp; GFR 2017 compliant
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER — Cleans up page bottom naturally */}
      <footer className="bg-white border-t border-[#e5e7eb]">
        <div className={`${C} py-16`}>
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded bg-[#1d4ed8] flex items-center justify-center">
                  <Landmark className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-bold text-[#111827]">TenderOS</span>
              </div>
              <p className="text-xs text-[#6b7280] max-w-xs leading-relaxed">
                India-first AI procurement intelligence platform.<br />
                GeM · CPPP · IREPS · Defence · State Portals · PSUs.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-12 text-xs">
              {[
                { title: "PLATFORM",     links: ["Dashboard", "Search", "Analytics", "Watchlist"] },
                { title: "INTELLIGENCE", links: ["AI Copilot", "Bid Analysis", "Market Data", "Predictions"] },
                { title: "COMPANY",      links: ["API Docs", "Privacy", "Terms", "Contact"] },
              ].map(col => (
                <div key={col.title}>
                  <div className="font-bold text-[#374151] mb-4 text-[10px] tracking-[0.14em] uppercase">{col.title}</div>
                  <ul className="space-y-2.5">
                    {col.links.map(l => (
                      <li key={l}><a href="#" className="text-[#6b7280] hover:text-[#111827] transition-colors">{l}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-6 border-t border-[#f3f4f6] flex flex-col md:flex-row items-center justify-between gap-2">
            <span className="text-[10px] text-[#9ca3af]">© {new Date().getFullYear()} TenderOS. All procurement data sourced from official Government of India portals.</span>
            <span className="text-[10px] text-[#9ca3af]">Forecasts are probabilistic. Competitor analysis uses public procurement records only.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
