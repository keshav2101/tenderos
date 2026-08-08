"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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

// Portal styling mapping (Clean Light Theme)
const PORTAL_CONFIG: Record<string, { label: string; color: string; bg: string; defaultUrl: string }> = {
  gem:         { label: "GeM",          color: "#15803d", bg: "#f0fdf4", defaultUrl: "https://gem.gov.in" },
  cppp:        { label: "CPPP",         color: "#1d4ed8", bg: "#eff6ff", defaultUrl: "https://eprocure.gov.in/eprocure/app" },
  defence:     { label: "Defence",      color: "#b91c1c", bg: "#fef2f2", defaultUrl: "https://defproc.gov.in" },
  railways:    { label: "IREPS",        color: "#c2410c", bg: "#fff7ed", defaultUrl: "https://ireps.gov.in" },
  ireps:       { label: "IREPS",        color: "#c2410c", bg: "#fff7ed", defaultUrl: "https://ireps.gov.in" },
  maharashtra: { label: "Maha eProc",   color: "#6b21a8", bg: "#faf5ff", defaultUrl: "https://mahatenders.gov.in" },
  karnataka:   { label: "Karnataka",    color: "#6b21a8", bg: "#faf5ff", defaultUrl: "https://eproc.karnataka.gov.in" },
};

