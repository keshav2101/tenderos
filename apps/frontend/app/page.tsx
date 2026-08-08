"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Search, ArrowRight, Landmark, ChevronRight,
  Database, Brain, ShieldCheck, Activity
} from "lucide-react";
import { analyticsApi } from "@/lib/api";

// Lazy-load heavy components for performance
const ProcurementTicker = dynamic(
  () => import("@/app/components/landing/ProcurementTicker"),
  { ssr: false }
);
const HeroArtifact = dynamic(
  () => import("@/app/components/landing/HeroArtifact"),
  { ssr: false }
);
const IntelligencePipeline = dynamic(
  () => import("@/app/components/landing/IntelligencePipeline"),
  { ssr: false }
);
const BidDecisionEngine = dynamic(
  () => import("@/app/components/landing/BidDecisionEngine"),
  { ssr: false }
);
const LiveConsole = dynamic(
  () => import("@/app/components/landing/LiveConsole"),
  { ssr: false }
);
const APIArtifact = dynamic(
  () => import("@/app/components/landing/APIArtifact"),
  { ssr: false }
);

// Simplified India SVG outline for background
function IndiaSVGBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ opacity: 0.028 }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 600 700"
        className="absolute right-0 top-0 h-full w-auto"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          d="M300,20 L340,24 L380,18 L420,28 L450,22 L480,38 L500,60 L510,85
             L505,110 L515,135 L520,160 L510,185 L515,210 L505,235
             L490,258 L480,280 L465,300 L450,320 L438,342 L425,360
             L415,380 L405,400 L395,415 L385,428 L372,440 L358,450
             L345,462 L330,474 L318,488 L308,502 L298,516 L290,530
             L282,520 L272,506 L260,492 L248,478 L235,462 L220,448
             L205,434 L192,418 L180,402 L168,385 L155,368 L142,350
             L130,330 L118,310 L105,290 L92,268 L80,246 L70,222
             L62,198 L58,172 L60,148 L68,124 L80,102 L98,84 L118,68
             L140,54 L162,42 L188,34 L215,26 L245,20 L275,18 Z
             M345,462 L352,472 L358,486 L362,500 L360,512 L352,520 L342,526
             L335,520 L330,508 L330,496 L332,484 L336,474 Z
             M180,402 L165,420 L155,440 L148,458 L144,474 L148,488
             L158,496 L168,490 L176,478 L182,462 Z"
          className="text-[#111827]"
        />
        {/* Portal nodes */}
        {[
          { cx: 320, cy: 140, label: "CPPP" },
          { cx: 280, cy: 200, label: "GeM" },
          { cx: 390, cy: 220, label: "IREPS" },
          { cx: 200, cy: 300, label: "MahaGov" },
          { cx: 340, cy: 380, label: "Def Proc" },
          { cx: 260, cy: 440, label: "PSUs" },
        ].map(n => (
          <g key={n.label}>
            <circle cx={n.cx} cy={n.cy} r="4" fill="currentColor" className="text-[#1d4ed8]" />
            <text x={n.cx + 8} y={n.cy + 4} fontSize="9" fill="currentColor" className="text-[#1d4ed8]">{n.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    tenders: "60,260",
    ministries: "52",
    states: "36",
    indexed: "284",
  });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    analyticsApi.overview()
      .then(({ data }) => {
        if (data?.total_active_tenders > 100) {
          setStats({
            tenders: data.total_active_tenders.toLocaleString("en-IN"),
            ministries: data.active_ministries ? String(data.active_ministries) : "52",
            states: "36",
            indexed: data.tenders_indexed_today?.toString() || "284",
          });
        }
      })
      .catch(() => {/* use fallback */});
  }, []);

  return (
    <div
      className="min-h-screen bg-[#f4f6f8] text-[#111827]"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SCENE 01 — THE NETWORK
          Bloomberg-style live procurement ticker
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ProcurementTicker />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Minimal Navbar — almost disappears into the page
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#1d4ed8] flex items-center justify-center">
              <Landmark className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-[#111827] tracking-tight">TenderOS</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe] leading-none">INDIA</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs text-[#374151]">
            <a href="#platform" className="hover:text-[#111827] transition-colors">Platform</a>
            <a href="#intelligence" className="hover:text-[#111827] transition-colors">Intelligence</a>
            <a href="#api" className="hover:text-[#111827] transition-colors">API</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-xs text-[#374151] hover:text-[#111827] px-3 py-1.5 transition-colors">Sign in</Link>
            <Link href="/register" className="text-xs font-semibold bg-[#1d4ed8] text-white px-3.5 py-1.5 rounded-md hover:bg-[#1e40af] transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SCENE 02 — THE DECLARATION
          Editorial hero: 96px headline + procurement dossier
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        ref={heroRef}
        className="relative min-h-[90vh] flex items-center overflow-hidden bg-white border-b border-[#e5e7eb]"
      >
        <IndiaSVGBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-20">
          <div className="grid lg:grid-cols-[1fr_460px] gap-16 items-center">

            {/* Left: Editorial headline */}
            <div>
              {/* Scene label */}
              <div className="flex items-center gap-2 mb-8">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af] font-mono">
                  01 · PROCUREMENT INTELLIGENCE
                </span>
                <span className="w-8 h-px bg-[#e5e7eb]" />
                <span className="text-[10px] font-mono text-[#c5cdd8]">India · ₹18+ trillion market</span>
              </div>

              {/* The headline */}
              <h1 className="editorial-hero mb-6 fade-up">
                WIN MORE<br />
                GOVERNMENT<br />
                <span className="text-[#1d4ed8]">TENDERS.</span>
              </h1>
              <h2 className="fade-up-1" style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 300, letterSpacing: "-0.02em", color: "#374151", lineHeight: 1.1, marginBottom: "2rem" }}>
                INTELLIGENTLY.
              </h2>

              <p className="text-base text-[#6b7280] leading-relaxed mb-8 max-w-md fade-up-2">
                India&apos;s premier AI procurement intelligence platform. Every NIT from GeM,
                CPPP, IREPS, Defence, and 36 state portals — read, understood, and scored for your business.
              </p>

              {/* Search bar */}
              <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-1 flex items-center gap-2 max-w-lg mb-3 fade-up-3 shadow-sm">
                <Search className="w-4 h-4 text-[#9ca3af] ml-2 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter")
                      window.location.href = `/dashboard/search?q=${encodeURIComponent(searchQuery)}`;
                  }}
                  placeholder="Search the procurement network…"
                  className="flex-1 text-sm text-[#111827] placeholder:text-[#9ca3af] bg-transparent outline-none py-2"
                />
                <Link
                  href={`/dashboard/search?q=${encodeURIComponent(searchQuery)}`}
                  className="text-xs font-semibold bg-[#1d4ed8] text-white px-4 py-2 rounded-lg hover:bg-[#1e40af] transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  Search <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <p className="text-[11px] text-[#9ca3af] mb-10 fade-up-3">
                GeM &middot; CPPP &middot; IREPS &middot; Defence Procurement &middot; 36 State Portals &middot; PSUs
              </p>

              {/* CTAs */}
              <div className="flex items-center gap-3 fade-up-3">
                <Link href="/dashboard"
                  className="inline-flex items-center gap-2 font-semibold bg-[#111827] text-white px-6 py-3 rounded-xl hover:bg-[#1d4ed8] transition-all duration-200 text-sm">
                  Enter Command Center <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/register"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#374151] border border-[#e5e7eb] bg-white px-6 py-3 rounded-xl hover:border-[#1d4ed8] hover:text-[#1d4ed8] transition-all duration-200">
                  Free Account <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right: Procurement dossier artifact */}
            <div className="fade-up-2 hidden lg:block">
              <HeroArtifact />
              {/* Floating annotation */}
              <div className="mt-3 flex items-center justify-end gap-2">
                <span className="text-[10px] font-mono text-[#9ca3af]">
                  Live · Generated 09 Aug 2026 04:14 IST · Source: CPPP
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SCENE 03 — THE SCALE
          Annual-report editorial statistics — no cards
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="border-b border-[#e5e7eb] bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-6 py-0">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#e5e7eb]">
            {[
              { num: stats.tenders, label: "ACTIVE TENDERS", sub: "Live across all portals", icon: Database },
              { num: stats.ministries + "+", label: "UNION MINISTRIES", sub: "Full procurement coverage", icon: Landmark },
              { num: stats.states, label: "STATES & UTs", sub: "Including autonomous bodies", icon: Activity },
              { num: stats.indexed, label: "INDEXED TODAY", sub: "New tenders extracted by AI", icon: Brain },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex flex-col justify-between px-6 py-8">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af] font-mono mb-3">{s.label}</div>
                    <div
                      className="font-extrabold text-[#111827] leading-none mb-1"
                      style={{ fontSize: "clamp(32px, 4vw, 52px)", fontVariantNumeric: "tabular-nums" }}
                    >
                      {s.num}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Icon className="w-3.5 h-3.5 text-[#9ca3af]" />
                    <span className="text-[11px] text-[#6b7280]">{s.sub}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SCENE 04 — THE COVERAGE
          Portal nodes — the procurement network map
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-white border-b border-[#e5e7eb] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af] font-mono mb-4">02 · PORTAL COVERAGE</div>
              <h2 className="text-4xl font-extrabold text-[#111827] leading-tight mb-4 tracking-tight">
                Every Indian<br />government portal.<br />
                <span className="text-[#1d4ed8]">One platform.</span>
              </h2>
              <p className="text-[#6b7280] leading-relaxed mb-8 max-w-sm">
                Real-time aggregation across central and state procurement portals,
                PSUs, Railways, Defence, and autonomous bodies. Updated continuously, 24×7.
              </p>

              {/* Portal list as data table */}
              <div className="space-y-0 border border-[#e5e7eb] rounded-xl overflow-hidden">
                {[
                  { name: "Government e-Marketplace (GeM)", count: "18,240+", color: "#16a34a" },
                  { name: "Central Public Procurement Portal (CPPP)", count: "14,180+", color: "#1d4ed8" },
                  { name: "Indian Railways (IREPS)", count: "6,320+", color: "#ea580c" },
                  { name: "Defence Procurement (DDP/MoD)", count: "4,920+", color: "#dc2626" },
                  { name: "State eProcurement (36 portals)", count: "9,100+", color: "#7c3aed" },
                  { name: "PSUs (ONGC, BHEL, NTPC, IOCL, HAL)", count: "7,500+", color: "#475569" },
                ].map((p, i, arr) => (
                  <div key={p.name}
                    className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? "border-b border-[#f3f4f6]" : ""} hover:bg-[#f9fafb] transition-colors`}>
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-sm text-[#374151]">{p.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#1d4ed8]">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Abstract network diagram */}
            <div className="relative">
              <svg viewBox="0 0 400 400" className="w-full max-w-sm mx-auto" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                {/* Center hub */}
                <circle cx="200" cy="200" r="38" fill="#1d4ed8" opacity="0.08" />
                <circle cx="200" cy="200" r="26" fill="#1d4ed8" opacity="0.12" />
                <circle cx="200" cy="200" r="16" fill="#1d4ed8" />
                <text x="200" y="196" textAnchor="middle" fontSize="6" fontWeight="800" fill="white" letterSpacing="0.05em">TENDER</text>
                <text x="200" y="207" textAnchor="middle" fontSize="6" fontWeight="800" fill="white" letterSpacing="0.05em">OS</text>

                {/* Portal nodes with spokes */}
                {[
                  { cx: 200, cy: 60, label: "CPPP", count: "14,180+", color: "#1d4ed8", angle: 0 },
                  { cx: 340, cy: 130, label: "GeM", count: "18,240+", color: "#16a34a", angle: 60 },
                  { cx: 340, cy: 270, label: "IREPS", count: "6,320+", color: "#ea580c", angle: 120 },
                  { cx: 200, cy: 340, label: "State Portals", count: "9,100+", color: "#7c3aed", angle: 180 },
                  { cx: 60, cy: 270, label: "PSUs", count: "7,500+", color: "#475569", angle: 240 },
                  { cx: 60, cy: 130, label: "Defence", count: "4,920+", color: "#dc2626", angle: 300 },
                ].map((n) => (
                  <g key={n.label}>
                    {/* Spoke */}
                    <line x1="200" y1="200" x2={n.cx} y2={n.cy} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3" />
                    {/* Node circle */}
                    <circle cx={n.cx} cy={n.cy} r="28" fill="white" stroke={n.color} strokeWidth="1.5" />
                    <circle cx={n.cx} cy={n.cy} r="4" fill={n.color} />
                    {/* Label */}
                    <text x={n.cx} y={n.cy + 18} textAnchor="middle" fontSize="7" fontWeight="700" fill="#374151">{n.label}</text>
                    <text x={n.cx} y={n.cy + 28} textAnchor="middle" fontSize="6" fill="#9ca3af">{n.count}</text>
                  </g>
                ))}

                {/* Orbit ring */}
                <circle cx="200" cy="200" r="120" fill="none" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SCENE 05 — THE INTELLIGENCE
          "From Noise to Decision" — interactive pipeline
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="platform" className="bg-[#f4f6f8] border-b border-[#e5e7eb] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af] font-mono mb-4">03 · AI PROCESSING PIPELINE</div>
            <h2 className="text-3xl font-extrabold text-[#111827] leading-tight tracking-tight mb-3">
              From 60,000 tenders<br />
              <span className="text-[#1d4ed8]">to one clear decision.</span>
            </h2>
            <p className="text-[#6b7280] max-w-xl">
              Seven AI processing layers transform raw government documents
              into computable procurement intelligence. Click any stage.
            </p>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden">
            <IntelligencePipeline />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SCENE 06 — THE ENGINE
          "NOT A LIST OF TENDERS." + animated decision diagram
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="intelligence" className="bg-white border-b border-[#e5e7eb] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af] font-mono mb-6">04 · BID INTELLIGENCE ENGINE</div>
              <div className="mb-6">
                <div className="text-[42px] font-extrabold text-[#111827] leading-[1.0] tracking-tight">
                  NOT A LIST<br />OF TENDERS.
                </div>
                <div className="mt-3 text-[42px] font-light text-[#374151] leading-[1.0] tracking-tight">
                  A PROCUREMENT<br />DECISION ENGINE.
                </div>
              </div>
              <p className="text-[#6b7280] leading-relaxed mb-6 max-w-md">
                The engine cross-references your Company Digital Twin against every tender requirement —
                turnover, experience, certifications, geography, MSME status — and returns
                a decision with a cited rationale, not a list.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  "EMD waiver detection — Udyam Rule 170 & GFR 2017",
                  "Make in India Class-I / Class-II supplier classification",
                  "L1 price discovery from 5 years of procurement records",
                  "CVC integrity compliance and NIT clause risk analysis",
                  "QCBS vs. L1 evaluation strategy optimisation",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#374151]">
                    <ShieldCheck className="w-4 h-4 text-[#15803d] mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard"
                className="inline-flex items-center gap-2 font-semibold bg-[#1d4ed8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1e40af] transition-colors text-sm">
                Open Bid Intelligence <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Animated SVG decision diagram */}
            <BidDecisionEngine />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SCENE 07 — THE NETWORK LIVE
          Full-width Bloomberg-style intelligence console
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-[#060c1a] border-b border-[#1e293b] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#334155] font-mono mb-4">05 · LIVE PROCUREMENT NETWORK</div>
            <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
              The procurement network<br />
              <span className="text-[#60a5fa]">is always moving.</span>
            </h2>
          </div>
          <LiveConsole />
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          API Section
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="api" className="bg-white border-b border-[#e5e7eb] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af] font-mono mb-4">06 · PROCUREMENT API</div>
              <h2 className="text-3xl font-extrabold text-[#111827] leading-tight tracking-tight mb-4">
                Procurement intelligence<br />
                <span className="text-[#1d4ed8]">becomes infrastructure.</span>
              </h2>
              <p className="text-[#6b7280] leading-relaxed mb-6">
                ERP platforms, CRMs, consulting firms and enterprise procurement teams use the TenderOS API
                to embed live tender data, AI bid scores, and market intelligence into their existing workflows.
              </p>
              <div className="space-y-2 mb-8">
                {[
                  { label: "REST API", desc: "JSON · OAuth 2.0 · Rate limited" },
                  { label: "Webhook Events", desc: "New tender · Corrigendum · Award" },
                  { label: "Bulk Export", desc: "CSV / JSONL for analytics pipelines" },
                  { label: "SLA", desc: "99.9% uptime · 4-minute sync interval" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 py-2 border-b border-[#f3f4f6]">
                    <span className="text-xs font-bold text-[#111827] w-28 flex-shrink-0">{item.label}</span>
                    <span className="text-xs text-[#6b7280]">{item.desc}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Link href="/register"
                  className="inline-flex items-center gap-2 font-semibold bg-[#1d4ed8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1e40af] transition-colors text-sm">
                  Get API Key
                </Link>
                <a href="#"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#374151] hover:text-[#1d4ed8] transition-colors">
                  API Documentation <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            <APIArtifact />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SCENE 08 — THE INVITATION
          "The procurement network is already moving."
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-[#0a0f1e] py-28 relative overflow-hidden">
        {/* Subtle data grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#334155] font-mono mb-8">
            08 · ENTER TENDEROS
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5">
            The procurement network<br />is already moving.
          </h2>
          <p className="text-[#64748b] text-lg mb-3">
            Make your next bid decision before it does.
          </p>
          <p className="text-[#334155] text-sm mb-12">
            60,000+ live tenders. 36 states. 52+ ministries. Real-time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link href="/register"
              className="inline-flex items-center gap-2 font-bold bg-white text-[#111827] px-8 py-3.5 rounded-xl hover:bg-[#f0f5ff] hover:text-[#1d4ed8] transition-all text-sm w-full sm:w-auto justify-center">
              Enter TenderOS <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dashboard"
              className="inline-flex items-center gap-2 font-semibold text-[#475569] border border-[#1e293b] px-8 py-3.5 rounded-xl hover:bg-[#0f172a] transition-all text-sm w-full sm:w-auto justify-center">
              Explore Dashboard
            </Link>
          </div>
          <p className="text-[11px] text-[#334155]">
            No credit card required &nbsp;·&nbsp; Official Government of India data sources &nbsp;·&nbsp; GFR 2017 compliant
          </p>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Footer — minimal, institutional
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="bg-white border-t border-[#e5e7eb] py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
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

            <div className="grid grid-cols-3 gap-10 text-xs">
              {[
                { title: "PLATFORM", links: ["Dashboard", "Search", "Analytics", "Watchlist"] },
                { title: "INTELLIGENCE", links: ["AI Copilot", "Bid Analysis", "Market Data", "Predictions"] },
                { title: "COMPANY", links: ["API Docs", "Privacy", "Terms", "Contact"] },
              ].map(col => (
                <div key={col.title}>
                  <div className="font-bold text-[#374151] mb-3 text-[10px] tracking-[0.12em] uppercase">{col.title}</div>
                  <ul className="space-y-2">
                    {col.links.map(l => (
                      <li key={l}><a href="#" className="text-[#6b7280] hover:text-[#111827] transition-colors">{l}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-6 border-t border-[#f3f4f6] flex flex-col md:flex-row items-center justify-between gap-2">
            <span className="text-[10px] text-[#9ca3af]">© 2026 TenderOS. All procurement data sourced from official Government of India portals.</span>
            <span className="text-[10px] text-[#9ca3af]">Forecasts are probabilistic. Competitor analysis uses public procurement records only.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
