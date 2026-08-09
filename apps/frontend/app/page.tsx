"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Search, ArrowRight, Landmark, ChevronRight,
  Database, Brain, ShieldCheck, Activity, RefreshCw,
  Code, Webhook, FileText, Layers
} from "lucide-react";
import { useProcurementStats } from "@/hooks/useProcurementStats";
import { useLiveTenders } from "@/hooks/useLiveTenders";
import { usePortalStats } from "@/hooks/usePortalStats";
import { useLatestTender } from "@/hooks/useLatestTender";

const ProcurementTicker = dynamic(() => import("@/app/components/landing/ProcurementTicker"), { ssr: false });
const LiveNetworkStatus  = dynamic(() => import("@/app/components/landing/LiveNetworkStatus"),  { ssr: false });
const HeroArtifact       = dynamic(() => import("@/app/components/landing/HeroArtifact"),       { ssr: false });
const IntelligencePipeline = dynamic(() => import("@/app/components/landing/IntelligencePipeline"), { ssr: false });
const LiveConsole        = dynamic(() => import("@/app/components/landing/LiveConsole"),         { ssr: false });
const APIArtifact        = dynamic(() => import("@/app/components/landing/APIArtifact"),         { ssr: false });

// ── Standardized Enterprise Container — Equal Left & Right Margins ─────────
const C = "mx-auto w-full max-w-[1440px] px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20";

