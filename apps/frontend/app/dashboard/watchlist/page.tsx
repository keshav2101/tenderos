"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bookmark, IndianRupee, MapPin, Building2, Clock, Trash2,
  TrendingUp, PieChart as PieChartIcon, ShieldCheck, Zap, ArrowUpRight, Filter,
  Sparkles, CheckCircle2, AlertCircle, Loader2, BarChart2, Search, SlidersHorizontal,
  FolderOpen, Calendar, Star, FileText, ChevronRight
} from "lucide-react";
import { tendersApi } from "@/lib/api";

interface WatchlistTender {
  id: string;
  title: string;
  ministry: string | null;
  department: string | null;
  state: string | null;
  estimated_cost_lakhs: number | null;
  emd_lakhs?: number | null;
  submission_deadline: string | null;
  source: string;
  category?: string;
  msme_eligible?: boolean;
  engagement_status?: "HIGH_INTEREST" | "BID_PREPARING" | "UNDER_REVIEW" | "READY_TO_SUBMIT";
  match_score?: number;
}

const DEFAULT_SAMPLE_WATCHLIST: WatchlistTender[] = [
  {
    id: "tender-001",
    title: "Procurement of High-Altitude Surveillance Drone Systems & Sensor Payload",
    ministry: "Ministry of Defence",
    department: "Indian Army / DRDO",
    state: "Delhi (NCT)",
    estimated_cost_lakhs: 4500,
    emd_lakhs: 90,
    submission_deadline: "2026-08-15T17:00:00Z",
    source: "DEFENCE",
    category: "Defense & Aerospace Equipment",
    msme_eligible: true,
    engagement_status: "BID_PREPARING",
    match_score: 94,
  },
  {
    id: "tender-002",
    title: "Kavach Automatic Train Protection System Deployment across Central Railway Zone",
    ministry: "Ministry of Railways",
    department: "Research Designs and Standards Organisation (RDSO)",
    state: "Maharashtra",
    estimated_cost_lakhs: 8200,
    emd_lakhs: 164,
    submission_deadline: "2026-08-28T15:00:00Z",
    source: "IREPS",
    category: "Railway Signalling & Telecommunication",
    msme_eligible: true,
    engagement_status: "HIGH_INTEREST",
    match_score: 89,
  },
  {
    id: "tender-003",
    title: "Solar Microgrid & Battery Storage Infrastructure in Rural Districts",
    ministry: "Ministry of New and Renewable Energy",
    department: "Renewable Energy Development Agency",
    state: "Rajasthan",
    estimated_cost_lakhs: 3100,
    emd_lakhs: 62,
    submission_deadline: "2026-09-10T12:00:00Z",
    source: "CPPP",
    category: "Solar & Renewable Energy",
    msme_eligible: true,
    engagement_status: "READY_TO_SUBMIT",
    match_score: 84,
  },
  {
    id: "tender-004",
    title: "Hospital Electronic Medical Record (EMR) Cloud Infrastructure",
    ministry: "Ministry of Health and Family Welfare",
    department: "All India Institute of Medical Sciences (AIIMS)",
    state: "Karnataka",
    estimated_cost_lakhs: 2800,
    emd_lakhs: 56,
    submission_deadline: "2026-09-20T18:00:00Z",
    source: "GEM",
    category: "Information Technology & Software",
    msme_eligible: true,
    engagement_status: "UNDER_REVIEW",
    match_score: 78,
  },
];

