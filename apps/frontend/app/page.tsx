"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Search, ArrowRight, Landmark,
  Database, Brain, Activity, RefreshCw,
  Code, Webhook, FileText, Layers, Phone, Mail, Clock
} from "lucide-react";
import { useProcurementStats } from "@/hooks/useProcurementStats";
import { useLiveTenders } from "@/hooks/useLiveTenders";
import { usePortalStats } from "@/hooks/usePortalStats";
import { useLatestTender } from "@/hooks/useLatestTender";

const ProcurementTicker   = dynamic(() => import("@/app/components/landing/ProcurementTicker"),   { ssr: false });
const LiveNetworkStatus    = dynamic(() => import("@/app/components/landing/LiveNetworkStatus"),    { ssr: false });
const HeroArtifact         = dynamic(() => import("@/app/components/landing/HeroArtifact"),         { ssr: false });
const ProcurementNetworkGraph = dynamic(() => import("@/app/components/landing/ProcurementNetworkGraph"), { ssr: false });
const IntelligencePipeline = dynamic(() => import("@/app/components/landing/IntelligencePipeline"), { ssr: false });
const BidDecisionEngine    = dynamic(() => import("@/app/components/landing/BidDecisionEngine"),    { ssr: false });
const LiveConsole          = dynamic(() => import("@/app/components/landing/LiveConsole"),           { ssr: false });
const APIArtifact          = dynamic(() => import("@/app/components/landing/APIArtifact"),           { ssr: false });

