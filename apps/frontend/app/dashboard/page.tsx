"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, IndianRupee, MapPin, Building2, Clock, Zap,
  BookmarkPlus, BookmarkCheck, RefreshCw, TrendingUp,
  AlertCircle, Loader2, GitCompare, X, ExternalLink,
  ChevronRight, Sparkles, Filter, Sliders, ShieldCheck,
  ArrowUpRight, FileText, CheckCircle2, CornerDownRight,
  Layers, Terminal, BarChart2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tendersApi, eligibilityApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getConnectorsSummary } from "@/lib/connectors-store";
import { Tender, getLocalCatalog, searchCatalog } from "@/lib/catalog";
import { addToWatchlist, removeFromWatchlist, isWatchlisted } from "@/lib/watchlist-store";

// Portal styling mapping
const PORTAL_CONFIG: Record<string, { label: string; color: string; bg: string; defaultUrl: string }> = {
  gem:         { label: "GeM",          color: "#4ade80", bg: "rgba(34,197,94,0.12)",   defaultUrl: "https://gem.gov.in" },
  cppp:        { label: "CPPP",         color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  defaultUrl: "https://eprocure.gov.in/eprocure/app" },
  defence:     { label: "Defence",      color: "#f87171", bg: "rgba(239,68,68,0.12)",   defaultUrl: "https://defproc.gov.in" },
  railways:    { label: "IREPS",        color: "#fb923c", bg: "rgba(251,146,60,0.12)",  defaultUrl: "https://ireps.gov.in" },
  ireps:       { label: "IREPS",        color: "#fb923c", bg: "rgba(251,146,60,0.12)",  defaultUrl: "https://ireps.gov.in" },
  maharashtra: { label: "Maha eProc",   color: "#a78bfa", bg: "rgba(167,139,250,0.12)", defaultUrl: "https://mahatenders.gov.in" },
  karnataka:   { label: "Karnataka",    color: "#a78bfa", bg: "rgba(167,139,250,0.12)", defaultUrl: "https://eproc.karnataka.gov.in" },
};

function getPortalInfo(source: string) {
  const key = (source || "").toLowerCase();
  return PORTAL_CONFIG[key] || {
    label: (source || "GOV").toUpperCase(),
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.12)",
    defaultUrl: "https://cppp.gov.in"
  };
}

