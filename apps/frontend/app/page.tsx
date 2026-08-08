"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search, Zap, BarChart3, Shield, Brain, TrendingUp,
  ArrowRight, CheckCircle, Globe, ChevronRight,
  FileText, Users, Award, Target, MapPin, Building2,
  ShieldCheck, Landmark, Activity, Database, Lock,
  RefreshCw, IndianRupee, Clock, Sparkles
} from "lucide-react";
import { analyticsApi } from "@/lib/api";

/* ─── Procurement Portal source list ────────────────────────────────────────── */
const PORTALS = ["GeM Portal", "CPPP", "IREPS", "Def Proc", "MahaGov", "Karnataka eProcure", "ONGC", "BHEL", "NTPC", "HAL"];

const FEATURES = [
  {
    icon: Brain,
    title: "AI Tender Copilot",
    description: "Ask any question about any NIT. Get answers cited from the source clause — verbatim quote, page reference, requirement status.",
    tag: "AI Analysis",
  },
  {
    icon: Target,
    title: "Bid Qualification Engine",
    description: "Turnover ✔ · Experience ✔ · EMD Exempt · ISO Missing. Automatic compliance scoring against your Digital Twin profile.",
    tag: "Eligibility",
  },
  {
    icon: TrendingUp,
    title: "Market Intelligence",
    description: "Ministry spending trends, vendor win-share, L1 price discovery, procurement seasonality. Competitor bid history from public records.",
    tag: "Intelligence",
  },
  {
    icon: Shield,
    title: "Company Digital Twin",
    description: "Upload GST, Udyam, ISO certificates. AI reads and structures your compliance profile. Never fill a form from scratch again.",
    tag: "Compliance",
  },
  {
    icon: BarChart3,
    title: "Predictive Procurement",
    description: "Forecast upcoming tenders by Ministry and Category based on multi-year procurement cycles. Probabilistic — never presented as certain.",
    tag: "Forecast",
  },
  {
    icon: MapPin,
    title: "India Geo-Intelligence",
    description: "Regional procurement activity mapped across all 36 States & UTs. Visualize tender density, contract value, and sector concentration.",
    tag: "Geospatial",
  },
];

const PORTALS_LIST = [
  { name: "Government e-Marketplace (GeM)", color: "bg-emerald-600", count: "18,240+" },
  { name: "CPPP (Central Public Procurement)", color: "bg-blue-700", count: "14,180+" },
  { name: "Indian Railways (IREPS)", color: "bg-orange-700", count: "6,320+" },
  { name: "Defence Procurement (DDP)", color: "bg-red-800", count: "4,920+" },
  { name: "State eProcurement (36 Portals)", color: "bg-violet-700", count: "9,100+" },
  { name: "PSUs (ONGC, BHEL, NTPC, IOCL)", color: "bg-slate-700", count: "7,500+" },
];

const QUALIFICATION_EXAMPLE = {
  tender: "AI-based Fraud Detection System — Ministry of Finance",
  score: 94,
  checks: [
    { label: "Category Match", status: "PASS", value: "AI / Data Analytics" },
    { label: "Turnover (₹50 Cr avg)", status: "PASS", value: "₹72.4 Cr avg ✔" },
    { label: "Experience (5 years)", status: "PASS", value: "8.2 years ✔" },
    { label: "EMD", status: "EXEMPT", value: "MSME Exempt (Udyam)" },
    { label: "ISO 27001", status: "WARN", value: "Not in profile ⚠" },
  ],
  probability: 81,
  prep_hours: 4,
};

const LIVE_FEED = [
  { time: "03:14", portal: "GeM", msg: "New tender detected — IT Services (₹18.4 Cr)", dot: "bg-emerald-500" },
  { time: "03:08", portal: "CPPP", msg: "Corrigendum issued — Deadline extended by 7 days", dot: "bg-blue-500" },
  { time: "02:56", portal: "Tamil Nadu eProcure", msg: "New Infrastructure tender published (₹124 Cr)", dot: "bg-violet-500" },
  { time: "02:42", portal: "IREPS", msg: "New Railway track inspection tender (₹42.8 Cr)", dot: "bg-orange-500" },
  { time: "02:19", portal: "Defence Proc.", msg: "High-value UAV Systems tender published", dot: "bg-red-600" },
];