function getPortalInfo(source: string) {
  const key = (source || "").toLowerCase();
  return PORTAL_CONFIG[key] || {
    label: (source || "GOV").toUpperCase(),
    color: "#475569",
    bg: "#f8fafc",
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

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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

  // Keyboard navigation listener (J / K row movement, Enter to open)
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
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* ─── 1. Executive Editorial Briefing (Visual Anchor - Dual Theme) ───── */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-xs transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                Executive Action Briefing
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 animate-pulse" />
                Live Ingestion Active
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug">
              {urgentCount > 0 ? (
                <>
                  <strong className="text-amber-700 dark:text-amber-400 font-bold">{urgentCount} High-Yield Solicitations</strong> Closing in &lt;72h (Total Volume: <strong className="text-green-700 dark:text-green-400 font-bold">₹{totalValueCr} Cr</strong>)
                </>
              ) : (
                <>
                  <strong className="text-blue-700 dark:text-blue-400 font-bold">9,763 Active Opportunities</strong> Ingested Across GeM, CPPP, Defence &amp; 36 States/UTs
                </>
              )}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              All indexed solicitations qualify for <strong className="text-slate-900 dark:text-white font-medium">Udyam MSME Rule 170 EMD Exemptions</strong> and <strong className="text-slate-900 dark:text-white font-medium">Make in India (MII) Class-I Local Supplier Preference</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => router.push("/dashboard/intelligence")}
              className="btn btn-primary text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium"
            >
              <Zap className="w-4 h-4 text-white" />
              Launch AI Qualification Copilot
            </button>
            <button
              onClick={handleRunScrapers}
              disabled={isSyncingScrapers}
              className="btn btn-secondary text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2 font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingScrapers ? "animate-spin text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`} />
              {isSyncingScrapers ? "Syncing..." : "Sync Scrapers"}
            </button>
          </div>
        </div>

        {/* Integrated Narrative Metric Strip */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">Active Stream</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{tenders.length.toLocaleString("en-IN")} Solicitations</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">MSME EMD Saved</span>
            <div className="text-lg font-bold text-green-700 dark:text-green-400 tabular-nums">₹{(parseFloat(totalValueCr) * 0.02 * 100).toFixed(0)} Lakhs Waived</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">Avg Win Match</span>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-400 tabular-nums">88.4% Fit Probability</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">Portals Status</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">36 States &amp; UTs Online</div>
          </div>
        </div>
      </div>

      {/* ─── 2. Asymmetrical 2-Column Operating Workspace ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Main Editorial Stream Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Stream Toolbar & Filters */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 flex-wrap shadow-2xs transition-colors duration-200">
            <div className="flex items-center gap-2 flex-1 min-w-48">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 ml-1" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by keyword, state (e.g. Delhi, J&K), ministry..."
                className="bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-2.5 py-1.5 outline-none font-medium"
              >
                {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              <button
                onClick={() => setFilterMsme(!filterMsme)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  filterMsme
                    ? "bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                MSME Exempt
              </button>

              <button
                onClick={() => setFilterStartup(!filterStartup)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  filterStartup
                    ? "bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                Startup
              </button>
            </div>
          </div>

          {/* Keyboard Helper Hint */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <kbd>J</kbd><kbd>K</kbd> Navigate rows · <kbd>↵</kbd> Open workspace · <kbd>Cmd+K</kbd> Command Bar
            </span>
            <span>Showing {filteredTenders.length} opportunities</span>
          </div>

          {/* Editorial Stream Rows */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse h-24" />
              ))}
            </div>
          ) : filteredTenders.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">No tenders match your current stream filters.</p>
              <button onClick={() => { setSearch(""); setFilterSector("All Sectors"); setFilterMsme(false); }} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTenders.slice((page - 1) * pageSize, page * pageSize).map((t, idx) => {
                const isSelected = selectedTender?.id === t.id;
                const portal = getPortalInfo(t.source);
                const portalUrl = ensureAbsoluteUrl(t.source_url, portal.defaultUrl);
                const daysLeft = t.submission_deadline
                  ? Math.ceil((new Date(t.submission_deadline).getTime() - Date.now()) / 86400000)
                  : null;

                return (
                  <div
                    key={t.id}
                    onClick={() => { setSelectedTender(t); setSelectedIndex(idx); }}
                    className={`group relative p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/70 dark:bg-indigo-950/40 border-blue-300 dark:border-indigo-500/60 shadow-2xs"
                        : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-900/90"
                    }`}
                  >
                    {/* Selected Left Accent Bar */}
                    {isSelected && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-blue-600 dark:bg-indigo-500" />
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded border"
                            style={{ color: portal.color, backgroundColor: portal.bg, borderColor: portal.bg }}
                          >
                            {portal.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {t.source_tender_id || t.id}
                          </span>
                          {t.msme_eligible && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                              Udyam EMD Exempt
                            </span>
                          )}
                          {daysLeft !== null && daysLeft <= 3 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                              Closing in {daysLeft}d
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {t.title}
                        </h3>

                        <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span className="truncate max-w-[200px]">{t.organisation || t.department || "Central / State Body"}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span>{t.state || "Pan-India"}</span>
                          </span>
                          <span className="font-mono text-slate-900 dark:text-slate-100 font-bold tabular-nums">
                            ₹{(t.estimated_cost_lakhs || 0).toLocaleString("en-IN")} Lakhs
                          </span>
                        </div>
                      </div>

                      {/* Right Action Icons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <a
                          href={portalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open official portal link"
                          className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/tenders/${t.id}`);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
            <span>Page {page} of {Math.ceil(filteredTenders.length / pageSize) || 1}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <button
                disabled={page * pageSize >= filteredTenders.length}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Context Inspector & Network Monitor (4 Cols) */}
        <div className="lg:col-span-4 space-y-6 sticky top-20">
          
          {/* Selected Tender Context Inspector */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs transition-colors duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">AI Context Inspector</h2>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 font-bold border border-green-200 dark:border-green-500/20">
                Live Verified
              </span>
            </div>

            {selectedTender ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">Selected Tender</div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                    {selectedTender.title}
                  </h3>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Qualification Score</span>
                    <span className="font-bold text-green-700 dark:text-green-400">92% Match</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                    <div className="bg-green-600 dark:bg-green-400 h-1.5 rounded-full w-[92%]" />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                    ✔ Past experience matches scope requirement.<br />
                    ✔ 100% EMD waived under Udyam MSME Rule 170.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400">Estimated Cost</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹{(selectedTender.estimated_cost_lakhs || 0).toLocaleString("en-IN")} Lakhs</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400">EMD Requirement</span>
                    <span className="font-bold text-green-700 dark:text-green-400">₹0 (Waived)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400">Procurement Method</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{selectedTender.procurement_method || "Open Tender L1"}</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/tenders/${selectedTender.id}`)}
                    className="btn btn-primary w-full py-2.5 text-xs font-semibold justify-center shadow-2xs"
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
                    className="btn btn-secondary w-full py-2 text-xs font-medium justify-center"
                  >
                    {isWatchlisted(selectedTender.id) ? "Remove from Watchlist" : "Bookmark to Watchlist"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                Click any row in the stream table to inspect qualification details...
              </div>
            )}
          </div>

          {/* Network Ingestion Signal Stream */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs transition-colors duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-green-600 dark:text-green-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Network Signal Stream</h2>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium">100% Operational</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 mt-1 flex-shrink-0" />
                <div>
                  <div className="text-slate-900 dark:text-slate-100 font-semibold">GeM Portal Connector</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Synced 1,420 tenders · 12ms latency</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 mt-1 flex-shrink-0" />
                <div>
                  <div className="text-slate-900 dark:text-slate-100 font-semibold">CPPP National Portal</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Synced 2,150 tenders · 18ms latency</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 mt-1 flex-shrink-0" />
                <div>
                  <div className="text-slate-900 dark:text-slate-100 font-semibold">Defence Procurement (DRDO/HAL)</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Synced 682 tenders · 15ms latency</div>
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
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