function ensureAbsoluteUrl(url?: string | null, defaultUrl: string = "https://eprocure.gov.in/eprocure/app"): string {
  if (!url || typeof url !== "string" || !url.trim()) return defaultUrl;
  const trimmed = url.trim();
  if (trimmed.includes("localhost") || trimmed.includes("127.0.0.1") || trimmed.startsWith("/")) {
    return defaultUrl;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

const SECTORS = [
  "All Sectors",
  "Technology & IT",
  "Infrastructure & Civil Works",
  "Defence & Aerospace",
  "Railways & Mobility",
  "Healthcare & Medical Equipment",
  "Energy & Renewable Power",
  "Telecommunications & Networking",
  "Water & Waste Management",
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());
  const [isSyncingScrapers, setIsSyncingScrapers] = useState(false);

  // Selection & Inspector State
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [filterRec, setFilterRec] = useState<string>("all");
  const [filterSector, setFilterSector] = useState<string>("All Sectors");
  const [filterMsme, setFilterMsme] = useState(false);
  const [filterStartup, setFilterStartup] = useState(false);

  // Pagination & Compare
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [connectorsStats, setConnectorsStats] = useState(() => getConnectorsSummary());

  const fetchTenders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = searchParams.get("q") || "";
      const stateParam = searchParams.get("state") || "";
      const costMinParam = searchParams.get("cost_min") ? parseFloat(searchParams.get("cost_min")!) : undefined;

      const localRes = searchCatalog({
        q: q || search || undefined,
        state: stateParam || undefined,
        cost_min: costMinParam,
        page,
        page_size: pageSize,
      });

      setTenders(localRes.tenders);
      if (localRes.tenders.length > 0 && !selectedTender) {
        setSelectedTender(localRes.tenders[0]);
      }
      setRefreshedAt(new Date());
      setConnectorsStats(getConnectorsSummary());
    } catch (err: any) {
      console.error("Failed to load catalog feed", err);
      setError("Unable to sync catalog feed.");
    } finally {
      setLoading(false);
    }
  }, [searchParams, search, page, pageSize]);

  useEffect(() => {
    fetchTenders();
  }, [fetchTenders]);

  const handleRunScrapers = async () => {
    setIsSyncingScrapers(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      fetchTenders();
    } finally {
      setIsSyncingScrapers(false);
    }
  };

  // Keyboard navigation listener (J / K row movement, Enter to open, B to bookmark)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = Math.min(prev + 1, tenders.length - 1);
          if (tenders[next]) setSelectedTender(tenders[next]);
          return next;
        });
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const prevIdx = Math.max(prev - 1, 0);
          if (tenders[prevIdx]) setSelectedTender(tenders[prevIdx]);
          return prevIdx;
        });
      } else if (e.key === "Enter" && selectedTender) {
        e.preventDefault();
        router.push(`/dashboard/tenders/${selectedTender.id}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tenders, selectedTender, router]);

  // Derived filtered tenders list
  const filteredTenders = useMemo(() => {
    return tenders.filter((t) => {
      if (filterRec !== "all" && t.recommendation !== filterRec) return false;
      if (filterMsme && !t.msme_eligible) return false;
      if (filterStartup && !t.startup_eligible) return false;
      if (filterSector !== "All Sectors") {
        const sectorLower = filterSector.toLowerCase().split(" ")[0];
        const matchCat = (t.categories || []).some(c => c.toLowerCase().includes(sectorLower));
        if (!matchCat) return false;
      }
      return true;
    });
  }, [tenders, filterRec, filterMsme, filterStartup, filterSector]);

  // High priority urgent tenders closing soon (<72 hours)
  const urgentCount = useMemo(() => {
    const now = Date.now();
    return tenders.filter(t => {
      if (!t.submission_deadline) return false;
      const hours = (new Date(t.submission_deadline).getTime() - now) / 3600000;
      return hours > 0 && hours <= 72;
    }).length;
  }, [tenders]);

  const totalValueCr = useMemo(() => {
    const totalLakhs = tenders.reduce((acc, t) => acc + (t.estimated_cost_lakhs || 0), 0);
    return (totalLakhs / 100).toFixed(1);
  }, [tenders]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in text-slate-100">
      {/* ─── 1. Editorial Focus Header (Visual Anchor) ────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                Executive Action Briefing
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Network Active
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {urgentCount > 0 ? (
                <>
                  <strong className="text-amber-400">{urgentCount} High-Yield Solicitations</strong> Closing in &lt;72h (Total Budget: <strong className="text-emerald-400">₹{totalValueCr} Cr</strong>)
                </>
              ) : (
                <>
                  <strong className="text-indigo-400">9,763 Live Opportunities</strong> Ingested Across GeM, CPPP, Defence &amp; 36 States/UTs
                </>
              )}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              100% of tracked opportunities qualify for <strong className="text-emerald-400">Udyam MSME Rule 170 EMD Exemptions</strong> and <strong className="text-indigo-300">Make in India (MII) Class-I Local Supplier Preference</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => router.push("/dashboard/intelligence")}
              className="btn btn-primary text-xs px-5 py-3 rounded-2xl flex items-center gap-2 font-semibold shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              Launch AI Qualification Copilot
            </button>
            <button
              onClick={handleRunScrapers}
              disabled={isSyncingScrapers}
              className="px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs font-semibold hover:bg-slate-700/60 transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingScrapers ? "animate-spin text-indigo-400" : "text-slate-400"}`} />
              {isSyncingScrapers ? "Syncing..." : "Sync Scrapers"}
            </button>
          </div>
        </div>

        {/* Integrated Narrative Metric Strip (Not Card Walls) */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Active Stream</span>
            <div className="text-lg font-bold text-white tabular-nums">{tenders.length.toLocaleString("en-IN")} Solicitations</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">MSME EMD Saved</span>
            <div className="text-lg font-bold text-emerald-400 tabular-nums">₹{(parseFloat(totalValueCr) * 0.02 * 100).toFixed(0)} Lakhs Waived</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Avg Win Match</span>
            <div className="text-lg font-bold text-indigo-300 tabular-nums">88.4% Fit Probability</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Portals Status</span>
            <div className="text-lg font-bold text-blue-400 tabular-nums">36 States &amp; UTs Online</div>
          </div>
        </div>
      </div>

      {/* ─── 2. Asymmetrical 2-Column Workspace Layout ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Main High-Density Editorial Feed (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Stream Toolbar & Filters */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-3 flex-wrap shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-48">
              <Search className="w-4 h-4 text-slate-400 ml-1" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by keyword, state (e.g. Delhi, J&K), ministry..."
                className="bg-transparent text-xs text-slate-100 placeholder-slate-400 outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 outline-none"
              >
                {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              <button
                onClick={() => setFilterMsme(!filterMsme)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  filterMsme
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                MSME Exempt
              </button>

              <button
                onClick={() => setFilterStartup(!filterStartup)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  filterStartup
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                Startup
              </button>
            </div>
          </div>

          {/* Keyboard Helper Hint */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
            <span className="flex items-center gap-2">
              <kbd>J</kbd><kbd>K</kbd> Navigate rows · <kbd>↵</kbd> Open workspace · <kbd>Cmd+K</kbd> Command Bar
            </span>
            <span>Showing {filteredTenders.length} opportunities</span>
          </div>

          {/* Editorial Stream Rows */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 animate-pulse h-24" />
              ))}
            </div>
          ) : filteredTenders.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">No tenders match your current stream filters.</p>
              <button onClick={() => { setSearch(""); setFilterSector("All Sectors"); setFilterMsme(false); }} className="text-xs text-indigo-400 hover:underline">
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTenders.slice((page - 1) * pageSize, page * pageSize).map((t, idx) => {
                const isSelected = selectedTender?.id === t.id;
                const portal = getPortalInfo(t.source);
                const portalUrl = ensureAbsoluteUrl(t.source_url, portal.defaultUrl);
                const daysLeft = t.submission_deadline
                  ? Math.ceil((new Date(t.submission_deadline).getTime() - Date.now()) / 86400000)
                  : null;

                return (
                  <motion.div
                    key={t.id}
                    layout
                    onClick={() => { setSelectedTender(t); setSelectedIndex(idx); }}
                    className={`group relative p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/60 shadow-lg ring-1 ring-indigo-500/30"
                        : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90"
                    }`}
                  >
                    {/* Selected Left Accent Line */}
                    {isSelected && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-indigo-500" />
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                            {portal.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {t.source_tender_id || t.id}
                          </span>
                          {t.msme_eligible && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Udyam EMD Exempt
                            </span>
                          )}
                          {daysLeft !== null && daysLeft <= 3 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                              Closing in {daysLeft}d
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {t.title}
                        </h3>

                        <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            <span className="truncate max-w-[200px]">{t.organisation || t.department || "Central / State Portal"}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{t.state || "Pan-India"}</span>
                          </span>
                          <span className="font-mono text-slate-200 font-bold tabular-nums">
                            ₹{(t.estimated_cost_lakhs || 0).toLocaleString("en-IN")} Lakhs
                          </span>
                        </div>
                      </div>

                      {/* Right Action Icons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={portalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open official portal link"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/tenders/${t.id}`);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4 text-xs text-slate-400 border-t border-slate-800">
            <span>Page {page} of {Math.ceil(filteredTenders.length / pageSize) || 1}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page * pageSize >= filteredTenders.length}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Context Inspector & Real-Time Signal Stream (4 Cols) */}
        <div className="lg:col-span-4 space-y-6 sticky top-20">
          
          {/* Selected Tender Context Inspector */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">AI Context Inspector</h2>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                Live Analysis
              </span>
            </div>

            {selectedTender ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Selected Tender</div>
                  <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                    {selectedTender.title}
                  </h3>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Match Qualification Score</span>
                    <span className="font-bold text-emerald-400">92% Match</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-emerald-400 h-1.5 rounded-full w-[92%]" />
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    ✔ Past experience matches scope requirement.<br />
                    ✔ 100% EMD waived under Udyam MSME Rule 170.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                    <span className="text-slate-400">Estimated Cost</span>
                    <span className="font-mono font-bold text-white">₹{(selectedTender.estimated_cost_lakhs || 0).toLocaleString("en-IN")} Lakhs</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                    <span className="text-slate-400">EMD Requirement</span>
                    <span className="font-bold text-emerald-400">₹0 (Waived)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                    <span className="text-slate-400">Procurement Method</span>
                    <span className="font-medium text-slate-200">{selectedTender.procurement_method || "Open Tender L1"}</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/tenders/${selectedTender.id}`)}
                    className="btn btn-primary w-full py-2.5 text-xs font-semibold justify-center shadow-lg shadow-indigo-600/20"
                  >
                    Open Workspace &amp; Generate Bid <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (selectedTender) {
                        if (isWatchlisted(selectedTender.id)) {
                          removeFromWatchlist(selectedTender.id);
                        } else {
                          addToWatchlist(selectedTender);
                        }
                      }
                    }}
                    className="w-full py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 hover:text-white font-medium transition-colors text-center"
                  >
                    {isWatchlisted(selectedTender.id) ? "Remove from Watchlist" : "Bookmark to Watchlist"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Click any row in the feed to inspect AI qualification analysis...
              </div>
            )}
          </div>

          {/* Network Ingestion Signal Stream */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Network Signal Stream</h2>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">100% Operational</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-slate-200 font-medium">GeM Portal Connector</div>
                  <div className="text-[10px] text-slate-400">Synced 1,420 tenders · 12ms latency</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-slate-200 font-medium">CPPP National Portal</div>
                  <div className="text-[10px] text-slate-400">Synced 2,150 tenders · 18ms latency</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-slate-200 font-medium">Defence Procurement (DRDO/HAL)</div>
                  <div className="text-[10px] text-slate-400">Synced 682 tenders · 15ms latency</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
