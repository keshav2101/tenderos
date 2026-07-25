"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search, Zap, BarChart3, Shield, Brain, TrendingUp,
  ArrowRight, CheckCircle, Star, Globe, ChevronRight,
  FileText, Users, Award, Target
} from "lucide-react";

const STATS = [
  { label: "Active Tenders", value: "50,000+", icon: FileText },
  { label: "Ministries Covered", value: "52+", icon: Users },
  { label: "State Portals", value: "30+", icon: Globe },
  { label: "AI Extractions Daily", value: "10,000+", icon: Brain },
];

const FEATURES = [
  {
    icon: Brain,
    title: "AI Copilot",
    description: "Ask any question about any tender. Get cited answers from the source document — clause number, page reference, verbatim quote.",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: Target,
    title: "Bid Qualification Engine",
    description: "94% match score. Eligible. Turnover ✔. Experience ✔. EMD exempt. Missing: ISO 27001. Winning probability: 81%. Not just a recommendation — a decision.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: TrendingUp,
    title: "Market Intelligence",
    description: "Ministry spending trends. Category growth. Vendor market share. Procurement seasonality. 'Health typically releases diagnostic tenders in July–August.'",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Shield,
    title: "Company Digital Twin",
    description: "Upload your GST, ISO certificates, experience certificates. AI reads them. Your procurement profile is built automatically — never fill a form again.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: BarChart3,
    title: "Competitor Intelligence",
    description: "Who won similar tenders? At what price? What discount from estimate? Which ministries do they win from? Based entirely on public procurement records.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Zap,
    title: "Predictive Procurement",
    description: "Forecasts of likely upcoming tenders by ministry and category. Based on historical procurement cycles. Labeled as probabilistic — never presented as certain.",
    color: "from-yellow-500 to-amber-500",
  },
];

const QUALIFICATION_EXAMPLE = {
  tender: "AI-based Fraud Detection System — Ministry of Finance",
  score: 94,
  eligible: true,
  checks: [
    { label: "Category Match", status: "PASS", value: "AI / Data Analytics" },
    { label: "Turnover (₹50 Cr avg)", status: "PASS", value: "₹72.4 Cr avg ✔" },
    { label: "Experience (5 years)", status: "PASS", value: "8.2 years ✔" },
    { label: "EMD", status: "EXEMPT", value: "MSME Exempt ✔" },
    { label: "ISO 27001", status: "WARN", value: "Not in profile ⚠" },
  ],
  probability: 81,
  prep_hours: 4,
};

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#4ade80" : score >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" strokeWidth="8"
          stroke="rgba(255,255,255,0.06)" />
        <circle cx="64" cy="64" r={radius} fill="none" strokeWidth="8"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-secondary">Match</span>
      </div>
    </div>
  );
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const step = target / 60;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(Math.floor(current));
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count}{suffix}</>;
}