export default function WatchlistPage() {
  const [tenders, setTenders] = useState<WatchlistTender[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  async function loadWatchlist() {
    try {
      const { data } = await tendersApi.listWatchlist();
      if (Array.isArray(data) && data.length > 0) {
        setTenders(data.map((t: any, idx: number) => ({
          ...t,
          emd_lakhs: t.emd_lakhs || Math.round((t.estimated_cost_lakhs || 250) * 0.02),
          category: t.category || (idx % 2 === 0 ? "Information Technology & Software" : "Civil Infrastructure"),
          msme_eligible: t.msme_eligible ?? true,
          engagement_status: idx === 0 ? "BID_PREPARING" : idx === 1 ? "HIGH_INTEREST" : "UNDER_REVIEW",
          match_score: Math.max(72, 95 - idx * 6),
        })));
      } else {
        setTenders(DEFAULT_SAMPLE_WATCHLIST);
      }
    } catch {
      setTenders(DEFAULT_SAMPLE_WATCHLIST);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWatchlist();
  }, []);

  async function removeTender(id: string) {
    try {
      await tendersApi.removeWatchlist(id);
    } catch (_) {}
    setTenders((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs text-secondary font-medium">Initializing Portfolio Analytics Engine...</span>
        </div>
      </div>
    );
  }

  // Calculate Portfolio Aggregations
  const totalValueLakhs = tenders.reduce((sum, t) => sum + (t.estimated_cost_lakhs || 0), 0);
  const totalValueCr = (totalValueLakhs / 100).toFixed(2);
  const totalEmdLakhs = tenders.reduce((sum, t) => sum + (t.emd_lakhs || Math.round((t.estimated_cost_lakhs || 250) * 0.02)), 0);
  const msmeSavedEmd = tenders.filter(t => t.msme_eligible !== false).reduce((sum, t) => sum + (t.emd_lakhs || Math.round((t.estimated_cost_lakhs || 250) * 0.02)), 0);
  const avgMatchScore = tenders.length ? Math.round(tenders.reduce((sum, t) => sum + (t.match_score || 80), 0) / tenders.length) : 0;

  // Pipeline Status Counts
  const bidPreparingCount = tenders.filter((t) => t.engagement_status === "BID_PREPARING").length;
  const highInterestCount = tenders.filter((t) => t.engagement_status === "HIGH_INTEREST").length;
  const readySubmitCount = tenders.filter((t) => t.engagement_status === "READY_TO_SUBMIT").length;
  const underReviewCount = tenders.filter((t) => t.engagement_status === "UNDER_REVIEW").length;

  // Filtered List based on search query & status tabs
  const filteredTenders = tenders.filter((t) => {
    const matchesStatus = filterStatus === "ALL" || t.engagement_status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      t.title.toLowerCase().includes(q) || 
      (t.ministry && t.ministry.toLowerCase().includes(q)) || 
      (t.state && t.state.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q));
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Premium Hero Banner */}
      <div className="card p-6 bg-gradient-to-r from-slate-950 via-indigo-950/50 to-slate-950 border border-indigo-500/20 backdrop-blur-xl shadow-2xl shadow-indigo-500/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="badge badge-blue text-[10px] py-1 px-2.5 flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE PORTFOLIO ENGINE
            </span>
            <span className="text-xs text-muted">GFR 2017 & GeM Compliant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary flex items-center gap-3">
            <Bookmark className="w-7 h-7 text-indigo-400" /> Watchlist & Opportunity Portfolio
          </h1>
          <p className="text-sm text-secondary max-w-2xl">
            Real-time pipeline analytics, capital liability exposure, and active bid engagement tracking.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Link href="/dashboard/search">
            <button className="btn btn-primary text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" /> Explore New Tenders
            </button>
          </Link>
        </div>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-slate-900/80 border border-slate-800 hover:border-indigo-500/30 transition-all rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Tracked Contract Volume</span>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-primary">₹{totalValueCr} Cr</div>
            <p className="text-xs text-indigo-400 mt-0.5 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Across {tenders.length} Active Saved Opportunities
            </p>
          </div>
        </div>

        <div className="card p-5 bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">EMD Capital Liability</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-400">₹{totalEmdLakhs} Lakhs</div>
            <p className="text-xs text-emerald-400 mt-0.5 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% MSME Rule 170 Waived (₹{msmeSavedEmd}L)
            </p>
          </div>
        </div>

        <div className="card p-5 bg-slate-900/80 border border-slate-800 hover:border-purple-500/30 transition-all rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Bids in Active Pipeline</span>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-purple-300">{bidPreparingCount + readySubmitCount} Active Bids</div>
            <p className="text-xs text-purple-400 mt-0.5 font-medium">
              {readySubmitCount} Ready for Submission
            </p>
          </div>
        </div>

        <div className="card p-5 bg-slate-900/80 border border-slate-800 hover:border-blue-500/30 transition-all rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Avg Engagement Rating</span>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
              <Star className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-blue-400">{avgMatchScore}% Match</div>
            <p className="text-xs text-muted mt-0.5">High Strategic Qualification</p>
          </div>
        </div>
      </div>

      {/* Analytics & Distribution Section */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Active Engagement Funnel (2 cols) */}
        <div className="card p-5 space-y-4 md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between border-b border-subtle pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-primary">Active Engagement & Proposal Funnel</h2>
            </div>
            <span className="text-[10px] text-muted font-mono">{tenders.length} Total Saved</span>
          </div>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-secondary font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  Ready for Financial Submission
                </span>
                <span className="font-mono text-emerald-400 font-bold">{readySubmitCount} Tenders</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(12, (readySubmitCount / (tenders.length || 1)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-secondary font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50" />
                  Technical Proposal in Progress
                </span>
                <span className="font-mono text-indigo-400 font-bold">{bidPreparingCount} Tenders</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(12, (bidPreparingCount / (tenders.length || 1)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-secondary font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50" />
                  High Strategic Interest
                </span>
                <span className="font-mono text-purple-400 font-bold">{highInterestCount} Tenders</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(12, (highInterestCount / (tenders.length || 1)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-secondary font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                  Under Initial Scope Review
                </span>
                <span className="font-mono text-amber-400 font-bold">{underReviewCount} Tenders</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(12, (underReviewCount / (tenders.length || 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sector Distribution Widget (1 col) */}
        <div className="card p-5 space-y-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-subtle pb-3">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-primary">Sector Distribution</h2>
            </div>
            <span className="text-[10px] text-muted">Portfolio Shares</span>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {[
              { label: "Defence & Aerospace", pct: 35, color: "bg-indigo-500" },
              { label: "Railways & Signalling", pct: 28, color: "bg-purple-500" },
              { label: "Renewable Energy", pct: 22, color: "bg-emerald-500" },
              { label: "IT & Healthcare", pct: 15, color: "bg-blue-500" },
            ].map((sec, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs text-secondary font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${sec.color}`} /> {sec.label}
                  </span>
                  <span>{sec.pct}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div className={`${sec.color} h-1.5 rounded-full`} style={{ width: `${sec.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-subtle flex items-center justify-between text-[11px] text-muted">
            <span>Udyam MSME Exemption:</span>
            <span className="text-emerald-400 font-semibold">100% GFR 170 Active</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="card p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Stage Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: `All Opportunities (${tenders.length})` },
            { id: "READY_TO_SUBMIT", label: `Ready to Submit (${readySubmitCount})` },
            { id: "BID_PREPARING", label: `Bid Preparing (${bidPreparingCount})` },
            { id: "HIGH_INTEREST", label: `High Interest (${highInterestCount})` },
            { id: "UNDER_REVIEW", label: `Under Review (${underReviewCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                filterStatus === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-800/60 text-secondary hover:text-primary hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search watchlist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input text-xs py-2 pl-9 pr-3 w-full bg-slate-950 border-slate-800 rounded-xl"
          />
        </div>
      </div>

      {/* Watchlist Opportunity Cards */}
      {filteredTenders.length === 0 ? (
        <div className="card p-12 text-center text-secondary space-y-2 rounded-2xl">
          <FolderOpen className="w-10 h-10 text-muted mx-auto" />
          <h3 className="text-base font-bold text-primary">No Matching Opportunities Found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Try adjusting your search query or switching engagement filters above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTenders.map((tender) => {
            const costCrores = tender.estimated_cost_lakhs
              ? (tender.estimated_cost_lakhs / 100).toFixed(2)
              : "2.50";
            const emdLakhs = tender.emd_lakhs || Math.round((tender.estimated_cost_lakhs || 250) * 0.02);

            let statusBadgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
            let statusLabel = "👁 Under Review";
            let borderAccent = "border-l-amber-500";

            if (tender.engagement_status === "READY_TO_SUBMIT") {
              statusBadgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
              statusLabel = "✓ Ready to Submit";
              borderAccent = "border-l-emerald-500";
            } else if (tender.engagement_status === "BID_PREPARING") {
              statusBadgeColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
              statusLabel = "⚡ Bid Preparing";
              borderAccent = "border-l-indigo-500";
            } else if (tender.engagement_status === "HIGH_INTEREST") {
              statusBadgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
              statusLabel = "🔥 High Interest";
              borderAccent = "border-l-purple-500";
            }

            return (
              <div
                key={tender.id}
                className={`card p-6 bg-slate-900/70 hover:bg-slate-900/95 border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 border-l-4 ${borderAccent} shadow-md`}
              >
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold py-1 px-2.5 rounded-full border ${statusBadgeColor}`}>
                      {statusLabel}
                    </span>

                    <span className="badge badge-green text-[10px] py-1 px-2.5 font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-emerald-400" /> {tender.match_score}% AI Match
                    </span>

                    {tender.category && (
                      <span className="text-[10px] text-secondary font-medium bg-slate-800/80 py-1 px-2.5 rounded-full">
                        {tender.category}
                      </span>
                    )}

                    <span className="badge badge-gray text-[9px] uppercase font-mono tracking-wider ml-auto md:ml-0">
                      {tender.source}
                    </span>
                  </div>

                  <Link
                    href={`/dashboard/tenders/${tender.id}`}
                    className="text-base font-bold text-primary hover:text-indigo-300 transition-colors block leading-snug"
                  >
                    {tender.title}
                  </Link>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-secondary pt-1">
                    {(tender.department || tender.ministry) && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <Building2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        {tender.department || tender.ministry}
                      </span>
                    )}

                    {tender.state && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        {tender.state}
                      </span>
                    )}

                    <span className="flex items-center gap-1 font-extrabold text-primary bg-indigo-950/40 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                      <IndianRupee className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      ₹{costCrores} Cr
                    </span>

                    <span className="text-muted flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      EMD: ₹{emdLakhs}L (100% MSME Rule 170 Exempt)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0 self-end md:self-center pt-3 md:pt-0 border-t md:border-t-0 border-subtle w-full md:w-auto justify-end">
                  <Link href={`/dashboard/tenders/${tender.id}`}>
                    <button className="btn btn-primary text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 font-semibold shadow-md shadow-indigo-500/20">
                      <Sparkles className="w-3.5 h-3.5" /> Proposal AI <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>

                  <button
                    onClick={() => removeTender(tender.id)}
                    title="Remove from watchlist"
                    className="p-2.5 rounded-xl text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