function DynamicPortalNetwork({ sources }: { sources: Array<{ name: string; count: number; color: string }> }) {
  const defaultNodes = [
    { cx: 250, cy: 70,  label: "CPPP",        count: "14,180+", color: "#1d4ed8" },
    { cx: 430, cy: 155, label: "GeM",          count: "18,240+", color: "#16a34a" },
    { cx: 430, cy: 345, label: "IREPS",        count: "6,320+",  color: "#ea580c" },
    { cx: 250, cy: 430, label: "State Portals",count: "9,100+",  color: "#7c3aed" },
    { cx: 70,  cy: 345, label: "PSUs",         count: "7,500+",  color: "#475569" },
    { cx: 70,  cy: 155, label: "Defence",      count: "4,920+",  color: "#dc2626" },
  ];

  const nodes = defaultNodes.map(node => {
    const found = sources.find(s => s.name.toLowerCase().includes(node.label.toLowerCase()) || node.label.toLowerCase().includes(s.name.toLowerCase()));
    return {
      ...node,
      count: found ? found.count.toLocaleString("en-IN") + "+" : node.count,
      color: found?.color || node.color,
    };
  });

  return (
    <svg viewBox="0 0 500 500" className="w-full h-full max-w-[460px] mx-auto" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <circle cx="250" cy="250" r="50" fill="#1d4ed8" opacity="0.06" />
      <circle cx="250" cy="250" r="34" fill="#1d4ed8" opacity="0.10" />
      <circle cx="250" cy="250" r="22" fill="#1d4ed8" />
      <text x="250" y="246" textAnchor="middle" fontSize="7" fontWeight="900" fill="white" letterSpacing="0.5">TENDER</text>
      <text x="250" y="258" textAnchor="middle" fontSize="7" fontWeight="900" fill="white" letterSpacing="0.5">OS</text>
      {nodes.map(n => (
        <g key={n.label}>
          <line x1="250" y1="250" x2={n.cx} y2={n.cy} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx={n.cx} cy={n.cy} r="34" fill="white" stroke={n.color} strokeWidth="2" className="shadow-sm" />
          <circle cx={n.cx} cy={n.cy} r="4" fill={n.color} />
          <text x={n.cx} y={n.cy + 22} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#374151">{n.label}</text>
          <text x={n.cx} y={n.cy + 34} textAnchor="middle" fontSize="7.5" fill="#9ca3af">{n.count}</text>
        </g>
      ))}
      <circle cx="250" cy="250" r="155" fill="none" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="5 5" />
    </svg>
  );
}

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPortal, setSelectedPortal] = useState("All Portals");

  const { state: statsState, refresh: refreshStats } = useProcurementStats();
  const { state: tendersState, refresh: refreshTenders } = useLiveTenders(12);
  const { state: portalState } = usePortalStats();
  const { tender: latestTender, isLoading: isTenderLoading } = useLatestTender();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#111827]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Top Live Ticker */}
      <ProcurementTicker />

      {/* Sticky Header Navbar */}
      <nav className="sticky top-0 z-20 bg-white/96 backdrop-blur-sm border-b border-[#e2e8f0]">
        <div className={`${C} h-16 flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1d4ed8] flex items-center justify-center">
              <Landmark className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-[#111827] tracking-tight">TenderOS</span>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-xs font-semibold text-[#475569]">
            <a href="#platform" className="hover:text-[#111827] transition-colors">Platform</a>
            <a href="#solutions" className="hover:text-[#111827] transition-colors">Solutions</a>
            <a href="#resources" className="hover:text-[#111827] transition-colors">Resources</a>
            <a href="#api" className="hover:text-[#111827] transition-colors">Developers</a>
            <a href="#company" className="hover:text-[#111827] transition-colors">Company</a>
            <a href="#pricing" className="hover:text-[#111827] transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono font-medium text-[#475569] bg-[#f1f5f9] px-3 py-1 rounded-full border border-[#e2e8f0]">
              <LiveNetworkStatus />
            </div>
            <Link href="/login" className="text-xs font-semibold text-[#374151] hover:text-[#111827] px-3 py-1.5 transition-colors">Sign in</Link>
            <Link href="/register" className="text-xs font-semibold bg-[#1d4ed8] text-white px-4 py-2 rounded-lg hover:bg-[#1e40af] transition-colors whitespace-nowrap">
              Request Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION — 55% Content / 45% Intelligence Card */}
      <section className="relative bg-white border-b border-[#e2e8f0] py-16 lg:py-24">
        <div className={C}>
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 xl:gap-16 items-center">

            {/* Left Content */}
            <div>
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] font-mono text-[10px] font-bold tracking-wider px-3 py-1 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]" />
                AI-POWERED PROCUREMENT INTELLIGENCE
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-[#111827] leading-[1.1] tracking-tight mb-4">
                India&apos;s Most Advanced<br />
                <span className="text-[#1d4ed8]">AI Procurement</span><br />
                Intelligence Platform
              </h1>

              <p className="text-sm font-semibold text-[#374151] mb-3">
                Real-time discovery &middot; AI analysis &middot; Smart decisions
              </p>

              <p className="text-sm text-[#6b7280] leading-relaxed mb-8 max-w-lg">
                TenderOS transforms how organizations discover, analyze & respond to procurement opportunities across India.
              </p>

              {/* Search Bar with Portal Dropdown */}
              <div className="bg-white border border-[#e2e8f0] rounded-xl p-1.5 flex items-center gap-2 mb-4 shadow-sm">
                <Search className="w-4 h-4 text-[#9ca3af] ml-2 flex-shrink-0" />
                <input
                  type="text" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") window.location.href = `/dashboard/search?q=${encodeURIComponent(searchQuery)}`; }}
                  placeholder="Search tenders, departments, keywords…"
                  className="flex-1 text-xs text-[#111827] placeholder:text-[#9ca3af] bg-transparent outline-none py-2"
                />
                <select
                  value={selectedPortal}
                  onChange={e => setSelectedPortal(e.target.value)}
                  className="text-xs font-semibold text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hidden sm:block"
                >
                  <option value="All Portals">All Portals</option>
                  <option value="GeM">GeM</option>
                  <option value="CPPP">CPPP</option>
                  <option value="IREPS">IREPS</option>
                  <option value="Defence">Defence</option>
                </select>
                <Link href={`/dashboard/search?q=${encodeURIComponent(searchQuery)}`}
                  className="text-xs font-semibold bg-[#1d4ed8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1e40af] transition-colors flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap">
                  <Search className="w-3.5 h-3.5" /> Search
                </Link>
              </div>

              {/* Popular tags */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#9ca3af] mb-8">
                <span className="font-semibold text-[#6b7280]">Popular:</span>
                {["Road Construction", "IT Services", "Solar Projects", "Security Services"].map(tag => (
                  <button key={tag} onClick={() => setSearchQuery(tag)} className="bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors">
                    {tag}
                  </button>
                ))}
              </div>

              {/* Live Status Line — Strictly ONE Line on Desktop */}
              <div className="mb-6 py-1">
                <LiveNetworkStatus />
              </div>

              {/* 4 Mini Stat Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Landmark, num: "36", label: "Portals" },
                  { icon: Database, num: "52+", label: "Ministries" },
                  { icon: Activity, num: "36", label: "States & UTs" },
                  { icon: Brain, num: "Live", label: "Network" },
                ].map(p => {
                  const Icon = p.icon;
                  return (
                    <div key={p.label} className="p-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[#1d4ed8]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#111827]">{p.num}</div>
                        <div className="text-[10px] text-[#6b7280] font-medium">{p.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: AI Assessment Card */}
            <div className="w-full">
              <HeroArtifact tender={latestTender} isLoading={isTenderLoading} />
            </div>

          </div>
        </div>
      </section>

      {/* STATS BAND — Live Procurement Intelligence */}
      <section className="bg-white border-b border-[#e2e8f0] py-12">
        <div className={C}>
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#111827]">Live Procurement Intelligence</h2>
          </div>

          {statsState.status === "loading" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-6 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] space-y-3 animate-pulse">
                  <div className="h-4 w-20 bg-[#e2e8f0] rounded" />
                  <div className="h-8 w-28 bg-[#e2e8f0] rounded" />
                </div>
              ))}
            </div>
          ) : statsState.status === "success" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  num: statsState.data.total_active_tenders.toLocaleString("en-IN"),
                  label: "Active Tenders",
                  sub: "+2,340 today",
                  icon: Landmark,
                  color: "bg-[#eff6ff] text-[#1d4ed8]"
                },
                {
                  num: `${statsState.data.active_ministries}+`,
                  label: "Union Ministries",
                  sub: "All major ministries",
                  icon: Database,
                  color: "bg-[#f0fdf4] text-[#16a34a]"
                },
                {
                  num: statsState.data.active_states > 0 ? statsState.data.active_states.toString() : "36",
                  label: "States & UTs",
                  sub: "Across India",
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
                  <div key={s.label} className="p-6 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] hover:border-[#cbd5e1] transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-[#6b7280] mb-1">{s.label}</div>
                    <div className="text-2xl font-extrabold text-[#111827] tracking-tight mb-1">{s.num}</div>
                    <div className="text-[11px] text-[#9ca3af] font-medium">{s.sub}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between text-xs text-[#6b7280]">
              <span>Data temporarily unavailable.</span>
              <button onClick={refreshStats} className="text-[#1d4ed8] font-bold flex items-center gap-1 hover:underline">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}
        </div>
      </section>

      {/* PORTAL NETWORK COVERAGE */}
      <section className="bg-[#f8fafc] border-b border-[#e2e8f0] py-16 lg:py-20">
        <div className={C}>
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#111827] tracking-tight">Procurement Network Coverage</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center bg-white border border-[#e2e8f0] rounded-2xl p-8 shadow-sm">
            <div>
              <div className="space-y-3 mb-8">
                {[
                  { name: "Government e-Marketplace (GeM)", count: "18,240+", icon: "bg-[#16a34a]" },
                  { name: "Central Public Procurement Portal", count: "14,180+", icon: "bg-[#1d4ed8]" },
                  { name: "Indian Railways E-Procurement", count: "6,320+", icon: "bg-[#ea580c]" },
                  { name: "Defence Procurement Portal", count: "4,920+", icon: "bg-[#dc2626]" },
                  { name: "State Government Portals", count: "9,100+", icon: "bg-[#7c3aed]" },
                  { name: "PSU Procurement Portals", count: "7,500+", icon: "bg-[#475569]" },
                ].map(p => (
                  <div key={p.name} className="flex items-center justify-between p-3 rounded-xl border border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${p.icon}`} />
                      <span className="text-xs font-semibold text-[#374151]">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#111827]">{p.count}</span>
                      <span className="text-[9px] font-mono font-bold text-[#16a34a] bg-[#f0fdf4] px-1.5 py-0.5 rounded border border-[#bbf7d0]">● Live</span>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1d4ed8] hover:underline">
                View All 36 Portals <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Right Node Graph Visualization */}
            <div className="flex items-center justify-center p-4">
              <DynamicPortalNetwork sources={portalState.status === "success" ? portalState.data : []} />
            </div>
          </div>
        </div>
      </section>

      {/* AI PROCESSING PIPELINE */}
      <section id="platform" className="bg-[#f8fafc] border-b border-[#e2e8f0] py-16 lg:py-20">
        <div className={C}>
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#111827] tracking-tight">AI-Powered Analysis Pipeline</h2>
          </div>
          <IntelligencePipeline />
        </div>
      </section>

      {/* LIVE PROCUREMENT NETWORK TABLE */}
      <section className="bg-white border-b border-[#e2e8f0] py-16 lg:py-20">
        <div className={C}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#111827] tracking-tight">Live Procurement Network</h2>
            <Link href="/dashboard" className="text-xs font-semibold text-[#1d4ed8] hover:underline flex items-center gap-1">
              View All Bids <ArrowRight className="w-3.5 h-3.5" />
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
      </section>

      {/* API ACCESS & DEVELOPER TOOLS */}
      <section id="api" className="bg-[#f8fafc] border-b border-[#e2e8f0] py-16 lg:py-20">
        <div className={C}>
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#111827] tracking-tight">API Access & Developer Tools</h2>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 items-start">
            <div>
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Code, title: "REST API", desc: "Real-time access to tender data and analytics" },
                  { icon: Webhook, title: "Webhooks", desc: "Instant notifications for new opportunities" },
                  { icon: FileText, title: "Documentation", desc: "Complete API reference and guides" },
                  { icon: Layers, title: "SDKs & Libraries", desc: "Python, JavaScript, Go and more" },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="p-5 rounded-2xl border border-[#e2e8f0] bg-white">
                      <div className="w-8 h-8 rounded-xl bg-[#eff6ff] text-[#1d4ed8] flex items-center justify-center mb-3">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-[#111827] mb-1">{item.title}</h4>
                      <p className="text-[11px] text-[#6b7280] leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              <Link href="/register" className="inline-flex items-center gap-2 font-semibold bg-[#1d4ed8] text-white px-6 py-3 rounded-xl hover:bg-[#1e40af] transition-colors text-xs">
                View API Documentation <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Interactive API Console */}
            <APIArtifact />
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="bg-[#eff6ff] border-b border-[#bfdbfe] py-16">
        <div className={C}>
          <div className="bg-white border border-[#bfdbfe] rounded-2xl p-10 text-center shadow-sm max-w-4xl mx-auto">
            <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight mb-3">
              Ready to Transform Your Procurement?
            </h2>
            <p className="text-xs text-[#6b7280] mb-8 max-w-xl mx-auto">
              Join 1000+ organizations already using TenderOS for smarter procurement decisions.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/register" className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap">
                Request Demo
              </Link>
              <Link href="/dashboard" className="border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#374151] text-xs font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0f172a] text-white border-t border-[#1e293b]">
        <div className={`${C} py-16`}>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#1d4ed8] flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-base text-white tracking-tight">TenderOS</span>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed max-w-xs mb-4">
                India&apos;s most advanced AI procurement intelligence platform.
              </p>
              <div className="text-[11px] text-[#64748b]">
                Mon - Fri: 9:00 AM - 6:00 PM IST
              </div>
            </div>

            {[
              { title: "Platform", links: ["Features", "How It Works", "Pricing", "API Access"] },
              { title: "Solutions", links: ["For Government", "For PSUs", "For Enterprises", "For Consultants"] },
              { title: "Resources", links: ["Documentation", "API Reference", "Case Studies", "Blog"] },
              { title: "Company", links: ["About Us", "Careers", "Contact Us", "Privacy Policy"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-wider">{col.title}</h4>
                <ul className="space-y-2.5 text-xs text-[#94a3b8]">
                  {col.links.map(l => (
                    <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748b]">
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
