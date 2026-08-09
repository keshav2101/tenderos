"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Search, ArrowRight, Landmark,
  Database, Brain, Activity, RefreshCw,
  Code, Webhook, FileText, Layers, Phone, Mail, Clock, ArrowUpRight
} from "lucide-react";
import { useProcurementStats } from "@/hooks/useProcurementStats";
import { useLiveTenders } from "@/hooks/useLiveTenders";
import { usePortalStats } from "@/hooks/usePortalStats";
import { useLatestTender } from "@/hooks/useLatestTender";

const ProcurementTicker        = dynamic(() => import("@/app/components/landing/ProcurementTicker"),        { ssr: false });
const LiveNetworkStatus         = dynamic(() => import("@/app/components/landing/LiveNetworkStatus"),         { ssr: false });
const HeroArtifact              = dynamic(() => import("@/app/components/landing/HeroArtifact"),              { ssr: false });
const ProductFlowNarrative      = dynamic(() => import("@/app/components/landing/ProductFlowNarrative"),      { ssr: false });
const ProcurementNetworkGraph   = dynamic(() => import("@/app/components/landing/ProcurementNetworkGraph"),   { ssr: false });
const IntelligencePipeline      = dynamic(() => import("@/app/components/landing/IntelligencePipeline"),     { ssr: false });
const CompanyDigitalTwinView    = dynamic(() => import("@/app/components/landing/CompanyDigitalTwinView"),    { ssr: false });
const BidDecisionEngine          = dynamic(() => import("@/app/components/landing/BidDecisionEngine"),        { ssr: false });
const OutcomeComparison         = dynamic(() => import("@/app/components/landing/OutcomeComparison"),         { ssr: false });
const AICopilotDemo             = dynamic(() => import("@/app/components/landing/AICopilotDemo"),             { ssr: false });
const ProposalGeneratorFlow     = dynamic(() => import("@/app/components/landing/ProposalGeneratorFlow"),     { ssr: false });
const CorrigendumIntelligence   = dynamic(() => import("@/app/components/landing/CorrigendumIntelligence"),   { ssr: false });
const LiveConsole               = dynamic(() => import("@/app/components/landing/LiveConsole"),               { ssr: false });
const TrustVerificationSection  = dynamic(() => import("@/app/components/landing/TrustVerificationSection"),  { ssr: false });
const APIArtifact               = dynamic(() => import("@/app/components/landing/APIArtifact"),               { ssr: false });

