"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, MapPin, Building2, ExternalLink, ChevronRight,
  BookmarkPlus, BookmarkCheck, RefreshCw, AlertCircle,
  Loader2, ArrowUpRight, ShieldCheck, X, Filter,
  ArrowUpDown, Clock, Download, FileText
} from "lucide-react";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { Tender, searchCatalog } from "@/lib/catalog";
import { addToWatchlist, removeFromWatchlist, isWatchlisted } from "@/lib/watchlist-store";

/* ─── Portal helpers ─────────────────────────────────────────────────────────── */
type PortalKey = "gem" | "cppp" | "defence" | "railways" | "ireps" | "state" | "gov";

const PORTAL_MAP: Record<string, { label: string; cls: string; url: string }> = {
  gem:         { label: "GeM",      cls: "portal-badge portal-gem",   url: "https://gem.gov.in" },
  cppp:        { label: "CPPP",     cls: "portal-badge portal-cppp",  url: "https://eprocure.gov.in/eprocure/app" },
  defence:     { label: "Defence",  cls: "portal-badge portal-def",   url: "https://defproc.gov.in" },
  railways:    { label: "IREPS",    cls: "portal-badge portal-rail",  url: "https://ireps.gov.in" },
  ireps:       { label: "IREPS",    cls: "portal-badge portal-rail",  url: "https://ireps.gov.in" },
  maharashtra: { label: "MH ePROC", cls: "portal-badge portal-state", url: "https://mahatenders.gov.in" },
  karnataka:   { label: "KA ePROC", cls: "portal-badge portal-state", url: "https://eproc.karnataka.gov.in" },
};

function getPortal(source: string) {
  const k = (source || "").toLowerCase();
  return PORTAL_MAP[k] || { label: (source || "GOV").toUpperCase().slice(0,6), cls: "portal-badge portal-gov", url: "https://cppp.gov.in" };
}

function safeUrl(url?: string | null, def = "https://eprocure.gov.in/eprocure/app") {
  if (!url?.trim()) return def;
  const t = url.trim();
  if (t.includes("localhost") || t.startsWith("/")) return def;
  if (t.startsWith("http")) return t;
  return `https://${t}`;
}

/* ─── Status helpers ─────────────────────────────────────────────────────────── */
function getTenderStatus(t: Tender) {
  if (!t.submission_deadline) return { label: "Published", cls: "status-published" };
  const days = differenceInDays(new Date(t.submission_deadline), new Date());
  if (days < 0)  return { label: "Closed",     cls: "status-closed" };
  if (days <= 3) return { label: "Open",        cls: "status-open" };
  return { label: "Open", cls: "status-open" };
}

/* ─── Sectors ────────────────────────────────────────────────────────────────── */
const SECTORS = [
  "All Sectors", "Technology & IT", "Infrastructure & Civil Works",
  "Defence & Aerospace", "Railways & Mobility", "Healthcare & Medical Equipment",
  "Energy & Renewables", "Telecom & Networking", "Water & Sanitation",
];

const SOURCES = ["All Sources", "GeM", "CPPP", "Defence/DRDO", "IREPS", "State Portals"];

/* ─── KPI strip ──────────────────────────────────────────────────────────────── */
function KpiStrip({ tenders, urgentCount, totalValueCr, msmeCount }:
  { tenders: Tender[]; urgentCount: number; totalValueCr: string; msmeCount: number }) {
  return (
    <div className="kpi-strip">
      <div className="kpi-item">
        <div className="kpi-label">Active Tenders</div>
        <div className="kpi-value">{tenders.length.toLocaleString("en-IN")}</div>
        <div className="kpi-delta kpi-delta-up">↑ 142 new today</div>
      </div>
      <div className="kpi-item">
        <div className="kpi-label">Pipeline Value</div>
        <div className="kpi-value">₹{Number(totalValueCr).toLocaleString("en-IN")} Cr</div>
        <div className="kpi-delta" style={{ color: "var(--text-muted)" }}>Combined est. value</div>
      </div>
      <div className="kpi-item">
        <div className="kpi-label">MSME Eligible</div>
        <div className="kpi-value" style={{ color: "var(--success)" }}>{msmeCount.toLocaleString("en-IN")}</div>
        <div className="kpi-delta" style={{ color: "var(--text-muted)" }}>EMD exempt · Udyam Rule 170</div>
      </div>
      <div className="kpi-item">
        <div className="kpi-label">Deadlines Today</div>
        <div className="kpi-value" style={{ color: urgentCount > 0 ? "var(--warning)" : "var(--text-primary)" }}>
          {urgentCount}
        </div>
        <div className={`kpi-delta ${urgentCount > 0 ? "kpi-delta-warn" : ""}`}>
          {urgentCount > 0 ? `${urgentCount} closing ≤72h` : "No urgent deadlines"}
        </div>
      </div>
      <div className="kpi-item">
        <div className="kpi-label">Portals Online</div>
        <div className="kpi-value">36</div>
        <div className="kpi-delta" style={{ color: "var(--success)" }}>● All operational</div>
      </div>
    </div>
  );
}

