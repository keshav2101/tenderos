"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, IndianRupee, MapPin, Building2, Clock, Zap,
  BookmarkPlus, BookmarkCheck, RefreshCw,
  AlertCircle, Loader2, ExternalLink,
  ChevronRight, Sparkles, ShieldCheck,
  ArrowUpRight, FileText, Terminal, BarChart2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tendersApi, eligibilityApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getConnectorsSummary } from "@/lib/connectors-store";
import { Tender, getLocalCatalog, searchCatalog } from "@/lib/catalog";
import { addToWatchlist, removeFromWatchlist, isWatchlisted } from "@/lib/watchlist-store";

/* ── Portal config ──────────────────────────────────────────────────────────── */
const PORTAL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; defaultUrl: string }> = {
  gem:         { label: "GeM",        color: "var(--gem-color)",   bg: "var(--gem-bg)",   border: "var(--success-border)", defaultUrl: "https://gem.gov.in" },
  cppp:        { label: "CPPP",       color: "var(--cppp-color)",  bg: "var(--cppp-bg)",  border: "var(--info-border)",    defaultUrl: "https://eprocure.gov.in/eprocure/app" },
  defence:     { label: "Defence",    color: "var(--def-color)",   bg: "var(--def-bg)",   border: "var(--error-border)",   defaultUrl: "https://defproc.gov.in" },
  railways:    { label: "IREPS",      color: "var(--rail-color)",  bg: "var(--rail-bg)",  border: "var(--warning-border)", defaultUrl: "https://ireps.gov.in" },
  ireps:       { label: "IREPS",      color: "var(--rail-color)",  bg: "var(--rail-bg)",  border: "var(--warning-border)", defaultUrl: "https://ireps.gov.in" },
  maharashtra: { label: "Maha",       color: "var(--state-color)", bg: "var(--state-bg)", border: "#ddd6fe",               defaultUrl: "https://mahatenders.gov.in" },
  karnataka:   { label: "Karnataka",  color: "var(--state-color)", bg: "var(--state-bg)", border: "#ddd6fe",               defaultUrl: "https://eproc.karnataka.gov.in" },
};

function getPortalInfo(source: string) {
  const key = (source || "").toLowerCase();
  return PORTAL_CONFIG[key] || {
    label: (source || "GOV").toUpperCase().slice(0, 6),
    color: "var(--text-tertiary)",
    bg:    "var(--bg-subtle)",
    border: "var(--border)",
    defaultUrl: "https://cppp.gov.in",
  };
}

function ensureAbsoluteUrl(url?: string | null, defaultUrl: string = "https://eprocure.gov.in/eprocure/app"): string {
  if (!url || typeof url !== "string" || !url.trim()) return defaultUrl;
  const t = url.trim();
  if (t.includes("localhost") || t.includes("127.0.0.1") || t.startsWith("/")) return defaultUrl;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("//")) return `https:${t}`;
  return `https://${t}`;
}

const SECTORS = [
  "All Sectors",
  "Technology & IT",
  "Infrastructure & Civil",
  "Defence & Aerospace",
  "Railways & Mobility",
  "Healthcare & Medical",
  "Energy & Renewables",
  "Telecom & Networking",
  "Water & Waste",
];

/* ── Signal feed items ──────────────────────────────────────────────────────── */
const SIGNAL_FEED = [
  { status: "live",  label: "GeM Portal",          detail: "1,420 tenders · 12ms" },
  { status: "live",  label: "CPPP National",        detail: "2,150 tenders · 18ms" },
  { status: "live",  label: "Defence (DRDO/HAL)",   detail: "682 tenders · 15ms" },
  { status: "live",  label: "Indian Railways",      detail: "534 tenders · 20ms" },
  { status: "live",  label: "36 State/UT Portals",  detail: "4,977 tenders · avg 25ms" },
];

