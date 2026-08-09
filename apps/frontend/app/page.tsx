"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Search, ArrowRight, Landmark, ChevronRight,
  Database, Brain, ShieldCheck, Activity, RefreshCw,
  Code, Webhook, FileText, Layers, Phone, Mail, Clock
} from "lucide-react";
import { useProcurementStats } from "@/hooks/useProcurementStats";
import { useLiveTenders } from "@/hooks/useLiveTenders";
import { usePortalStats } from "@/hooks/usePortalStats";
import { useLatestTender } from "@/hooks/useLatestTender";

const ProcurementTicker   = dynamic(() => import("@/app/components/landing/ProcurementTicker"),   { ssr: false });
const LiveNetworkStatus    = dynamic(() => import("@/app/components/landing/LiveNetworkStatus"),    { ssr: false });
const HeroArtifact         = dynamic(() => import("@/app/components/landing/HeroArtifact"),         { ssr: false });
const IntelligencePipeline = dynamic(() => import("@/app/components/landing/IntelligencePipeline"), { ssr: false });
const BidDecisionEngine    = dynamic(() => import("@/app/components/landing/BidDecisionEngine"),    { ssr: false });
const LiveConsole          = dynamic(() => import("@/app/components/landing/LiveConsole"),           { ssr: false });
const APIArtifact          = dynamic(() => import("@/app/components/landing/APIArtifact"),           { ssr: false });