// ── Official Responsive Layout Container ──────────────────────────────────
const C = "w-[min(calc(100%-48px),1440px)] mx-auto min-w-0";

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPortal, setSelectedPortal] = useState("All Portals");

  const { state: statsState, refresh: refreshStats } = useProcurementStats();
  const { state: tendersState, refresh: refreshTenders } = useLiveTenders(12);
  const { state: portalState } = usePortalStats();
  const { tender: latestTender, isLoading: isTenderLoading } = useLatestTender();

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1F33] overflow-x-hidden" style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>

      {/* Top Live Ticker */}
      <ProcurementTicker />

      {/* Sticky Header Navbar */}
      <nav className="sticky top-0 z-30 bg-white border-b border-[#D9E1E8] shadow-2xs">
        <div className={`${C} h-16 flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded bg-[#12355B] flex items-center justify-center">
              <Landmark className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-[#12355B] tracking-tight">TenderOS</span>
          </div>

          <div className="hidden xl:flex items-center gap-8 text-xs font-semibold text-[#475569]">
            <a href="#platform" className="hover:text-[#12355B] transition-colors">Platform</a>
            <a href="#solutions" className="hover:text-[#12355B] transition-colors">Solutions</a>
            <a href="#resources" className="hover:text-[#12355B] transition-colors">Resources</a>
            <a href="#developers" className="hover:text-[#12355B] transition-colors">Developers</a>
            <a href="#company" className="hover:text-[#12355B] transition-colors">Company</a>
            <a href="#pricing" className="hover:text-[#12355B] transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-medium text-[#475569] bg-[#F1F5F9] px-3 py-1 rounded border border-[#D9E1E8]">
              <LiveNetworkStatus />
            </div>
            <Link href="/login" className="text-xs font-semibold text-[#334155] hover:text-[#12355B] px-3 py-1.5 transition-colors whitespace-nowrap">Sign in</Link>
            <Link href="/register" className="text-xs font-bold bg-[#12355B] text-white px-4 py-2 rounded hover:bg-[#1F5A96] transition-colors whitespace-nowrap">
              Request Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="bg-white border-b border-[#D9E1E8] py-12 lg:py-16">
        <div className={C}>
          <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-14 items-center min-w-0">

            {/* Left Hero Content */}
            <div className="min-w-0 space-y-5">
              <div className="inline-flex items-center gap-2 bg-[#EAF6EF] text-[#18794E] border border-[#A7F3D0] font-mono text-[11px] font-bold tracking-wider px-3 py-1 rounded">
                <span>&#9679;</span> NATIONAL PROCUREMENT INTELLIGENCE PLATFORM
              </div>

              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-[#0B1F33] leading-[1.12] tracking-tight">
                Win more government tenders.<br />
                <span className="text-[#1F5A96]">Intelligently.</span>
              </h1>

              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed max-w-xl">
                India&apos;s primary public-sector procurement infrastructure. Automated discovery, clause analysis, and MSME eligibility scoring across 36+ federal and state portals.
              </p>

              {/* Search Bar */}
              <div className="bg-[#F7F9FC] border border-[#D9E1E8] rounded p-1.5 flex items-center gap-2">
                <Search className="w-4 h-4 text-[#64748B] ml-2 flex-shrink-0" />
                <input
                  type="text" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") window.location.href = `/dashboard/search?q=${encodeURIComponent(searchQuery)}`; }}
                  placeholder="Search by ministry, department, keyword, tender ID..."
                  className="flex-1 min-w-0 text-xs text-[#0B1F33] placeholder:text-[#64748B] bg-transparent outline-none py-1.5"
                />
                <select
                  value={selectedPortal}
                  onChange={e => setSelectedPortal(e.target.value)}
                  className="text-xs font-semibold text-[#334155] bg-white border border-[#D9E1E8] rounded px-2.5 py-1.5 outline-none cursor-pointer hidden sm:block flex-shrink-0"
                >
                  <option value="All Portals">All Portals</option>
                  <option value="GeM">GeM</option>
                  <option value="CPPP">CPPP</option>
                  <option value="IREPS">IREPS</option>
                </select>
                <Link href={`/dashboard/search?q=${encodeURIComponent(searchQuery)}`}
                  className="text-xs font-bold bg-[#1F5A96] text-white px-5 py-2 rounded hover:bg-[#12355B] transition-colors flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                  Search
                </Link>
              </div>

              {/* Popular Tags */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                <span className="font-semibold text-[#334155]">Popular Searches:</span>
                {["Road Construction", "IT Services", "Solar Projects", "Medical Equipment", "Security Services"].map(tag => (
                  <button key={tag} onClick={() => setSearchQuery(tag)} className="bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] px-2.5 py-1 rounded text-[11px] font-medium transition-colors border border-[#D9E1E8]">
                    {tag}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#12355B] text-white px-5 py-2.5 rounded hover:bg-[#1F5A96] transition-colors">
                  Explore Tenders <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link href="#platform" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F5A96] hover:text-[#12355B] px-4 py-2.5 rounded border border-[#D9E1E8] bg-white hover:bg-[#F1F5F9]">
                  View Platform <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Hero Dashboard Preview */}
            <div className="w-full min-w-0">
              <HeroArtifact tender={latestTender} isLoading={isTenderLoading} />
            </div>

          </div>
        </div>
      </section>

      {/* 2. STATS BAND — Full-width Statistics Surface */}
      <section className="bg-[#F1F5F9] border-b border-[#D9E1E8] py-8">
        <div className={C}>
          {statsState.status === "loading" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-5 rounded border border-[#D9E1E8] bg-white space-y-2 animate-pulse">
                  <div className="h-4 w-20 bg-[#E2E8F0] rounded" />
                  <div className="h-7 w-28 bg-[#E2E8F0] rounded" />
                </div>
              ))}
            </div>
          ) : statsState.status === "success" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
              {[
                {
                  num: statsState.data.total_active_tenders.toLocaleString("en-IN") + "+",
                  label: "Active Tenders",
                  sub: "+2,340 indexed today",
                  icon: Landmark,
                },
                {
                  num: `${statsState.data.active_ministries}+`,
                  label: "Union Ministries",
                  sub: "Full central coverage",
                  icon: Database,
                },
                {
                  num: (statsState.data.active_states > 0 ? statsState.data.active_states.toString() : "36") + "+",
                  label: "States & UTs",
                  sub: "Including PWD & SPVs",
                  icon: Activity,
                },
                {
                  num: statsState.data.tenders_indexed_today.toLocaleString("en-IN"),
                  label: "Indexed Today",
                  sub: "Verified opportunities",
                  icon: Brain,
                },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="p-5 rounded border border-[#D9E1E8] bg-white flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#475569] mb-1 truncate">{s.label}</div>
                      <div className="text-2xl font-extrabold text-[#0B1F33] tracking-tight mb-1 truncate">{s.num}</div>
                      <div className="text-[11px] text-[#64748B] font-medium truncate">{s.sub}</div>
                    </div>
                    <div className="w-10 h-10 rounded bg-[#F1F5F9] text-[#12355B] flex items-center justify-center flex-shrink-0 ml-2 border border-[#D9E1E8]">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded border border-[#D9E1E8] bg-white flex items-center justify-between text-xs text-[#475569]">
              <span>Data temporarily unavailable.</span>
              <button onClick={refreshStats} className="text-[#1F5A96] font-bold flex items-center gap-1 hover:underline">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 3. PRODUCT FLOW NARRATIVE */}
      <section className="py-12 border-b border-[#D9E1E8]">
        <div className={C}>
          <ProductFlowNarrative />
        </div>
      </section>

      {/* 4. INDIA PROCUREMENT NETWORK GRAPHIC */}
      <section className="py-12 border-b border-[#D9E1E8] bg-white">
        <div className={C}>
          <ProcurementNetworkGraph />
        </div>
      </section>

      {/* 5. AI PROCESSING PIPELINE */}
      <section className="py-12 border-b border-[#D9E1E8]">
        <div className={C}>
          <IntelligencePipeline />
        </div>
      </section>

      {/* 6. COMPANY DIGITAL TWIN */}
      <section className="py-12 border-b border-[#D9E1E8] bg-white">
        <div className={C}>
          <CompanyDigitalTwinView />
        </div>
      </section>

      {/* 7. BID INTELLIGENCE DECISION TREE */}
      <section className="py-12 border-b border-[#D9E1E8]">
        <div className={C}>
          <BidDecisionEngine />
        </div>
      </section>

      {/* 8. OUTCOME COMPARISON */}
      <section className="py-12 border-b border-[#D9E1E8] bg-white">
        <div className={C}>
          <OutcomeComparison />
        </div>
      </section>

      {/* 9. AI COPILOT PREVIEW */}
      <section className="py-12 border-b border-[#D9E1E8]">
        <div className={C}>
          <AICopilotDemo />
        </div>
      </section>

      {/* 10. PROPOSAL GENERATOR FLOW */}
      <section className="py-12 border-b border-[#D9E1E8] bg-white">
        <div className={C}>
          <ProposalGeneratorFlow />
        </div>
      </section>

      {/* 11. CORRIGENDUM INTELLIGENCE */}
      <section className="py-12 border-b border-[#D9E1E8]">
        <div className={C}>
          <CorrigendumIntelligence />
        </div>
      </section>

      {/* 12. LIVE PROCUREMENT NETWORK WATERFALL FEED */}
      <section className="py-12 border-b border-[#D9E1E8] bg-white">
        <div className={C}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0B1F33] tracking-tight">Live Procurement Network</h2>
              <p className="text-xs text-[#475569] mt-0.5">Real-time waterfall feed of verified government tenders published across India.</p>
            </div>
            <Link href="/dashboard" className="text-xs font-bold text-[#1F5A96] hover:underline flex items-center gap-1">
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

      {/* 13. TRUST & ENTERPRISE SECURITY */}
      <section className="py-12 border-b border-[#D9E1E8]">
        <div className={C}>
          <TrustVerificationSection />
        </div>
      </section>

      {/* 14. DEVELOPER API SECTION */}
      <section id="developers" className="py-12 border-b border-[#D9E1E8] bg-white">
        <div className={C}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch min-w-0">
            <div className="bg-white border border-[#D9E1E8] rounded p-6 shadow-2xs flex flex-col justify-between min-w-0">
              <div>
                <h3 className="text-base font-bold text-[#0B1F33] mb-1">API Access &amp; Developer Platform</h3>
                <p className="text-xs text-[#475569] mb-5">Enterprise REST APIs and webhooks for data integration</p>

                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  {[
                    { icon: Code, title: "REST API", desc: "Real-time access to tender data & analytics" },
                    { icon: Webhook, title: "Webhooks", desc: "Instant notifications for new opportunities" },
                    { icon: FileText, title: "Documentation", desc: "Complete API reference and integration guides" },
                    { icon: Layers, title: "SDKs & Libraries", desc: "Python, Node.js, Go and Java client SDKs" },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="p-4 rounded border border-[#D9E1E8] bg-[#F7F9FC] min-w-0">
                        <div className="w-7 h-7 rounded bg-[#12355B] text-white flex items-center justify-center mb-2.5">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs font-bold text-[#0B1F33] mb-1">{item.title}</h4>
                        <p className="text-[11px] text-[#475569] leading-relaxed">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <Link href="/register" className="w-full inline-flex items-center justify-center gap-2 font-bold bg-[#12355B] text-white px-5 py-2.5 rounded hover:bg-[#1F5A96] transition-colors text-xs">
                  View API Documentation <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="min-w-0">
              <APIArtifact />
            </div>
          </div>
        </div>
      </section>

      {/* 15. CTA BANNER */}
      <section className="py-12 border-b border-[#D9E1E8] bg-[#F1F5F9]">
        <div className={C}>
          <div className="bg-[#12355B] text-white rounded p-8 flex flex-col md:flex-row items-center justify-between gap-6 min-w-0 shadow-sm">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded bg-[#1F5A96] text-white flex items-center justify-center flex-shrink-0">
                <Landmark className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-1">
                  Ready to transform your procurement workflow?
                </h3>
                <p className="text-xs sm:text-sm text-[#E2E8F0]">
                  Join 1000+ public sector contractors and enterprises using TenderOS for intelligent bidding.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href="/register" className="bg-white hover:bg-slate-100 text-[#12355B] text-xs font-bold px-5 py-3 rounded transition-colors whitespace-nowrap">
                Request Demo
              </Link>
              <Link href="/dashboard" className="border border-white/30 bg-[#1F5A96] hover:bg-[#12355B] text-white text-xs font-bold px-5 py-3 rounded transition-colors whitespace-nowrap">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 16. FOOTER */}
      <footer id="company" className="bg-[#0B1F33] text-white border-t border-[#12355B]">
        <div className={`${C} py-12 lg:py-16`}>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded bg-[#1F5A96] flex items-center justify-center">
                  <Landmark className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="font-extrabold text-lg text-white tracking-tight">TenderOS</span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed max-w-xs mb-4">
                National procurement intelligence infrastructure for Indian government tenders, PSUs, and MSMEs.
              </p>

              <div className="flex items-center gap-3 text-[#64748B] text-xs">
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-7 h-7 rounded bg-[#12355B] flex items-center justify-center text-white hover:bg-[#1F5A96] transition-colors">in</a>
                <a href="https://x.com" target="_blank" rel="noreferrer" className="w-7 h-7 rounded bg-[#12355B] flex items-center justify-center text-white hover:bg-[#1F5A96] transition-colors">x</a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-7 h-7 rounded bg-[#12355B] flex items-center justify-center text-white hover:bg-[#1F5A96] transition-colors">yt</a>
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
                <ul className="space-y-2 text-xs text-[#94A3B8]">
                  {col.links.map(l => (
                    <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Support &amp; Legal</h4>
              <ul className="space-y-2.5 text-xs text-[#94A3B8]">
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>support@tenderos.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>+91 22 1234 5678</span>
                </li>
                <li className="flex items-center gap-2 text-[11px] text-[#64748B]">
                  <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Mon - Fri: 9:00 AM - 6:00 PM IST</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#12355B] flex flex-wrap items-center justify-between gap-4 text-xs text-[#94A3B8]">
            <div>© {new Date().getFullYear()} TenderOS Technologies. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Security Compliance</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