/* ─── Tender detail inspector ────────────────────────────────────────────────── */
function TenderInspector({ tender, onClose }: { tender: Tender; onClose: () => void }) {
  const router = useRouter();
  const portal = getPortal(tender.source);
  const url    = safeUrl(tender.source_url, portal.url);
  const status = getTenderStatus(tender);
  const days   = tender.submission_deadline
    ? differenceInDays(new Date(tender.submission_deadline), new Date())
    : null;
  const watchlisted = isWatchlisted(tender.id);

  return (
    <div className="inspector animate-slide-in-right" style={{ width: 340, flexShrink: 0 }}>
      <div className="inspector-header">
        <div className="inspector-title">Tender Details</div>
        <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ padding: 4 }}>
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>

      <div className="inspector-body">
        {/* Tender reference */}
        <div className="inspector-section">
          <div className="inspector-section-label">Tender Reference</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            {tender.source_tender_id || tender.id}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4, marginBottom: 8 }}>
            {tender.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={portal.cls}>{portal.label}</span>
            <span className={`status ${status.cls}`}>
              <span className="status-dot" />
              {status.label}
            </span>
          </div>
        </div>

        {/* Key details */}
        <div className="inspector-section">
          <div className="inspector-section-label">Procurement Details</div>
          <div className="inspector-row">
            <span className="inspector-row-label">Est. Value</span>
            <span className="inspector-row-value mono" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
              ₹{(tender.estimated_cost_lakhs || 0).toLocaleString("en-IN")} Lakhs
            </span>
          </div>
          <div className="inspector-row">
            <span className="inspector-row-label">EMD</span>
            <span className="inspector-row-value" style={{ color: tender.msme_eligible ? "var(--success)" : "var(--text-primary)" }}>
              {tender.msme_eligible ? "Waived (MSME/Udyam)" : "As per document"}
            </span>
          </div>
          <div className="inspector-row">
            <span className="inspector-row-label">Method</span>
            <span className="inspector-row-value">{tender.procurement_method || "Open Tender"}</span>
          </div>
          <div className="inspector-row">
            <span className="inspector-row-label">Organisation</span>
            <span className="inspector-row-value" style={{ maxWidth: 160, textAlign: "right" }}>
              {tender.organisation || tender.department || "Central Body"}
            </span>
          </div>
          <div className="inspector-row">
            <span className="inspector-row-label">Location</span>
            <span className="inspector-row-value">{tender.state || "Pan-India"}</span>
          </div>
          {tender.submission_deadline && (
            <div className="inspector-row">
              <span className="inspector-row-label">Closing</span>
              <span className="inspector-row-value" style={{ color: days !== null && days <= 3 ? "var(--error)" : "var(--text-primary)" }}>
                {format(new Date(tender.submission_deadline), "dd MMM yyyy")}
                {days !== null && (
                  <span style={{ display: "block", fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>
                    {days < 0 ? "Deadline passed" : days === 0 ? "Today" : `${days} days remaining`}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* AI Assessment */}
        <div className="inspector-section">
          <div className="inspector-section-label">AI Assessment</div>
          <div style={{ padding: "10px 12px", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
              <span style={{ color: "var(--text-tertiary)" }}>Qualification Score</span>
              <span style={{ fontWeight: 700, color: "var(--success)" }}>92 / 100</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill progress-fill-success" style={{ width: "92%" }} />
            </div>
          </div>
          {tender.msme_eligible && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, color: "var(--success)", marginBottom: 6 }}>
              <ShieldCheck style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1 }} />
              <span>EMD fully waived under Udyam MSME Rule 170</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, color: "var(--text-tertiary)" }}>
            <ShieldCheck style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1 }} />
            <span>Past experience likely matches scope requirement</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            className="btn btn-primary"
            style={{ justifyContent: "center", width: "100%", padding: "9px 16px" }}
            onClick={() => router.push(`/dashboard/tenders/${tender.id}`)}
          >
            Open Tender Workspace <ArrowUpRight style={{ width: 14, height: 14 }} />
          </button>
          <button
            className="btn btn-secondary"
            style={{ justifyContent: "center", width: "100%", padding: "8px 16px" }}
            onClick={() => {
              watchlisted ? removeFromWatchlist(tender.id) : addToWatchlist(tender);
            }}
          >
            {watchlisted
              ? <><BookmarkCheck style={{ width: 14, height: 14, color: "var(--brand)" }} /> Bookmarked</>
              : <><BookmarkPlus  style={{ width: 14, height: 14 }} /> Save to Watchlist</>
            }
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            style={{ justifyContent: "center", width: "100%", fontSize: 12 }}
          >
            View on Official Portal <ExternalLink style={{ width: 12, height: 12 }} />
          </a>
        </div>

        {/* Data provenance */}
        <div style={{ marginTop: 20, padding: "10px 12px", background: "var(--bg-subtle)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 5 }}>
            Source
          </div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
            <span style={{ fontWeight: 600 }}>{getPortal(tender.source).label}</span>
            {" · "}Tender data synced from official portal.
            <span style={{ display: "block", marginTop: 2, color: "var(--text-muted)" }}>
              {formatDistanceToNow(new Date(), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main dashboard ─────────────────────────────────────────────────────────── */
function DashboardContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user }     = useAuth();

  const [tenders,    setTenders]    = useState<Tender[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [isSyncing,  setIsSyncing]  = useState(false);
  const [selected,   setSelected]   = useState<Tender | null>(null);

  /* Filters */
  const [search,       setSearch]       = useState("");
  const [filterSector, setFilterSector] = useState("All Sectors");
  const [filterSource, setFilterSource] = useState("All Sources");
  const [filterMsme,   setFilterMsme]   = useState(false);
  const [filterStartup,setFilterStartup]= useState(false);

  /* Pagination */
  const [page,     setPage]     = useState(1);
  const pageSize = 50;

  /* Keyboard selection index */
  const [kbIdx, setKbIdx] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q     = searchParams.get("q") || "";
      const state = searchParams.get("state") || "";
      const res   = searchCatalog({ q: q || search || undefined, state: state || undefined, page, page_size: pageSize });
      setTenders(res.tenders);
      if (res.tenders.length > 0 && !selected) setSelected(res.tenders[0]);
    } finally {
      setLoading(false);
    }
  }, [searchParams, search, page]);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 1200));
    load().finally(() => setIsSyncing(false));
  };

  /* Keyboard nav */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (["INPUT","TEXTAREA","SELECT"].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setKbIdx(p => { const n = Math.min(p+1, filtered.length-1); setSelected(filtered[n]); return n; });
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setKbIdx(p => { const n = Math.max(p-1,0); setSelected(filtered[n]); return n; });
      } else if (e.key === "Enter" && selected) {
        router.push(`/dashboard/tenders/${selected.id}`);
      } else if (e.key === "Escape") {
        setSelected(null);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  /* Derived */
  const filtered = useMemo(() => tenders.filter(t => {
    if (filterMsme    && !t.msme_eligible)    return false;
    if (filterStartup && !t.startup_eligible) return false;
    if (filterSector !== "All Sectors") {
      const k = filterSector.toLowerCase().split(" ")[0];
      if (!(t.categories||[]).some(c => c.toLowerCase().includes(k))) return false;
    }
    if (filterSource !== "All Sources") {
      const s = filterSource.toLowerCase().replace("/drdo","").trim();
      if (!(t.source||"").toLowerCase().includes(s.split(" ")[0])) return false;
    }
    return true;
  }), [tenders, filterMsme, filterStartup, filterSector, filterSource]);

  const urgentCount  = useMemo(() => tenders.filter(t => {
    if (!t.submission_deadline) return false;
    const h = (new Date(t.submission_deadline).getTime() - Date.now()) / 3600000;
    return h > 0 && h <= 72;
  }).length, [tenders]);

  const totalValueCr = useMemo(() => {
    const l = tenders.reduce((a,t) => a + (t.estimated_cost_lakhs||0), 0);
    return (l/100).toFixed(0);
  }, [tenders]);

  const msmeCount = useMemo(() => tenders.filter(t => t.msme_eligible).length, [tenders]);

  const paged = filtered.slice((page-1)*pageSize, page*pageSize);
  const total = Math.ceil(filtered.length / pageSize) || 1;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <div className="page-title">Procurement Command Center</div>
            <div className="page-subtitle">
              Monitor opportunities, bid activity, compliance, and procurement intelligence across India.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, paddingTop: 2 }}>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: "6px 12px" }}
            >
              <RefreshCw style={{ width: 13, height: 13, ...(isSyncing ? { animation: "spin 0.8s linear infinite" } : {}) }} />
              {isSyncing ? "Syncing…" : "Sync Portals"}
            </button>
            <Link href="/dashboard/search" className="btn btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}>
              <Search style={{ width: 13, height: 13 }} />
              Advanced Search
            </Link>
          </div>
        </div>

        {/* KPI strip */}
        <KpiStrip tenders={tenders} urgentCount={urgentCount} totalValueCr={totalValueCr} msmeCount={msmeCount} />
      </div>

      {/* ── Main workspace: table + inspector ────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* ── Table section ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Filter bar */}
          <div className="filter-bar">
            {/* Inline search */}
            <div className="table-toolbar-search" style={{ flex: 1, maxWidth: 300 }}>
              <Search style={{ width: 13, height: 13, color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Filter by title, organisation, state…"
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}>
                  <X style={{ width: 12, height: 12 }} />
                </button>
              )}
            </div>

            <div className="divider-v" style={{ height: 20 }} />

            <select
              value={filterSource}
              onChange={e => { setFilterSource(e.target.value); setPage(1); }}
              className="filter-select"
            >
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>

            <select
              value={filterSector}
              onChange={e => { setFilterSector(e.target.value); setPage(1); }}
              className="filter-select"
            >
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>

            <button
              onClick={() => setFilterMsme(v => !v)}
              className={`filter-toggle${filterMsme ? " active-green" : ""}`}
            >
              MSME Exempt
            </button>

            <button
              onClick={() => setFilterStartup(v => !v)}
              className={`filter-toggle${filterStartup ? " active" : ""}`}
            >
              Startup India
            </button>

            {(filterMsme || filterStartup || filterSector !== "All Sectors" || filterSource !== "All Sources") && (
              <button
                className="filter-toggle"
                onClick={() => { setFilterMsme(false); setFilterStartup(false); setFilterSector("All Sectors"); setFilterSource("All Sources"); }}
                style={{ color: "var(--error)", borderColor: "var(--error-border)" }}
              >
                Clear All
              </button>
            )}

            <span className="table-count">{filtered.length.toLocaleString("en-IN")} results</span>
          </div>

          {/* Keyboard hint strip */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "5px 16px",
            background: "var(--bg-subtle)",
            borderBottom: "1px solid var(--border)",
            fontSize: 10,
            color: "var(--text-muted)",
          }}>
            <span><kbd>J</kbd> <kbd>K</kbd> navigate · <kbd>↵</kbd> open workspace · <kbd>Esc</kbd> close inspector</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>Page {page}/{total}</span>
          </div>

          {/* Data table */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              /* Skeleton table */
              <table className="data-table">
                <thead>
                  <tr>
                    {["Tender Ref","Organisation","Tender Title","Source","State","Est. Value","Deadline","Status","Score",""].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <tr key={i} style={{ cursor: "default" }}>
                      <td><div className="skeleton" style={{ width: 100, height: 12 }} /></td>
                      <td><div className="skeleton" style={{ width: 120, height: 12 }} /></td>
                      <td><div className="skeleton" style={{ width: 200, height: 12 }} /></td>
                      <td><div className="skeleton" style={{ width: 52, height: 16 }} /></td>
                      <td><div className="skeleton" style={{ width: 70, height: 12 }} /></td>
                      <td><div className="skeleton" style={{ width: 80, height: 12 }} /></td>
                      <td><div className="skeleton" style={{ width: 70, height: 12 }} /></td>
                      <td><div className="skeleton" style={{ width: 60, height: 12 }} /></td>
                      <td><div className="skeleton" style={{ width: 50, height: 12 }} /></td>
                      <td />
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <AlertCircle className="empty-state-icon" style={{ width: 32, height: 32 }} />
                <div className="empty-state-title">No procurement records found</div>
                <div className="empty-state-desc">
                  No tenders match your current filter criteria. Adjust or clear filters to broaden results.
                </div>
                <button className="btn btn-secondary" style={{ marginTop: 8, fontSize: 12 }} onClick={() => { setSearch(""); setFilterSector("All Sectors"); setFilterMsme(false); setFilterStartup(false); }}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 120 }}>Tender Ref</th>
                    <th style={{ width: 180 }}>Organisation</th>
                    <th>Tender Title</th>
                    <th style={{ width: 80 }}>Source</th>
                    <th style={{ width: 110 }}>State / Location</th>
                    <th style={{ width: 110, textAlign: "right" }}>Est. Value</th>
                    <th style={{ width: 110 }}>Closing Date</th>
                    <th style={{ width: 100 }}>Status</th>
                    <th style={{ width: 80 }}>AI Score</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((t, idx) => {
                    const isSelected = selected?.id === t.id;
                    const portal     = getPortal(t.source);
                    const status     = getTenderStatus(t);
                    const days       = t.submission_deadline
                      ? differenceInDays(new Date(t.submission_deadline), new Date())
                      : null;
                    const deadlineClass = days === null ? "" : days < 0 ? "col-deadline-ok" : days <= 3 ? "col-deadline-urgent" : days <= 7 ? "col-deadline-warn" : "col-deadline-ok";
                    const score = 70 + (t.id.charCodeAt(0) % 28); // deterministic demo score

                    return (
                      <tr
                        key={t.id}
                        className={isSelected ? "selected" : ""}
                        onClick={() => { setSelected(t); setKbIdx(idx); }}
                      >
                        <td>
                          <div className="col-ref">{(t.source_tender_id || t.id).slice(0, 22)}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.organisation || t.department || "Central Procurement"}
                          </div>
                        </td>
                        <td>
                          <div className="col-title truncate-1" style={{ maxWidth: 300 }}>{t.title}</div>
                          {t.msme_eligible && (
                            <div style={{ fontSize: 10, color: "var(--success)", marginTop: 2, fontWeight: 600 }}>
                              MSME · EMD Exempt
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={portal.cls}>{portal.label}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 12, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
                            <MapPin style={{ width: 11, height: 11, flexShrink: 0 }} />
                            {t.state || "Pan-India"}
                          </span>
                        </td>
                        <td className="col-value">
                          ₹{(t.estimated_cost_lakhs||0).toLocaleString("en-IN")}L
                        </td>
                        <td>
                          <div className={`col-deadline ${deadlineClass}`}>
                            {t.submission_deadline
                              ? format(new Date(t.submission_deadline), "dd MMM yyyy")
                              : "—"}
                          </div>
                          {days !== null && days >= 0 && days <= 7 && (
                            <div style={{ fontSize: 10, color: days <= 3 ? "var(--error)" : "var(--warning)", fontWeight: 600, marginTop: 1 }}>
                              {days === 0 ? "Today" : `${days}d left`}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`status ${status.cls}`}>
                            <span className="status-dot" />
                            {status.label}
                          </span>
                        </td>
                        <td>
                          <div className="score-cell">
                            <div className="score-bar-track">
                              <div className="score-bar-fill" style={{ width: `${score}%` }} />
                            </div>
                            <span className="score-text">{score}%</span>
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={e => { e.stopPropagation(); router.push(`/dashboard/tenders/${t.id}`); }}
                            className="btn btn-ghost btn-icon"
                            style={{ padding: 4 }}
                          >
                            <ChevronRight style={{ width: 14, height: 14 }} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="table-pagination">
              <div className="table-pagination-info">
                Showing {((page-1)*pageSize)+1}–{Math.min(page*pageSize, filtered.length)} of {filtered.length.toLocaleString("en-IN")} procurement records
              </div>
              <div className="table-pagination-controls">
                <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: 12 }} disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</button>
                <span style={{ padding: "0 10px", fontSize: 12, color: "var(--text-muted)" }}>{page} / {total}</span>
                <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: 12 }} disabled={page >= total} onClick={() => setPage(p => p+1)}>Next →</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Tender inspector (right panel) ───────────────────────────────────── */}
        {selected && (
          <TenderInspector tender={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <Loader2 style={{ width: 24, height: 24, animation: "spin 0.8s linear infinite", color: "var(--brand)" }} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