// ── Fluid Responsive Width Container ─────────────────────────────────────
const C = "w-[min(100%-2.5rem,1440px)] mx-auto min-w-0";

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPortal, setSelectedPortal] = useState("All Portals");

  const { state: statsState, refresh: refreshStats } = useProcurementStats();
  const { state: tendersState, refresh: refreshTenders } = useLiveTenders(12);
  const { state: portalState } = usePortalStats();
  const { tender: latestTender, isLoading: isTenderLoading } = useLatestTender();

  return (
    <div className="min-h-screen bg-[#070b14] text-white overflow-x-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Top Live Ticker */}
      <ProcurementTicker />

      {/* Sticky Header Navbar */}
      <nav className="sticky top-0 z-30 bg-[#070b14]/90 backdrop-blur-md border-b border-[#1e293b]">
        <div className={`${C} h-16 flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#2563eb] flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              <Landmark className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-base text-white tracking-tight">TenderOS</span>
          </div>

          <div className="hidden xl:flex items-center gap-7 text-xs font-semibold text-[#94a3b8]">
            <a href="#platform" className="hover:text-white transition-colors">Platform</a>
            <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
            <a href="#resources" className="hover:text-white transition-colors">Resources</a>
            <a href="#developers" className="hover:text-white transition-colors">Developers</a>
            <a href="#company" className="hover:text-white transition-colors">Company</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono font-medium text-[#94a3b8] bg-[#0f172a] px-3 py-1 rounded-full border border-[#1e293b]">
              <LiveNetworkStatus />
            </div>
            <Link href="/login" className="text-xs font-semibold text-[#94a3b8] hover:text-white px-3 py-1.5 transition-colors whitespace-nowrap">Sign in</Link>
            <Link href="/register" className="text-xs font-semibold bg-[#2563eb] text-white px-4 py-2 rounded-lg hover:bg-[#1d4ed8] transition-colors whitespace-nowrap shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              Request Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-b from-[#0b0f19] via-[#070b14] to-[#04070d] border-b border-[#1e293b] py-10 lg:py-14 relative overflow-hidden">
        {/* Subtle radial background glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

        <div className={C}>
          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center min-w-0">

            {/* Left Hero Content */}
            <div className="min-w-0 space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 bg-[#1e1b4b]/80 text-[#818cf8] border border-[#4338ca]/50 font-mono text-[10px] font-bold tracking-wider px-3 py-1 rounded-full backdrop-blur-sm">
                <span>&#9733;</span> AI-POWERED PROCUREMENT INTELLIGENCE
              </div>

              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
                Win more<br />
                government tenders.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60a5fa] via-[#a78bfa] to-[#818cf8]">Intelligently.</span>
              </h1>

              <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed max-w-lg">
                India&apos;s most advanced AI platform that discovers, analyzes & scores every tender across 36+ government portals in real-time.
              </p>

              {/* Search Bar */}
              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-1.5 flex items-center gap-2 shadow-lg backdrop-blur-sm">
                <Search className="w-4 h-4 text-[#64748b] ml-2 flex-shrink-0" />
                <input
                  type="text" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") window.location.href = `/dashboard/search?q=${encodeURIComponent(searchQuery)}`; }}
                  placeholder="Search by ministry, department, keyword, tender ID..."
                  className="flex-1 min-w-0 text-xs text-white placeholder:text-[#64748b] bg-transparent outline-none py-1.5"
                />
                <select
                  value={selectedPortal}
                  onChange={e => setSelectedPortal(e.target.value)}
                  className="text-xs font-semibold text-[#94a3b8] bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hidden sm:block flex-shrink-0"
                >
                  <option value="All Portals">All Portals</option>
                  <option value="GeM">GeM</option>
                  <option value="CPPP">CPPP</option>
                  <option value="IREPS">IREPS</option>
                </select>
                <Link href={`/dashboard/search?q=${encodeURIComponent(searchQuery)}`}
                  className="text-xs font-semibold bg-[#2563eb] text-white px-4 py-2 rounded-lg hover:bg-[#1d4ed8] transition-colors flex items-center gap-1 flex-shrink-0 whitespace-nowrap shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                  Search
                </Link>
              </div>

              {/* Popular Tags */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#64748b]">
                <span className="font-semibold text-[#94a3b8]">Popular:</span>
                {["Road Construction", "IT Services", "Solar Projects", "Medical Equipment", "Security Services"].map(tag => (
                  <button key={tag} onClick={() => setSearchQuery(tag)} className="bg-[#1e293b]/70 hover:bg-[#334155] text-[#94a3b8] px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors border border-[#334155]/40">
                    {tag}
                  </button>
                ))}
              </div>

              {/* 4 Stat Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {[
                  { icon: Landmark, num: "36", label: "Portals" },
                  { icon: Database, num: "52+", label: "Ministries" },
                  { icon: Activity, num: "36", label: "States & UTs" },
                  { icon: Brain, num: "Live", label: "Network" },
                ].map(p => {
                  const Icon = p.icon;
                  return (
                    <div key={p.label} className="p-2.5 rounded-xl border border-[#1e293b] bg-[#0f172a]/80 flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#1e293b] text-[#60a5fa] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white">{p.num}</div>
                        <div className="text-[10px] text-[#94a3b8] font-medium truncate">{p.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Hero Visual */}
            <div className="w-full min-w-0 relative z-10">
              <HeroArtifact tender={latestTender} isLoading={isTenderLoading} />
            </div>

          </div>
        </div>
      </section>

      {/* 2. STATS BAND — Live Procurement Intelligence */}
      <section className="bg-[#0b0f19] border-b border-[#1e293b] py-8">
        <div className={C}>
          {statsState.status === "loading" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-5 rounded-xl border border-[#1e293b] bg-[#0f172a] space-y-2 animate-pulse">
                  <div className="h-4 w-20 bg-[#1e293b] rounded" />
                  <div className="h-7 w-28 bg-[#1e293b] rounded" />
                </div>
              ))}
            </div>
          ) : statsState.status === "success" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
              {[
                {
                  num: statsState.data.total_active_tenders.toLocaleString("en-IN") + "+",
                  label: "Active Tenders",
                  sub: "+2,340 today",
                  icon: Landmark,
                  color: "bg-[#1e293b] text-[#60a5fa]"
                },
                {
                  num: `${statsState.data.active_ministries}+`,
                  label: "Union Ministries",
                  sub: "Full coverage",
                  icon: Database,
                  color: "bg-[#1e293b] text-[#4ade80]"
                },
                {
                  num: (statsState.data.active_states > 0 ? statsState.data.active_states.toString() : "36") + "+",
                  label: "States & UTs",
                  sub: "Including autonomous bodies",
                  icon: Activity,
                  color: "bg-[#1e293b] text-[#a78bfa]"
                },
                {
                  num: statsState.data.tenders_indexed_today.toLocaleString("en-IN"),
                  label: "Indexed Today",
                  sub: "New opportunities",
                  icon: Brain,
                  color: "bg-[#1e293b] text-[#fb923c]"
                },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="p-5 rounded-2xl border border-[#1e293b] bg-[#0f172a]/90 flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#94a3b8] mb-1 truncate">{s.label}</div>
                      <div className="text-2xl font-extrabold text-white tracking-tight mb-1 truncate">{s.num}</div>
                      <div className="text-[11px] text-[#64748b] font-medium truncate">{s.sub}</div>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 ${s.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-[#1e293b] bg-[#0f172a] flex items-center justify-between text-xs text-[#94a3b8]">
              <span>Data temporarily unavailable.</span>
              <button onClick={refreshStats} className="text-[#60a5fa] font-bold flex items-center gap-1 hover:underline">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 3. MIDDLE SECTION 1: Procurement Network & AI Processing Pipeline */}
      <section className="py-10 border-b border-[#1e293b]">
        <div className={C}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch min-w-0">
            <ProcurementNetworkGraph />
            <IntelligencePipeline />
          </div>
        </div>
      </section>

      {/* 4. MIDDLE SECTION 2: Bid Intelligence Engine & Live Procurement Network */}
      <section className="py-10 border-b border-[#1e293b]">
        <div className={C}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch min-w-0">
            <BidDecisionEngine />
            <div className="flex flex-col justify-between min-w-0">
              <LiveConsole
                tenders={tendersState.status === "success" ? tendersState.data : []}
                isLoading={tendersState.status === "loading"}
                error={tendersState.status === "error" ? tendersState.message : null}
                lastUpdated={tendersState.status === "success" ? tendersState.lastUpdated : null}
                onRefresh={refreshTenders}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. MIDDLE SECTION 3: API Access & Developer Tools + Live API Console */}
      <section id="developers" className="py-10 border-b border-[#1e293b]">
        <div className={C}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch min-w-0">
            {/* Left Card: API Access & Developer Tools */}
            <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-2xl p-5 sm:p-6 shadow-md flex flex-col justify-between min-w-0">
              <div>
                <h3 className="text-base font-bold text-white mb-1">API Access &amp; Developer Tools</h3>
                <p className="text-xs text-[#94a3b8] mb-5">Powerful APIs and tools to integrate procurement intelligence</p>

                <div className="grid sm:grid-cols-2 gap-3 mb-5">
                  {[
                    { icon: Code, title: "REST API", desc: "Real-time access to tender data & analytics" },
                    { icon: Webhook, title: "Webhooks", desc: "Instant notifications for new opportunities" },
                    { icon: FileText, title: "Documentation", desc: "Complete API reference and guides" },
                    { icon: Layers, title: "SDKs & Libraries", desc: "Python, JavaScript, PHP and more" },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="p-3.5 rounded-xl border border-[#1e293b] bg-[#080d1a] min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#1e293b] text-[#60a5fa] flex items-center justify-center mb-2">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs font-bold text-white mb-1">{item.title}</h4>
                        <p className="text-[11px] text-[#94a3b8] leading-relaxed">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <Link href="/register" className="w-full inline-flex items-center justify-center gap-2 font-semibold bg-[#2563eb] text-white px-5 py-2.5 rounded-lg hover:bg-[#1d4ed8] transition-colors text-xs shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                  View API Documentation <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Card: Live API Console */}
            <div className="min-w-0">
              <APIArtifact />
            </div>
          </div>
        </div>
      </section>

      {/* 6. CTA BANNER */}
      <section className="py-10 border-b border-[#1e293b] bg-[#070b14]">
        <div className={C}>
          <div className="bg-gradient-to-r from-[#1e1b4b] via-[#1e293b] to-[#0f172a] border border-[#4338ca]/50 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 min-w-0 shadow-[0_0_30px_rgba(67,56,202,0.2)]">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center flex-shrink-0 shadow-lg">
                <Landmark className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-1">
                  Ready to transform your procurement?
                </h3>
                <p className="text-xs sm:text-sm text-[#94a3b8]">
                  Join 1000+ organizations already using TenderOS for smarter procurement decisions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href="/register" className="bg-white hover:bg-slate-100 text-[#0f172a] text-xs font-bold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-md">
                Request Demo
              </Link>
              <Link href="/dashboard" className="border border-[#4338ca] bg-[#1e1b4b]/60 hover:bg-[#1e1b4b] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer id="company" className="bg-[#030712] text-white border-t border-[#1e293b]">
        <div className={`${C} py-12 lg:py-16`}>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#2563eb] flex items-center justify-center shadow-md">
                  <Landmark className="w-4 h-4 text-white" />
                </div>
                <span className="font-extrabold text-base text-white tracking-tight">TenderOS</span>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed max-w-xs mb-4">
                India&apos;s most advanced AI-powered procurement intelligence platform.
              </p>

              <div className="flex items-center gap-3 text-[#64748b] text-xs">
                <a href="#" className="w-7 h-7 rounded-md bg-[#1e293b] flex items-center justify-center hover:text-white transition-colors">in</a>
                <a href="#" className="w-7 h-7 rounded-md bg-[#1e293b] flex items-center justify-center hover:text-white transition-colors">x</a>
                <a href="#" className="w-7 h-7 rounded-md bg-[#1e293b] flex items-center justify-center hover:text-white transition-colors">yt</a>
                <a href="#" className="w-7 h-7 rounded-md bg-[#1e293b] flex items-center justify-center hover:text-white transition-colors">ig</a>
              </div>
            </div>

            {[
              { title: "Platform", links: ["Features", "How It Works", "Pricing", "API Access"] },
              { title: "Solutions", links: ["For Government", "For PSUs", "For Enterprises", "For Consultants"] },
              { title: "Resources", links: ["Documentation", "API Reference", "Case Studies", "Blog"] },
              { title: "Company", links: ["About Us", "Careers", "Contact Us", "Privacy Policy"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">{col.title}</h4>
                <ul className="space-y-2 text-xs text-[#94a3b8]">
                  {col.links.map(l => (
                    <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Support</h4>
              <ul className="space-y-2.5 text-xs text-[#94a3b8]">
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#64748b]" />
                  <span>hello@tenderos.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#64748b]" />
                  <span>+91 22 1234 5678</span>
                </li>
                <li className="flex items-center gap-2 text-[11px] text-[#64748b]">
                  <Clock className="w-3.5 h-3.5 text-[#64748b]" />
                  <span>Mon - Fri: 9:00 AM - 6:00 PM IST</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748b]">
            <div>© {new Date().getFullYear()} TenderOS. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