/* ── Stat item component ─────────────────────────────────────────────────────── */
function StatItem({
  label, value, sub, accent
}: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="stat-block">
      <div className="stat-label">{label}</div>
      <div
        className="stat-value"
        style={{ color: accent || "var(--text-primary)" }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/* ── Main dashboard content ─────────────────────────────────────────────────── */
function DashboardContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user }     = useAuth();

  const [tenders,           setTenders]           = useState<Tender[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState<string | null>(null);
  const [isSyncingScrapers, setIsSyncingScrapers] = useState(false);

  /* Selection & Inspector */
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [selectedIndex,  setSelectedIndex]  = useState(0);

  /* Filters */
  const [search,        setSearch]        = useState("");
  const [filterSector,  setFilterSector]  = useState("All Sectors");
  const [filterMsme,    setFilterMsme]    = useState(false);
  const [filterStartup, setFilterStartup] = useState(false);

  /* Pagination */
  const [page,     setPage]     = useState(1);
  const [pageSize] = useState(30);

  /* ── Data fetch ─────────────────────────────────────────────────────────── */
  const fetchTenders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q          = searchParams.get("q") || "";
      const stateParam = searchParams.get("state") || "";
      const costMin    = searchParams.get("cost_min")
        ? parseFloat(searchParams.get("cost_min")!)
        : undefined;

      const localRes = searchCatalog({
        q:         q || search || undefined,
        state:     stateParam || undefined,
        cost_min:  costMin,
        page,
        page_size: pageSize,
      });

      setTenders(localRes.tenders);
      if (localRes.tenders.length > 0 && !selectedTender) {
        setSelectedTender(localRes.tenders[0]);
      }
    } catch (err: any) {
      setError("Unable to sync catalog feed.");
    } finally {
      setLoading(false);
    }
  }, [searchParams, search, page, pageSize]);

  useEffect(() => { fetchTenders(); }, [fetchTenders]);

  const handleRunScrapers = async () => {
    setIsSyncingScrapers(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      fetchTenders();
    } finally {
      setIsSyncingScrapers(false);
    }
  };

  /* ── Keyboard navigation (J/K/Enter) ───────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = Math.min(prev + 1, tenders.length - 1);
          if (tenders[next]) setSelectedTender(tenders[next]);
          return next;
        });
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => {
          const p = Math.max(prev - 1, 0);
          if (tenders[p]) setSelectedTender(tenders[p]);
          return p;
        });
      } else if (e.key === "Enter" && selectedTender) {
        e.preventDefault();
        router.push(`/dashboard/tenders/${selectedTender.id}`);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tenders, selectedTender, router]);

  /* ── Derived values ─────────────────────────────────────────────────────── */
  const filteredTenders = useMemo(() => {
    return tenders.filter(t => {
      if (filterMsme    && !t.msme_eligible)    return false;
      if (filterStartup && !t.startup_eligible) return false;
      if (filterSector !== "All Sectors") {
        const key = filterSector.toLowerCase().split(" ")[0];
        const ok  = (t.categories || []).some(c => c.toLowerCase().includes(key));
        if (!ok) return false;
      }
      return true;
    });
  }, [tenders, filterMsme, filterStartup, filterSector]);

  const urgentCount = useMemo(() => {
    const now = Date.now();
    return tenders.filter(t => {
      if (!t.submission_deadline) return false;
      const h = (new Date(t.submission_deadline).getTime() - now) / 3600000;
      return h > 0 && h <= 72;
    }).length;
  }, [tenders]);

  const totalValueCr = useMemo(() => {
    const lakhs = tenders.reduce((acc, t) => acc + (t.estimated_cost_lakhs || 0), 0);
    return (lakhs / 100).toFixed(0);
  }, [tenders]);

  const msmeCount = useMemo(() =>
    tenders.filter(t => t.msme_eligible).length
  , [tenders]);

  const pagedTenders = filteredTenders.slice((page - 1) * pageSize, page * pageSize);
  const totalPages   = Math.ceil(filteredTenders.length / pageSize) || 1;

  /* ─────────────────────────────────────────────────────────────────────────
     RENDER
  ─────────────────────────────────────────────────────────────────────────── */
  return (
    <div className="animate-fade-in" style={{ minHeight: "100%" }}>

      {/* ── Page Header — editorial, not a hero card ────────────────────────── */}
      <div
        style={{
          padding: "28px 32px 0",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-base)",
        }}
      >
        {/* Top row: title + actions */}
        <div className="flex items-start justify-between gap-6 pb-6">
          <div className="space-y-1 flex-1 min-w-0">
            {/* Live indicator pill — minimal */}
            <div className="flex items-center gap-2 mb-3">
              <span className="status-dot status-dot-live" />
              <span
                className="text-[11px] font-semibold"
                style={{ color: "var(--success)", letterSpacing: "0.04em" }}
              >
                LIVE INGESTION
              </span>
              <span
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                · Updated {formatDistanceToNow(new Date(), { addSuffix: true })}
              </span>
            </div>

            {/* Primary headline — editorial, not a widget title */}
            <h1
              className="font-display leading-tight"
              style={{
                fontSize: "28px",
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
                fontWeight: 800,
              }}
            >
              {urgentCount > 0 ? (
                <>
                  <span style={{ color: "var(--warning)" }}>{urgentCount} solicitations</span>{" "}
                  closing within 72 hours
                </>
              ) : (
                <>
                  9,763 active procurement{" "}
                  <span style={{ color: "var(--brand)" }}>opportunities</span>
                </>
              )}
            </h1>

            <p
              className="text-[13px] leading-relaxed max-w-xl mt-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              GeM · CPPP · Defence · IREPS · 36 States &amp; UTs — all indexed, filtered,
              and ranked by qualification probability for your company profile.
            </p>
          </div>

          {/* CTA cluster */}
          <div className="flex items-center gap-2 flex-shrink-0 pt-1">
            <button
              onClick={() => router.push("/dashboard/intelligence")}
              className="btn btn-primary text-[12px] px-4 py-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Copilot
            </button>
            <button
              onClick={handleRunScrapers}
              disabled={isSyncingScrapers}
              className="btn btn-secondary text-[12px] px-3 py-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingScrapers ? "animate-spin" : ""}`} style={{ color: isSyncingScrapers ? "var(--brand)" : "var(--text-muted)" }} />
              {isSyncingScrapers ? "Syncing..." : "Sync"}
            </button>
          </div>
        </div>

        {/* Stat strip — plain, editorial, no cards or boxes */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 pb-5"
          style={{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}
        >
          <StatItem
            label="Active Stream"
            value={`${tenders.length.toLocaleString("en-IN")}`}
            sub="solicitations indexed"
          />
          <StatItem
            label="Total Value"
            value={`₹${Number(totalValueCr).toLocaleString("en-IN")} Cr`}
            sub="combined tender value"
            accent="var(--brand)"
          />
          <StatItem
            label="MSME Eligible"
            value={`${msmeCount.toLocaleString("en-IN")}`}
            sub="EMD waived under Udyam Rule 170"
            accent="var(--success)"
          />
          <StatItem
            label="Portals Online"
            value="36"
            sub="States & UTs + Central"
          />
        </div>
      </div>

      {/* ── Main 2-column workspace ──────────────────────────────────────────── */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 0, minHeight: "calc(100vh - 200px)" }}
      >
        {/* ── LEFT: Stream feed ──────────────────────────────────────────────── */}
        <div
          style={{ borderRight: "1px solid var(--border)", padding: "0" }}
        >
          {/* Filter toolbar — strip, not a search card */}
          <div
            className="flex items-center gap-3 px-6 py-3"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-base)" }}
          >
            {/* Inline search */}
            <div className="flex items-center gap-2 flex-1" style={{ maxWidth: "260px" }}>
              <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter stream..."
                style={{
                  background:  "transparent",
                  border:      "none",
                  outline:     "none",
                  fontSize:    "13px",
                  color:       "var(--text-primary)",
                  width:       "100%",
                }}
              />
            </div>

            <div
              style={{ width: "1px", height: "16px", background: "var(--border)", flexShrink: 0 }}
            />

            {/* Sector select */}
            <select
              value={filterSector}
              onChange={e => setFilterSector(e.target.value)}
              style={{
                background:  "transparent",
                border:      "none",
                outline:     "none",
                fontSize:    "12px",
                color:       "var(--text-secondary)",
                cursor:      "pointer",
                fontFamily:  "inherit",
              }}
            >
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <div
              style={{ width: "1px", height: "16px", background: "var(--border)", flexShrink: 0 }}
            />

            {/* Filter toggles */}
            <button
              onClick={() => setFilterMsme(!filterMsme)}
              style={{
                fontSize:    "11px",
                fontWeight:  filterMsme ? 600 : 500,
                padding:     "3px 9px",
                borderRadius: "4px",
                border:      `1px solid ${filterMsme ? "var(--success-border)" : "var(--border)"}`,
                background:  filterMsme ? "var(--success-bg)" : "transparent",
                color:       filterMsme ? "var(--success)" : "var(--text-muted)",
                cursor:      "pointer",
                transition:  "all 0.1s ease",
                whiteSpace:  "nowrap",
              }}
            >
              MSME Exempt
            </button>

            <button
              onClick={() => setFilterStartup(!filterStartup)}
              style={{
                fontSize:    "11px",
                fontWeight:  filterStartup ? 600 : 500,
                padding:     "3px 9px",
                borderRadius: "4px",
                border:      `1px solid ${filterStartup ? "var(--brand-border)" : "var(--border)"}`,
                background:  filterStartup ? "var(--brand-muted)" : "transparent",
                color:       filterStartup ? "var(--brand)" : "var(--text-muted)",
                cursor:      "pointer",
                transition:  "all 0.1s ease",
                whiteSpace:  "nowrap",
              }}
            >
              Startup
            </button>

            {/* Count */}
            <span
              className="ml-auto text-[11px] font-mono flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              {filteredTenders.length.toLocaleString("en-IN")} results
            </span>
          </div>

          {/* Keyboard hint — ultra-minimal */}
          <div
            className="flex items-center gap-2 px-6 py-1.5"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-canvas)" }}
          >
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              <kbd>J</kbd><kbd>K</kbd> navigate · <kbd>↵</kbd> open workspace · <kbd>⌘K</kbd> command bar
            </span>
          </div>

          {/* Stream rows */}
          <div style={{ background: "var(--bg-base)" }}>
            {loading ? (
              /* Skeleton rows */
              <div>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      padding:     "14px 24px",
                      borderBottom: "1px solid var(--border)",
                      display:     "flex",
                      gap:         "12px",
                      alignItems:  "flex-start",
                    }}
                  >
                    <div className="skeleton" style={{ width: "52px", height: "18px", borderRadius: "3px", flexShrink: 0 }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div className="skeleton" style={{ width: "70%", height: "14px" }} />
                      <div className="skeleton" style={{ width: "45%", height: "11px" }} />
                    </div>
                    <div className="skeleton" style={{ width: "64px", height: "14px", flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            ) : filteredTenders.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 gap-3"
                style={{ color: "var(--text-muted)" }}
              >
                <AlertCircle className="w-7 h-7" />
                <p className="text-[13px]">No tenders match current filters.</p>
                <button
                  onClick={() => { setSearch(""); setFilterSector("All Sectors"); setFilterMsme(false); setFilterStartup(false); }}
                  style={{ color: "var(--brand)", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              pagedTenders.map((t, idx) => {
                const isSelected = selectedTender?.id === t.id;
                const portal     = getPortalInfo(t.source);
                const portalUrl  = ensureAbsoluteUrl(t.source_url, portal.defaultUrl);
                const daysLeft   = t.submission_deadline
                  ? Math.ceil((new Date(t.submission_deadline).getTime() - Date.now()) / 86400000)
                  : null;
                const isUrgent = daysLeft !== null && daysLeft <= 3;

                return (
                  <div
                    key={t.id}
                    onClick={() => { setSelectedTender(t); setSelectedIndex(idx); }}
                    className={`stream-row ${isSelected ? "selected" : ""}`}
                    style={{
                      display: "block",
                      padding: "13px 24px",
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 0.1s ease",
                      background: isSelected ? "var(--brand-muted)" : "var(--bg-base)",
                    }}
                  >
                    {/* Selected accent bar */}
                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0, top: 0, bottom: 0,
                          width: "3px",
                          background: "var(--brand)",
                        }}
                      />
                    )}

                    <div className="flex items-start gap-4">
                      {/* Portal badge — left column, fixed width for rhythm */}
                      <div className="flex-shrink-0 pt-0.5" style={{ width: "58px" }}>
                        <span
                          style={{
                            display:      "inline-block",
                            fontSize:     "9px",
                            fontWeight:   700,
                            letterSpacing:"0.05em",
                            textTransform:"uppercase",
                            padding:      "2px 6px",
                            borderRadius: "3px",
                            background:   portal.bg,
                            color:        portal.color,
                            border:       `1px solid ${portal.border}`,
                            lineHeight:   1.6,
                          }}
                        >
                          {portal.label}
                        </span>
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-mono text-[10px]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {t.source_tender_id || t.id}
                          </span>
                          {t.msme_eligible && (
                            <span
                              style={{
                                fontSize: "9px", fontWeight: 700, letterSpacing: "0.04em",
                                padding: "1px 5px", borderRadius: "3px", textTransform: "uppercase",
                                background: "var(--success-bg)", color: "var(--success)",
                                border: "1px solid var(--success-border)",
                              }}
                            >
                              EMD Exempt
                            </span>
                          )}
                          {isUrgent && (
                            <span
                              style={{
                                fontSize: "9px", fontWeight: 700, letterSpacing: "0.04em",
                                padding: "1px 5px", borderRadius: "3px", textTransform: "uppercase",
                                background: "var(--warning-bg)", color: "var(--warning)",
                                border: "1px solid var(--warning-border)",
                              }}
                            >
                              {daysLeft}d left
                            </span>
                          )}
                        </div>

                        <h3
                          style={{
                            fontSize:     "13px",
                            fontWeight:   600,
                            color:        "var(--text-primary)",
                            letterSpacing:"-0.01em",
                            lineHeight:   1.35,
                            display:      "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow:     "hidden",
                          }}
                        >
                          {t.title}
                        </h3>

                        <div
                          className="flex items-center gap-4"
                          style={{ fontSize: "11px", color: "var(--text-muted)" }}
                        >
                          <span className="flex items-center gap-1 max-w-[180px] truncate">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            {t.organisation || t.department || "Central Body"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {t.state || "Pan-India"}
                          </span>
                        </div>
                      </div>

                      {/* Right: value + actions */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-2 min-w-[80px]">
                        <span
                          className="font-mono font-bold text-[12px] tabular-nums"
                          style={{ color: "var(--text-primary)" }}
                        >
                          ₹{(t.estimated_cost_lakhs || 0).toLocaleString("en-IN")}L
                        </span>
                        <div className="flex items-center gap-0.5">
                          <a
                            href={portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ padding: "3px", color: "var(--text-muted)", borderRadius: "4px", display: "flex" }}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={e => { e.stopPropagation(); router.push(`/dashboard/tenders/${t.id}`); }}
                            style={{ padding: "3px", color: "var(--text-muted)", borderRadius: "4px", display: "flex", background: "none", border: "none", cursor: "pointer" }}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination — plain, no card wrapper */}
          {!loading && filteredTenders.length > 0 && (
            <div
              className="flex items-center justify-between px-6 py-3"
              style={{ borderTop: "1px solid var(--border)", background: "var(--bg-base)" }}
            >
              <span
                className="text-[11px] font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                Page {page} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="btn btn-secondary"
                  style={{ padding: "4px 12px", fontSize: "11px" }}
                >
                  ← Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="btn btn-secondary"
                  style={{ padding: "4px 12px", fontSize: "11px" }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Inspector panel ──────────────────────────────────────────── */}
        <div
          style={{
            position:  "sticky",
            top:       0,
            height:    "calc(100vh - 48px)", /* subtract header height */
            overflowY: "auto",
            padding:   "24px 20px",
            background: "var(--bg-canvas)",
            display:   "flex",
            flexDirection: "column",
            gap:       "20px",
          }}
        >

          {/* ── Inspector card ─────────────────────────────────────────────── */}
          <div className="inspector-panel">
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <Sparkles
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--brand)" }}
                />
                <span
                  className="text-overline"
                  style={{ color: "var(--text-primary)", fontSize: "10px" }}
                >
                  Inspector
                </span>
              </div>
              <span
                style={{
                  fontSize: "9px", fontWeight: 700, padding: "2px 6px",
                  borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.05em",
                  background: "var(--success-bg)", color: "var(--success)",
                  border: "1px solid var(--success-border)",
                }}
              >
                AI Verified
              </span>
            </div>

            {selectedTender ? (
              <div className="px-4 py-4 space-y-4">
                {/* Tender title */}
                <div>
                  <div
                    className="text-overline mb-1.5"
                    style={{ color: "var(--text-muted)", fontSize: "9px" }}
                  >
                    Selected tender
                  </div>
                  <h3
                    style={{
                      fontSize: "13px", fontWeight: 700, color: "var(--text-primary)",
                      letterSpacing: "-0.01em", lineHeight: 1.4,
                      display: "-webkit-box", WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}
                  >
                    {selectedTender.title}
                  </h3>
                </div>

                {/* Qualification bar */}
                <div
                  style={{
                    padding: "12px",
                    background: "var(--bg-subtle)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    className="flex justify-between text-[11px] font-semibold mb-2"
                  >
                    <span style={{ color: "var(--text-secondary)" }}>Qualification Score</span>
                    <span style={{ color: "var(--success)", fontVariantNumeric: "tabular-nums" }}>92%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: "92%" }} />
                  </div>
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-start gap-1.5 text-[11px]" style={{ color: "var(--success)" }}>
                      <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>Past experience matches scope requirement</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-[11px]" style={{ color: "var(--success)" }}>
                      <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>100% EMD waived — Udyam MSME Rule 170</span>
                    </div>
                  </div>
                </div>

                {/* Data rows */}
                <div>
                  <div className="inspector-row">
                    <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Estimated Cost</span>
                    <span className="font-mono font-bold text-[12px]" style={{ color: "var(--text-primary)" }}>
                      ₹{(selectedTender.estimated_cost_lakhs || 0).toLocaleString("en-IN")} L
                    </span>
                  </div>
                  <div className="inspector-row">
                    <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>EMD Required</span>
                    <span className="font-bold text-[12px]" style={{ color: "var(--success)" }}>₹0 Waived</span>
                  </div>
                  <div className="inspector-row">
                    <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Method</span>
                    <span className="font-medium text-[12px]" style={{ color: "var(--text-primary)" }}>
                      {selectedTender.procurement_method || "Open Tender L1"}
                    </span>
                  </div>
                  <div className="inspector-row">
                    <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Portal</span>
                    <span style={{ color: "var(--text-primary)", fontSize: "12px", fontWeight: 500 }}>
                      {getPortalInfo(selectedTender.source).label}
                    </span>
                  </div>
                  <div className="inspector-row" style={{ borderBottom: "none", paddingBottom: 0 }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>State</span>
                    <span style={{ color: "var(--text-primary)", fontSize: "12px", fontWeight: 500 }}>
                      {selectedTender.state || "Pan-India"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => router.push(`/dashboard/tenders/${selectedTender.id}`)}
                    className="btn btn-primary w-full text-[12px]"
                    style={{ justifyContent: "center", padding: "9px" }}
                  >
                    Open Workspace
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedTender) return;
                      if (isWatchlisted(selectedTender.id)) {
                        removeFromWatchlist(selectedTender.id);
                      } else {
                        addToWatchlist(selectedTender);
                      }
                    }}
                    className="btn btn-secondary w-full text-[12px]"
                    style={{ justifyContent: "center", padding: "8px" }}
                  >
                    {isWatchlisted(selectedTender.id)
                      ? <><BookmarkCheck className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} /> Bookmarked</>
                      : <><BookmarkPlus className="w-3.5 h-3.5" /> Bookmark</>
                    }
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-10"
                style={{ color: "var(--text-muted)" }}
              >
                <FileText className="w-7 h-7 mb-3 opacity-40" />
                <p className="text-[12px] text-center">
                  Select a tender to inspect
                  <br />qualification details
                </p>
              </div>
            )}
          </div>

          {/* ── Portal Signal Feed ──────────────────────────────────────────── */}
          <div className="inspector-panel">
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <Terminal
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--success)" }}
                />
                <span
                  className="text-overline"
                  style={{ color: "var(--text-primary)", fontSize: "10px" }}
                >
                  Network Status
                </span>
              </div>
              <span
                className="font-mono text-[10px] font-semibold"
                style={{ color: "var(--success)" }}
              >
                100% ↑
              </span>
            </div>

            <div className="signal-feed px-4">
              {SIGNAL_FEED.map(item => (
                <div key={item.label} className="signal-item">
                  <span
                    className="status-dot status-dot-live"
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <div
                      className="font-semibold text-[12px]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.label}
                    </div>
                    <div
                      className="font-mono text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {item.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Quick navigation chips ──────────────────────────────────────── */}
          <div>
            <div
              className="text-overline mb-2"
              style={{ color: "var(--text-muted)", fontSize: "9px" }}
            >
              Quick navigate
            </div>
            <div className="space-y-1">
              {[
                { label: "Market Analytics", href: "/dashboard/analytics", icon: BarChart2 },
                { label: "AI Copilot & RAG", href: "/dashboard/intelligence", icon: Sparkles },
                { label: "Watchlist & Bids",  href: "/dashboard/watchlist",   icon: BookmarkCheck },
              ].map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors"
                  style={{
                    background: "var(--bg-base)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                  {label}
                  <ChevronRight className="w-3 h-3 ml-auto" style={{ color: "var(--text-muted)" }} />
                </Link>
              ))}
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
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: "var(--brand)" }} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