/* ─── Score Ring ─────────────────────────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="6" stroke="#e5e7eb" />
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="6"
          stroke="#15803d" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.4s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-success">{score}</span>
        <span className="text-[9px] text-muted font-semibold">Match</span>
      </div>
    </div>
  );
}

/* ─── Landing Page ────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [liveStats, setLiveStats] = useState({
    activeTenders: "60,260",
    ministries: "52",
    states: "36",
    indexedToday: "284",
  });
  const [tickerIdx, setTickerIdx] = useState(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const { data } = await analyticsApi.overview();
        if (data?.total_active_tenders > 100) {
          setLiveStats({
            activeTenders: data.total_active_tenders.toLocaleString("en-IN"),
            ministries: data.active_ministries ? `${data.active_ministries}` : "52",
            states: "36",
            indexedToday: data.tenders_indexed_today?.toString() || "284",
          });
        }
      } catch { /* fallback */ }
    }
    loadStats();
  }, []);

  // Rotating portal ticker
  useEffect(() => {
    const t = setInterval(() => setTickerIdx(i => (i + 1) % PORTALS.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#111827]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ── Very subtle data-grid background ── */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

      {/* ─── Navigation ─────────────────────────────────────────────────────────── */}
      <nav className="relative z-20 border-b border-[#e5e7eb] bg-white/90 backdrop-blur-sm sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#1d4ed8] flex items-center justify-center">
              <Landmark className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-[#111827] tracking-tight">TenderOS</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] ml-0.5">INDIA</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-7 text-sm text-[#374151]">
            <a href="#platform" className="hover:text-[#111827] transition-colors">Platform</a>
            <a href="#portals" className="hover:text-[#111827] transition-colors">Portals</a>
            <a href="#intelligence" className="hover:text-[#111827] transition-colors">Intelligence</a>
            <a href="#api" className="hover:text-[#111827] transition-colors">API</a>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/login" className="text-sm text-[#374151] hover:text-[#111827] px-3 py-1.5 transition-colors">Sign in</Link>
            <Link href="/register" className="text-sm font-semibold bg-[#1d4ed8] text-white px-4 py-1.5 rounded-md hover:bg-[#1e40af] transition-colors">
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Live Portal Ticker Bar ────────────────────────────────────────────── */}
      <div className="relative z-10 bg-[#0f172a] text-[#94a3b8] text-xs py-2 border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-[#e2e8f0] font-mono text-[11px]">LIVE PROCUREMENT NETWORK</span>
          </div>
          <div className="hidden md:flex items-center gap-6 overflow-hidden">
            {LIVE_FEED.slice(0, 3).map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`} />
                <span className="text-[#64748b] font-mono">{f.time}</span>
                <span className="text-[#94a3b8] font-semibold">{f.portal}</span>
                <span className="text-[#64748b]">{f.msg}</span>
              </div>
            ))}
          </div>
          <div className="text-[#64748b] font-mono text-[10px] flex-shrink-0">
            Now indexing: <span className="text-[#94a3b8] font-semibold">{PORTALS[tickerIdx]}</span>
          </div>
        </div>
      </div>

      {/* ─── Hero ────────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: Headline */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold border"
              style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e40af" }}>
              <Building2 className="w-3.5 h-3.5" />
              India's Premier AI Procurement Intelligence Platform
            </div>

            <h1 className="text-5xl font-extrabold text-[#111827] leading-[1.1] tracking-tight mb-5">
              Win more government
              <br />
              <span className="text-[#1d4ed8]">tenders.</span> Intelligently.
            </h1>

            <p className="text-lg text-[#4b5563] leading-relaxed mb-8 max-w-lg">
              TenderOS aggregates, interprets and scores every NIT from GeM, CPPP, IREPS,
              Defence, and 36 state portals — giving your team a decisive edge in India's
              ₹18+ trillion government procurement market.
            </p>

            {/* Search bar */}
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-1.5 flex items-center gap-2 shadow-sm mb-4 max-w-lg">
              <Search className="w-4 h-4 text-[#9ca3af] ml-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tenders, categories, organisations…"
                className="flex-1 text-sm text-[#111827] placeholder:text-[#9ca3af] bg-transparent outline-none py-1.5"
              />
              <Link
                href={`/dashboard/search?q=${encodeURIComponent(searchQuery)}`}
                className="text-sm font-semibold bg-[#1d4ed8] text-white px-4 py-2 rounded-lg hover:bg-[#1e40af] transition-colors flex items-center gap-1.5"
              >
                Search <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <p className="text-xs text-[#9ca3af] mb-8">
              Try: "MeitY cloud services" · "Defence UAV procurement" · "Karnataka PWD road works"
            </p>

            <div className="flex items-center gap-3">
              <Link href="/dashboard"
                className="inline-flex items-center gap-2 font-semibold bg-[#1d4ed8] text-white px-6 py-2.5 rounded-lg hover:bg-[#1e40af] transition-colors text-sm">
                Launch Command Center <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/register"
                className="inline-flex items-center gap-2 font-semibold text-[#374151] bg-white border border-[#e5e7eb] px-6 py-2.5 rounded-lg hover:bg-[#f9fafb] transition-colors text-sm">
                Free Account
              </Link>
            </div>
          </div>

          {/* Right: Live Qualification Card */}
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-sm">
            {/* Card header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f3f4f6]">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-0.5">AI Bid Assessment</div>
                <h3 className="text-sm font-semibold text-[#111827] leading-snug max-w-xs">
                  {QUALIFICATION_EXAMPLE.tender}
                </h3>
              </div>
              <ScoreRing score={QUALIFICATION_EXAMPLE.score} />
            </div>

            {/* Compliance checks */}
            <div className="space-y-1.5 mb-4">
              {QUALIFICATION_EXAMPLE.checks.map((check) => (
                <div key={check.label}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-[#f9fafb] border border-[#f3f4f6]">
                  <span className="text-xs text-[#4b5563]">{check.label}</span>
                  <span className={`text-xs font-semibold ${check.status === "PASS" ? "text-[#15803d]" :
                    check.status === "EXEMPT" ? "text-[#1d4ed8]" : "text-[#b45309]"}`}>
                    {check.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom stats */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#f3f4f6]">
              <div className="text-center">
                <div className="text-xl font-bold text-[#15803d]">{QUALIFICATION_EXAMPLE.probability}%</div>
                <div className="text-[10px] text-[#9ca3af]">Win Probability</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-[#111827]">{QUALIFICATION_EXAMPLE.prep_hours}h</div>
                <div className="text-[10px] text-[#9ca3af]">Prep Time</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-[#1d4ed8]">BID</div>
                <div className="text-[10px] text-[#9ca3af]">AI Rec.</div>
              </div>
            </div>

            <div className="mt-3 p-2.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#15803d] flex-shrink-0" />
              <span className="text-xs text-[#14532d] font-medium">EMD waived — Udyam MSME Rule 170 applies</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Live KPI Strip ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-[#e5e7eb] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-0 grid grid-cols-2 md:grid-cols-4 divide-x divide-[#e5e7eb]">
          {[
            { label: "Active Tenders", value: liveStats.activeTenders, sub: "Across all portals", icon: FileText },
            { label: "Union Ministries", value: liveStats.ministries + "+", sub: "Covered live", icon: Landmark },
            { label: "States & UTs", value: liveStats.states, sub: "Full coverage", icon: MapPin },
            { label: "Indexed Today", value: liveStats.indexedToday, sub: "New extractions", icon: Activity },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-4 px-8 py-6">
                <Icon className="w-5 h-5 text-[#1d4ed8] opacity-70 flex-shrink-0" />
                <div>
                  <div className="text-2xl font-bold text-[#111827] font-mono tracking-tight">{s.value}</div>
                  <div className="text-xs text-[#6b7280] font-semibold mt-0.5">{s.label}</div>
                  <div className="text-[10px] text-[#9ca3af]">{s.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Portals Coverage ────────────────────────────────────────────────────── */}
      <section id="portals" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>
            <Database className="w-3.5 h-3.5" /> 60,000+ Live Tenders
          </div>
          <h2 className="text-3xl font-bold text-[#111827] mb-3">Every Indian government portal. One platform.</h2>
          <p className="text-[#6b7280] max-w-2xl mx-auto">
            Real-time aggregation across GeM, CPPP, IREPS, Defence Procurement, State eProcurement portals,
            and major PSUs — updated continuously, 24×7.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {PORTALS_LIST.map((p) => (
            <div key={p.name}
              className="bg-white border border-[#e5e7eb] rounded-xl p-5 flex items-center justify-between hover:border-[#1d4ed8]/30 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                <span className="text-sm font-semibold text-[#111827]">{p.name}</span>
              </div>
              <span className="text-xs font-mono font-bold text-[#1d4ed8]">{p.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Platform Features ───────────────────────────────────────────────────── */}
      <section id="platform" className="relative z-10 bg-white border-y border-[#e5e7eb] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>
              <Sparkles className="w-3.5 h-3.5" /> 11 Intelligence Layers
            </div>
            <h2 className="text-3xl font-bold text-[#111827] mb-3">Built for serious procurement professionals</h2>
            <p className="text-[#6b7280] max-w-2xl mx-auto">
              From raw government PDFs to a structured bid decision — every layer adds computable intelligence to your procurement operation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title}
                  className="border border-[#e5e7eb] rounded-xl p-5 bg-white hover:border-[#1d4ed8]/40 hover:-translate-y-0.5 transition-all duration-150 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#1d4ed8]" />
                    </div>
                    <span className="text-[10px] font-bold text-[#6b7280] bg-[#f9fafb] border border-[#e5e7eb] px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#111827] mb-1.5">{f.title}</h3>
                  <p className="text-xs text-[#6b7280] leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Intelligence Section ────────────────────────────────────────────────── */}
      <section id="intelligence" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
              style={{ background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>
              <Brain className="w-3.5 h-3.5" /> Bid Intelligence Engine
            </div>
            <h2 className="text-3xl font-bold text-[#111827] mb-4 leading-tight">
              Not a list of tenders.<br />
              <span className="text-[#1d4ed8]">A procurement decision engine.</span>
            </h2>
            <p className="text-[#4b5563] mb-6 leading-relaxed">
              The engine cross-references your company's Digital Twin against every tender requirement —
              turnover, experience, certifications, geography, MSME status — and gives you a decision, not a recommendation.
            </p>
            <ul className="space-y-2.5 mb-8">
              {[
                "EMD waiver detection — Udyam Rule 170 & GFR 2017",
                "Make in India Class-I / Class-II supplier classification",
                "L1 price discovery from historic procurement records",
                "CVC integrity compliance and NIT clause risk analysis",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-[#374151]">
                  <CheckCircle className="w-4 h-4 text-[#15803d] mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/dashboard"
              className="inline-flex items-center gap-2 font-semibold bg-[#1d4ed8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1e40af] transition-colors text-sm">
              Open Procurement Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Live feed card */}
          <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-6 text-[#e2e8f0]">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest font-mono">Live Procurement Feed</span>
              </div>
              <span className="text-[10px] text-[#64748b] font-mono">09 Aug 2026</span>
            </div>

            <div className="space-y-4">
              {LIVE_FEED.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center mt-1.5">
                    <span className={`w-2 h-2 rounded-full ${f.dot} flex-shrink-0`} />
                    {i < LIVE_FEED.length - 1 && <span className="w-px h-8 bg-[#1e293b] mt-1" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono text-[#64748b]">{f.time}</span>
                      <span className="text-[11px] font-bold text-[#e2e8f0]">{f.portal}</span>
                    </div>
                    <span className="text-xs text-[#94a3b8]">{f.msg}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-[#1e293b] flex items-center justify-between text-[10px] text-[#64748b] font-mono">
              <span>Sync interval: 4 minutes</span>
              <span className="flex items-center gap-1 text-emerald-400"><RefreshCw className="w-3 h-3" /> 36 portals active</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── API Section ─────────────────────────────────────────────────────────── */}
      <section id="api" className="relative z-10 bg-white border-y border-[#e5e7eb] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Code block */}
            <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] p-6 font-mono text-sm">
              <div className="flex items-center gap-1.5 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                <span className="text-[11px] text-[#64748b] ml-2">TenderOS REST API</span>
              </div>
              <div className="space-y-2 text-xs">
                <div><span className="text-[#64748b]">GET</span> <span className="text-[#60a5fa]">/v1/tenders</span> <span className="text-[#94a3b8]">?portal=gem&msme=true</span></div>
                <div><span className="text-[#64748b]">GET</span> <span className="text-[#60a5fa]">/v1/tenders/:id/ai-summary</span></div>
                <div><span className="text-[#64748b]">POST</span> <span className="text-[#60a5fa]">/v1/eligibility/score</span></div>
                <div><span className="text-[#64748b]">GET</span> <span className="text-[#60a5fa]">/v1/market/ministry-spend</span></div>
                <div><span className="text-[#64748b]">GET</span> <span className="text-[#60a5fa]">/v1/predictions/upcoming</span></div>
                <div className="pt-2 border-t border-[#1e293b]">
                  <span className="text-[#4ade80]">200 OK</span> <span className="text-[#94a3b8]">· 98ms · 1,840 results</span>
                </div>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
                style={{ background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>
                <Database className="w-3.5 h-3.5" /> Procurement API
              </div>
              <h2 className="text-3xl font-bold text-[#111827] mb-4 leading-tight">
                Integrate procurement intelligence into any system.
              </h2>
              <p className="text-[#4b5563] mb-6 leading-relaxed">
                ERP platforms, CRMs, consulting firms and enterprise procurement teams use the TenderOS API
                to embed live tender data directly into their existing workflows.
              </p>
              <div className="flex items-center gap-3">
                <Link href="/register"
                  className="inline-flex items-center gap-2 font-semibold bg-[#1d4ed8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1e40af] transition-colors text-sm">
                  Get API Key
                </Link>
                <Link href="/dashboard"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#374151] hover:text-[#111827] transition-colors">
                  View API Docs <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="bg-[#0f172a] rounded-2xl border border-[#1e293b] p-14 text-center relative overflow-hidden">
          {/* Very subtle data grid on CTA */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }} />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 bg-[#1e293b] text-[#60a5fa] border border-[#1e3a5f]">
              <Lock className="w-3.5 h-3.5" /> Trusted by procurement teams across India
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Start winning more government tenders.
            </h2>
            <p className="text-[#94a3b8] max-w-2xl mx-auto mb-8">
              TenderOS gives your team real-time access to every Indian government tender,
              AI-powered bid qualification, and the market intelligence to bid at the right price.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register"
                className="inline-flex items-center gap-2 font-bold bg-white text-[#111827] px-8 py-3 rounded-xl hover:bg-[#f9fafb] transition-colors text-sm w-full sm:w-auto justify-center">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard"
                className="inline-flex items-center gap-2 font-semibold text-[#94a3b8] border border-[#1e293b] px-8 py-3 rounded-xl hover:bg-[#1e293b] transition-colors text-sm w-full sm:w-auto justify-center">
                Explore Dashboard
              </Link>
            </div>
            <p className="text-xs text-[#475569] mt-5">
              No credit card required · Data sourced from official Government of India portals
            </p>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-[#e5e7eb] bg-white py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-[#1d4ed8] flex items-center justify-center">
                  <Landmark className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-[#111827]">TenderOS</span>
              </div>
              <p className="text-xs text-[#6b7280] max-w-xs leading-relaxed">
                India-first AI procurement intelligence platform.<br />
                Aggregating data from GeM, CPPP, IREPS, Defence, State portals and PSUs.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
              {[
                { title: "Platform", links: ["Dashboard", "Search", "Analytics", "Watchlist"] },
                { title: "Intelligence", links: ["AI Copilot", "Bid Analysis", "Market Data", "Predictions"] },
                { title: "Company", links: ["API Docs", "Privacy", "Terms", "Contact"] },
              ].map(col => (
                <div key={col.title}>
                  <div className="font-bold text-[#374151] mb-3 uppercase tracking-wider text-[10px]">{col.title}</div>
                  <ul className="space-y-2">
                    {col.links.map(l => (
                      <li key={l}><a href="#" className="text-[#6b7280] hover:text-[#111827] transition-colors">{l}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-[#e5e7eb] flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] text-[#9ca3af]">
            <span>© 2026 TenderOS. All procurement data sourced from official Government of India portals.</span>
            <span>Forecasts are probabilistic. Competitor analysis uses public procurement records only.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