import { analyticsApi, searchApi } from "@/lib/api";

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [liveStats, setLiveStats] = useState({
    activeTenders: "50,000+",
    ministries: "52+",
    states: "30+",
    indexedToday: "240+",
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 1. Fetch live database statistics on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const { data } = await analyticsApi.overview();
        setLiveStats({
          activeTenders: data.total_active_tenders ? data.total_active_tenders.toLocaleString() : "52,410",
          ministries: data.active_ministries ? `${data.active_ministries}+` : "52+",
          states: data.active_states ? `${data.active_states}+` : "30+",
          indexedToday: data.tenders_indexed_today ? data.tenders_indexed_today.toString() : "240",
        });
      } catch (err) {
        console.error("Failed to load overview stats from API, using fallback", err);
      }
    }
    loadStats();
  }, []);

  // 2. Fetch live guest search results on typing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await searchApi.search({ q: searchQuery, limit: 5 });
        setSearchResults(data.hits || data.results || []);
      } catch (err) {
        console.error("Live search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const statsList = [
    { label: "Active Tenders", value: liveStats.activeTenders, icon: FileText },
    { label: "Ministries Covered", value: liveStats.ministries, icon: Users },
    { label: "State Portals", value: liveStats.states, icon: Globe },
    { label: "AI Extractions Today", value: liveStats.indexedToday, icon: Brain },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Background radial gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #4c51e8 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse, #7c3aed 0%, transparent 70%)" }} />
      </div>

      {/* ─── Navigation ─────────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6172f3, #a855f7)" }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-primary">TenderOS</span>
          <span className="badge badge-blue ml-1 text-[10px]">AI</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-secondary">
          <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="#intelligence" className="hover:text-primary transition-colors">Intelligence</Link>
          <Link href="/docs" className="hover:text-primary transition-colors">API Docs</Link>
          <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn btn-ghost text-sm">Sign in</Link>
          <Link href="/register" className="btn btn-primary text-sm">Start Free</Link>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-medium"
          style={{ background: "rgba(97,114,243,0.12)", border: "1px solid rgba(97,114,243,0.2)", color: "#818cf8" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live: Procurement intelligence feed updated in real time
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-primary leading-tight mb-6">
          Not another tender website.
          <br />
          <span className="gradient-text">An AI operating system</span>
          <br />
          for procurement.
        </h1>

        <p className="text-xl text-secondary max-w-3xl mx-auto mb-10 leading-relaxed">
          Read every government tender in India. Understand it. Predict it.
          <br className="hidden md:block" />
          Help your business win it.
        </p>

        {/* Search bar */}
        <div className="max-w-2xl mx-auto mb-4 relative">
          <div className="relative flex items-center gap-3 p-2 rounded-2xl"
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <Search className="w-5 h-5 text-muted ml-3 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search live GeM or CPPP tenders..."
              className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted outline-none py-2"
            />
            {isSearching && <span className="text-xs text-muted animate-pulse mr-2">Searching...</span>}
            <Link href={`/dashboard/search?q=${encodeURIComponent(searchQuery)}`}
              className="btn btn-primary px-5 flex-shrink-0">
              Search <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Guest Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-xl text-left overflow-hidden z-20 shadow-2xl border border-subtle"
              style={{ background: "var(--color-bg-card)" }}>
              <div className="p-2 border-b border-subtle bg-black/20 flex justify-between items-center">
                <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Live Matching Tenders</span>
                <span className="text-[10px] text-blue-400">Guest Access</span>
              </div>
              <div className="divide-y divide-subtle max-h-80 overflow-y-auto">
                {searchResults.map((hit: any) => (
                  <Link key={hit.tender_id} href={`/dashboard/tenders/${hit.tender_id}`}
                    className="block p-3 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="text-xs font-semibold text-primary line-clamp-1">{hit.title}</h4>
                        <p className="text-[10px] text-secondary mt-1">
                          {hit.ministry} · {hit.department}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-500/20 text-blue-400">
                        {hit.estimated_cost_lakhs ? `₹${hit.estimated_cost_lakhs} L` : "Open"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="p-2 border-t border-subtle bg-black/20 text-center">
                <Link href={`/dashboard/search?q=${encodeURIComponent(searchQuery)}`}
                  className="text-xs text-blue-400 font-semibold hover:underline">
                  View all results in Dashboard &rarr;
                </Link>
              </div>
            </div>
          )}
          
          <p className="text-xs text-muted mt-2">
            Try: "MeitY cloud" · "drones" · "Karanataka PWD road" · "defense cybersecurity"
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 mt-8">
          <Link href="/dashboard" className="btn btn-primary px-8 py-3 text-base">
            Launch Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/register" className="btn btn-secondary px-8 py-3 text-base">
            Free Account
          </Link>
        </div>
      </section>

      {/* ─── Stats ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsList.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card p-6 text-center group">
                <Icon className="w-6 h-6 mx-auto mb-3 text-muted group-hover:text-brand-400 transition-colors"
                  style={{ color: "#818cf8" }} />
                <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-xs text-secondary">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>


      {/* ─── Bid Qualification Demo ──────────────────────────────────────────── */}
      <section id="intelligence" className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="badge badge-green mb-4">Layer 6 — Bid Intelligence</div>
            <h2 className="text-4xl font-bold text-primary mb-6 leading-tight">
              Not "relevant tender."
              <br />
              <span className="gradient-text">Actionable intelligence.</span>
            </h2>
            <p className="text-secondary mb-8 leading-relaxed">
              The engine compares your company's Digital Twin against every tender requirement — 
              turnover, experience, certifications, geography — and gives you a decision, not a list.
            </p>
            <Link href="/dashboard" className="btn btn-primary">
              See your match scores <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Qualification card demo */}
          <div className="card p-6 animate-fade-in">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-muted mb-1">Ministry of Finance</p>
                <h3 className="text-sm font-semibold text-primary leading-tight">
                  {QUALIFICATION_EXAMPLE.tender}
                </h3>
              </div>
              <ScoreRing score={QUALIFICATION_EXAMPLE.score} />
            </div>

            <div className="space-y-2 mb-4">
              {QUALIFICATION_EXAMPLE.checks.map((check) => (
                <div key={check.label}
                  className="flex items-center justify-between py-2 px-3 rounded-lg"
                  style={{ background: "var(--color-bg-elevated)" }}>
                  <span className="text-xs text-secondary">{check.label}</span>
                  <span className={`text-xs font-medium ${
                    check.status === "PASS" ? "text-emerald-400" :
                    check.status === "EXEMPT" ? "text-blue-400" :
                    "text-amber-400"
                  }`}>{check.value}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-subtle">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{QUALIFICATION_EXAMPLE.probability}%</div>
                <div className="text-[10px] text-muted">Win Prob.</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{QUALIFICATION_EXAMPLE.prep_hours}h</div>
                <div className="text-[10px] text-muted">Prep Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">BID</div>
                <div className="text-[10px] text-muted">Recommendation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ──────────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary mb-4">11 Intelligence Layers</h2>
          <p className="text-secondary max-w-2xl mx-auto">
            From raw government PDFs to a procurement decision engine. Every layer adds intelligence.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title}
                className="card p-6 group hover:-translate-y-1 transition-transform duration-200">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 opacity-90 group-hover:opacity-100 transition-opacity`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── API CTA ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ background: "radial-gradient(ellipse at center, #6172f3 0%, transparent 70%)" }} />
          <div className="relative">
            <div className="badge badge-blue mb-4">Layer 11 — Procurement API</div>
            <h2 className="text-4xl font-bold text-primary mb-4">
              Highest-margin offering: the API.
            </h2>
            <p className="text-secondary max-w-2xl mx-auto mb-8">
              ERP vendors, CRMs, consulting firms, and enterprises integrate TenderOS directly 
              into their procurement workflows. Build on top of the data moat.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                "GET /tenders", "GET /ai-summary", "GET /eligibility-score",
                "GET /market-insights", "GET /predictions", "GET /semantic-search"
              ].map(endpoint => (
                <code key={endpoint}
                  className="text-xs px-3 py-1.5 rounded-lg font-mono"
                  style={{ background: "var(--color-bg-elevated)", color: "#818cf8", border: "1px solid var(--color-border)" }}>
                  {endpoint}
                </code>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-8">
              <Link href="/docs" className="btn btn-primary px-8">View API Docs</Link>
              <Link href="/register" className="btn btn-secondary px-8">Get API Key</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-subtle mt-12 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #6172f3, #a855f7)" }}>
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-primary">TenderOS</span>
            </div>
            <p className="text-xs text-muted">
              Data sourced from official government portals. All procurement data is publicly available.
              <br />Competitor intelligence uses only public procurement records. Forecasts are probabilistic, not guarantees.
            </p>
            <div className="flex items-center gap-4 text-xs text-secondary">
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="/docs" className="hover:text-primary transition-colors">API</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