// ── Outer Container with strict min-w-0 & max-w-[1360px] ───────────────────
const C = "mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8 xl:px-10 min-w-0";

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPortal, setSelectedPortal] = useState("All Portals");

  const { state: statsState, refresh: refreshStats } = useProcurementStats();
  const { state: tendersState, refresh: refreshTenders } = useLiveTenders(12);
  const { state: portalState } = usePortalStats();
  const { tender: latestTender, isLoading: isTenderLoading } = useLatestTender();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#111827] overflow-x-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Top Live Ticker */}
      <ProcurementTicker />

      {/* Sticky Header Navbar */}
      <nav className="sticky top-0 z-30 bg-white/96 backdrop-blur-sm border-b border-[#e2e8f0]">
        <div className={`${C} h-16 flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#1d4ed8] flex items-center justify-center">
              <Landmark className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-base text-[#111827] tracking-tight">TenderOS</span>
          </div>

          {/* Nav links */}
          <div className="hidden xl:flex items-center gap-6 text-xs font-semibold text-[#475569]">
            <a href="#platform" className="hover:text-[#111827] transition-colors">Platform</a>
            <a href="#solutions" className="hover:text-[#111827] transition-colors">Solutions</a>
            <a href="#resources" className="hover:text-[#111827] transition-colors">Resources</a>
            <a href="#developers" className="hover:text-[#111827] transition-colors">Developers</a>
            <a href="#company" className="hover:text-[#111827] transition-colors">Company</a>
            <a href="#pricing" className="hover:text-[#111827] transition-colors">Pricing</a>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/login" className="text-xs font-semibold text-[#374151] hover:text-[#111827] px-3 py-1.5 transition-colors whitespace-nowrap">Sign in</Link>
            <Link href="/register" className="text-xs font-semibold bg-[#1d4ed8] text-white px-4 py-2 rounded-lg hover:bg-[#1e40af] transition-colors whitespace-nowrap shadow-xs">
              Request Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="bg-white border-b border-[#e2e8f0] py-10 lg:py-14">
        <div className={C}>
          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center min-w-0">

            {/* Left Hero Content */}
            <div className="min-w-0 space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] font-mono text-[10px] font-bold tracking-wider px-3 py-1 rounded-full">
                <span>&#9733;</span> AI-POWERED PROCUREMENT INTELLIGENCE
              </div>

              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-[#111827] leading-[1.1] tracking-tight">
                Win more<br />
                government tenders.<br />
                <span className="text-[#1d4ed8]">Intelligently.</span>
              </h1>

              <p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed max-w-lg">
                India&apos;s most advanced AI platform that discovers, analyzes & scores every tender across 36+ government portals in real-time.
              </p>

              {/* Search Bar */}
              <div className="bg-white border border-[#e2e8f0] rounded-xl p-1.5 flex items-center gap-2 shadow-xs">
                <Search className="w-4 h-4 text-[#9ca3af] ml-2 flex-shrink-0" />
                <input
                  type="text" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") window.location.href = `/dashboard/search?q=${encodeURIComponent(searchQuery)}`; }}
                  placeholder="Search by ministry, department, keyword, tender ID..."
                  className="flex-1 min-w-0 text-xs text-[#111827] placeholder:text-[#9ca3af] bg-transparent outline-none py-1.5"
                />
                <select
                  value={selectedPortal}
                  onChange={e => setSelectedPortal(e.target.value)}
                  className="text-xs font-semibold text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-2 py-1.5 outline-none cursor-pointer hidden sm:block flex-shrink-0"
                >
                  <option value="All Portals">All Portals</option>
                  <option value="GeM">GeM</option>
                  <option value="CPPP">CPPP</option>
                  <option value="IREPS">IREPS</option>
                </select>
                <Link href={`/dashboard/search?q=${encodeURIComponent(searchQuery)}`}
                  className="text-xs font-semibold bg-[#1d4ed8] text-white px-4 py-2 rounded-lg hover:bg-[#1e40af] transition-colors flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                  Search
                </Link>
              </div>

              {/* Popular Tags */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#9ca3af]">
                <span className="font-semibold text-[#6b7280]">Popular:</span>
                {["Road Construction", "IT Services", "Solar Projects", "Medical Equipment", "Security Services"].map(tag => (
                  <button key={tag} onClick={() => setSearchQuery(tag)} className="bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] px-2 py-0.5 rounded text-[11px] font-medium transition-colors">
                    {tag}
                  </button>
                ))}
              </div>

              {/* Single Live Status Indicator Line */}
              <div className="pt-1">
                <LiveNetworkStatus />
              </div>

              {/* 4 Stat Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {[
                  { icon: Landmark, num: "36", label: "Portals" },
                  { icon: Database, num: "52+", label: "Ministries" },
                  { icon: Activity, num: "36", label: "States & UTs" },
                  { icon: Brain, num: "Live", label: "Network" },
                ].map(p => {
                  const Icon = p.icon;
                  return (
                    <div key={p.label} className="p-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-[#1d4ed8]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#111827]">{p.num}</div>
                        <div className="text-[10px] text-[#6b7280] font-medium truncate">{p.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Hero Card */}
            <div className="w-full min-w-0">
              <HeroArtifact tender={latestTender} isLoading={isTenderLoading} />
            </div>

          </div>
        </div>
      </section>

      {/* STATS BAND — Live Procurement Intelligence */}
      <section className="bg-white border-b border-[#e2e8f0] py-8">
        <div className={C}>
          {statsState.status === "loading" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] space-y-2 animate-pulse">
                  <div className="h-4 w-20 bg-[#e2e8f0] rounded" />
                  <div className="h-7 w-28 bg-[#e2e8f0] rounded" />
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
                  color: "bg-[#eff6ff] text-[#1d4ed8]"
                },
                {
                  num: `${statsState.data.active_ministries}+`,
                  label: "Union Ministries",
                  sub: "Full coverage",
                  icon: Database,
                  color: "bg-[#f0fdf4] text-[#16a34a]"
                },
                {
                  num: (statsState.data.active_states > 0 ? statsState.data.active_states.toString() : "36") + "+",
                  label: "States & UTs",
                  sub: "Including autonomous bodies",
                  icon: Activity,
                  color: "bg-[#f5f3ff] text-[#7c3aed]"
                },
                {
                  num: statsState.data.tenders_indexed_today.toLocaleString("en-IN"),
                  label: "Indexed Today",
                  sub: "New opportunities",
                  icon: Brain,
                  color: "bg-[#fff7ed] text-[#ea580c]"
                },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="p-5 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#6b7280] mb-1 truncate">{s.label}</div>
                      <div className="text-2xl font-extrabold text-[#111827] tracking-tight mb-1 truncate">{s.num}</div>
                      <div className="text-[11px] text-[#9ca3af] font-medium truncate">{s.sub}</div>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 ${s.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between text-xs text-[#6b7280]">
              <span>Data temporarily unavailable.</span>
              <button onClick={refreshStats} className="text-[#1d4ed8] font-bold flex items-center gap-1 hover:underline">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}
        </div>
      </section>

      {/* MIDDLE SECTION 1: Procurement Network Coverage + AI Processing Pipeline */}
      <section className="py-8 border-b border-[#e2e8f0]">
        <div className={C}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch min-w-0">

            {/* Left Card: Procurement Network Coverage */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between min-w-0">
              <div>
                <h3 className="text-base font-bold text-[#111827] mb-4">Procurement Network Coverage</h3>
                <div className="space-y-2.5 mb-5">
                  {[
                    { name: "Government e-Marketplace (GeM)", count: "18,240+", icon: "bg-[#16a34a]" },
                    { name: "Central Public Procurement Portal (CPPP)", count: "14,180+", icon: "bg-[#1d4ed8]" },
                    { name: "Indian Railways E-Procurement (IREPS)", count: "6,320+", icon: "bg-[#ea580c]" },
                    { name: "Defence Procurement Portal (DDP/MoD)", count: "4,920+", icon: "bg-[#dc2626]" },
                    { name: "State eProcurement (36 Portals)", count: "9,100+", icon: "bg-[#7c3aed]" },
                    { name: "PSUs (ONGC, BHEL, NTPC, IOCL, HAL)", count: "7,500+", icon: "bg-[#475569]" },
                  ].map(p => (
                    <div key={p.name} className="flex items-center justify-between p-2.5 rounded-xl border border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors text-xs min-w-0 gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.icon}`} />
                        <span className="font-semibold text-[#374151] truncate">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="font-mono font-bold text-[#111827]">{p.count}</span>
                        <span className="text-[9px] font-mono font-bold text-[#059669] bg-[#ecfdf5] px-1.5 py-0.5 rounded border border-[#a7f3d0]">● Live</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#f1f5f9]">
                <Link href="/dashboard" className="text-xs font-semibold text-[#1d4ed8] hover:underline inline-flex items-center gap-1">
                  View All 36+ Portals <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Card: AI Processing Pipeline */}
            <div className="min-w-0">
              <IntelligencePipeline />
            </div>

          </div>
        </div>
      </section>

      {/* MIDDLE SECTION 2: Bid Intelligence Engine + Live Procurement Network */}
      <section className="py-8 border-b border-[#e2e8f0]">
        <div className={C}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch min-w-0">

            {/* Left Card: Bid Intelligence Engine */}
            <div className="min-w-0">
              <BidDecisionEngine />
            </div>

            {/* Right Card: Live Procurement Network */}
            <div className="flex flex-col justify-between min-w-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-base font-bold text-[#111827]">Live Procurement Network</h3>
                <Link href="/dashboard" className="text-xs font-semibold text-[#1d4ed8] hover:underline flex items-center gap-1">
                  View All Tenders <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
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

      {/* MIDDLE SECTION 3: API Access & Developer Tools + Live API Console */}
      <section id="developers" className="py-8 border-b border-[#e2e8f0]">
        <div className={C}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch min-w-0">

            {/* Left Card: API Access & Developer Tools */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between min-w-0">
              <div>
                <h3 className="text-base font-bold text-[#111827] mb-4">API Access & Developer Tools</h3>

                <div className="grid sm:grid-cols-2 gap-3 mb-5">
                  {[
                    { icon: Code, title: "REST API", desc: "Real-time access to tender data and analytics" },
                    { icon: Webhook, title: "Webhooks", desc: "Instant notifications for new opportunities" },
                    { icon: FileText, title: "Documentation", desc: "Complete API reference and guides" },
                    { icon: Layers, title: "SDKs & Libraries", desc: "Python, JavaScript, PHP and more" },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="p-3.5 rounded-xl border border-[#f1f5f9] bg-[#f8fafc] min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#eff6ff] text-[#1d4ed8] flex items-center justify-center mb-2">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs font-bold text-[#111827] mb-1">{item.title}</h4>
                        <p className="text-[11px] text-[#6b7280] leading-relaxed">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <Link href="/register" className="w-full inline-flex items-center justify-center gap-2 font-semibold bg-[#1d4ed8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1e40af] transition-colors text-xs shadow-xs">
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

      {/* CTA BANNER */}
      <section className="py-8 border-b border-[#bfdbfe] bg-[#f0f9ff]">
        <div className={C}>
          <div className="bg-[#dbeafe] border border-[#bfdbfe] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 min-w-0">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#1d4ed8] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Landmark className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-extrabold text-[#111827] tracking-tight mb-1">
                  Ready to transform your procurement?
                </h3>
                <p className="text-xs text-[#475569]">
                  Join 1000+ organizations already using TenderOS for smarter procurement decisions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href="/register" className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap shadow-xs">
                Request Demo
              </Link>
              <Link href="/dashboard" className="border border-[#bfdbfe] bg-white hover:bg-[#f8fafc] text-[#1d4ed8] text-xs font-bold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="company" className="bg-[#0b1329] text-white border-t border-[#1e293b]">
        <div className={`${C} py-12 lg:py-16`}>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#1d4ed8] flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-white" />
                </div>
                <span className="font-extrabold text-base text-white tracking-tight">TenderOS</span>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed max-w-xs mb-4">
                India&apos;s most advanced AI-powered procurement intelligence platform.
              </p>

              {/* Social icons */}
              <div className="flex items-center gap-3 text-[#64748b] text-xs">
                <a href="#" className="w-7 h-7 rounded-md bg-[#1e293b] flex items-center justify-center hover:text-white transition-colors">in</a>
                <a href="#" className="w-7 h-7 rounded-md bg-[#1e293b] flex items-center justify-center hover:text-white transition-colors">x</a>
                <a href="#" className="w-7 h-7 rounded-md bg-[#1e293b] flex items-center justify-center hover:text-white transition-colors">yt</a>
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

            {/* Support column */}
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
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
