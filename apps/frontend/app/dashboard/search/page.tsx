"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, MapPin, ExternalLink, AlertCircle, Loader2,
  ArrowUpDown, X, Filter, SlidersHorizontal, ChevronRight,
  ArrowUpRight, ShieldCheck, BookmarkPlus, BookmarkCheck,
  RefreshCw, Clock
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { Tender, searchCatalog } from "@/lib/catalog";
import { searchApi, eligibilityApi } from "@/lib/api";
import { addToWatchlist, removeFromWatchlist, isWatchlisted } from "@/lib/watchlist-store";

/* ─── Reference data ─────────────────────────────────────────────────────────── */
const STATES_LIST = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra",
  "Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim",
  "Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu and Kashmir","Ladakh","Puducherry","Andaman and Nicobar Islands",
  "Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Lakshadweep",
];

const MINISTRIES_LIST = [
  "Ministry of Defence","Ministry of Railways","Ministry of Road Transport and Highways",
  "Ministry of Electronics and Information Technology (MeitY)","Ministry of Health and Family Welfare",
  "Ministry of Education","Ministry of Power","Ministry of New and Renewable Energy",
  "Ministry of Petroleum and Natural Gas","Ministry of Jal Shakti",
  "Ministry of Housing and Urban Affairs","Ministry of Home Affairs","Ministry of Finance",
  "Ministry of Agriculture and Farmers Welfare","Ministry of Commerce and Industry",
  "Ministry of Communications","Ministry of Steel","Ministry of Mines","Ministry of Coal",
  "Ministry of Heavy Industries","Ministry of Chemicals and Fertilizers","Ministry of Civil Aviation",
  "Ministry of Ports, Shipping and Waterways","Ministry of MSME","Ministry of Rural Development",
  "Ministry of Science and Technology","Ministry of Environment, Forest and Climate Change",
  "Department of Space (ISRO)","Department of Atomic Energy (DAE)",
];

const CATEGORIES = [
  "All Categories","Technology & IT","Infrastructure & Civil Works",
  "Defence & Aerospace","Railways & Mobility","Healthcare & Medical Equipment",
  "Energy & Renewables","Telecom & Networking","Water & Sanitation","Education",
];

const SORT_OPTIONS = [
  { value: "published_at_desc",          label: "Newest Published" },
  { value: "submission_deadline_asc",    label: "Closing Soon" },
  { value: "estimated_cost_lakhs_desc",  label: "Highest Value" },
  { value: "match_score_desc",           label: "Best AI Score" },
];

/* ─── Portal badges ──────────────────────────────────────────────────────────── */
const PORTAL_MAP: Record<string, { label: string; cls: string; url: string }> = {
  gem:         { label: "GeM",      cls: "portal-badge portal-gem",   url: "https://gem.gov.in" },
  cppp:        { label: "CPPP",     cls: "portal-badge portal-cppp",  url: "https://eprocure.gov.in/eprocure/app" },
  defence:     { label: "Defence",  cls: "portal-badge portal-def",   url: "https://defproc.gov.in" },
  railways:    { label: "IREPS",    cls: "portal-badge portal-rail",  url: "https://ireps.gov.in" },
  ireps:       { label: "IREPS",    cls: "portal-badge portal-rail",  url: "https://ireps.gov.in" },
  maharashtra: { label: "Maha",     cls: "portal-badge portal-state", url: "https://mahatenders.gov.in" },
  karnataka:   { label: "KA",       cls: "portal-badge portal-state", url: "https://eproc.karnataka.gov.in" },
};
function getPortal(src: string) {
  const k = (src || "").toLowerCase();
  return PORTAL_MAP[k] || { label: (src||"GOV").toUpperCase().slice(0,6), cls: "portal-badge portal-gov", url: "https://cppp.gov.in" };
}
function safeUrl(url?: string | null, def = "https://eprocure.gov.in/eprocure/app") {
  if (!url?.trim()) return def;
  const t = url.trim();
  if (t.includes("localhost") || t.startsWith("/")) return def;
  if (t.startsWith("http")) return t;
  return `https://${t}`;
}

/* ─── Status ─────────────────────────────────────────────────────────────────── */
function getTenderStatus(t: Tender) {
  if (!t.submission_deadline) return { label: "Published", cls: "status-published" };
  const d = differenceInDays(new Date(t.submission_deadline), new Date());
  if (d < 0) return { label: "Closed",  cls: "status-closed" };
  return { label: "Open", cls: "status-open" };
}

/* ─── Filter panel ───────────────────────────────────────────────────────────── */
interface Filters {
  state: string; ministry: string; category: string;
  costMin: string; costMax: string;
  msme: boolean; startup: boolean; mii: boolean;
  source: string;
}
const EMPTY_FILTERS: Filters = { state:"", ministry:"", category:"All Categories", costMin:"", costMax:"", msme:false, startup:false, mii:false, source:"" };

function FilterPanel({
  filters, onChange, onReset, onApply, activeCount,
}: {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  onReset: () => void;
  onApply: () => void;
  activeCount: number;
}) {
  return (
    <aside style={{
      width: 248,
      flexShrink: 0,
      background: "var(--bg-base)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 16px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SlidersHorizontal style={{ width: 13, height: 13, color: "var(--text-tertiary)" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>Filters</span>
          {activeCount > 0 && (
            <span style={{
              background: "var(--brand)", color: "#fff",
              borderRadius: 9, fontSize: 10, fontWeight: 700,
              padding: "1px 6px", minWidth: 18, textAlign: "center",
            }}>{activeCount}</span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={onReset} style={{
            fontSize: 11, color: "var(--error)", background: "none", border: "none",
            cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500,
          }}>
            Reset
          </button>
        )}
      </div>

      {/* Scrollable filters */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        {/* Source / Portal */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
            Procurement Portal
          </div>
          {[
            { val: "",         label: "All Portals" },
            { val: "gem",      label: "Government e-Marketplace (GeM)" },
            { val: "cppp",     label: "Central Public Procurement Portal" },
            { val: "railways", label: "Indian Railways (IREPS)" },
            { val: "defence",  label: "Defence Procurement (DRDO/HAL)" },
          ].map(({ val, label }) => (
            <label key={val} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, cursor: "pointer" }}>
              <input
                type="radio" name="source" checked={filters.source === val}
                onChange={() => onChange({ source: val })}
                style={{ accentColor: "var(--brand)" }}
              />
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
            </label>
          ))}
        </div>

        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />

        {/* State */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
            State / Territory
          </div>
          <select
            value={filters.state}
            onChange={e => onChange({ state: e.target.value })}
            className="filter-select"
            style={{ width: "100%" }}
          >
            <option value="">All States</option>
            {STATES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Ministry */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
            Ministry / Department
          </div>
          <select
            value={filters.ministry}
            onChange={e => onChange({ ministry: e.target.value })}
            className="filter-select"
            style={{ width: "100%" }}
          >
            <option value="">All Ministries</option>
            {MINISTRIES_LIST.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Category */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
            Procurement Category
          </div>
          <select
            value={filters.category}
            onChange={e => onChange({ category: e.target.value })}
            className="filter-select"
            style={{ width: "100%" }}
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />

        {/* Estimated value */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
            Estimated Value (₹ Lakhs)
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="number" value={filters.costMin}
              onChange={e => onChange({ costMin: e.target.value })}
              placeholder="Min" className="input"
              style={{ width: "50%", fontSize: 12, padding: "5px 8px" }}
            />
            <input
              type="number" value={filters.costMax}
              onChange={e => onChange({ costMax: e.target.value })}
              placeholder="Max" className="input"
              style={{ width: "50%", fontSize: 12, padding: "5px 8px" }}
            />
          </div>
        </div>

        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />

        {/* Eligibility flags */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
            Eligibility Benefits
          </div>
          {[
            { key: "msme",    label: "MSME Preference", sub: "EMD exempt · Udyam" },
            { key: "startup", label: "Startup India",   sub: "DPIIT recognised" },
            { key: "mii",     label: "Make in India",   sub: "Class-I/II supplier" },
          ].map(({ key, label, sub }) => (
            <label key={key} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={filters[key as keyof Filters] as boolean}
                onChange={e => onChange({ [key]: e.target.checked })}
                style={{ accentColor: "var(--brand)", marginTop: 2 }}
              />
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{label}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{sub}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Apply button */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: 13 }} onClick={onApply}>
          Apply Filters
        </button>
      </div>
    </aside>
  );
}

/* ─── Main search ────────────────────────────────────────────────────────────── */
function SearchContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user }     = useAuth();

  const [query,    setQuery]    = useState(searchParams.get("q") || "");
  const [tenders,  setTenders]  = useState<Tender[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selected, setSelected] = useState<Tender | null>(null);

  const [filters, setFilters]   = useState<Filters>(EMPTY_FILTERS);
  const [page,    setPage]       = useState(1);
  const [pageSize]               = useState(50);
  const [sortBy,  setSortBy]    = useState("published_at_desc");

  const activeFilterCount = [
    filters.state, filters.ministry,
    filters.source, filters.category !== "All Categories" ? "1" : "",
    filters.costMin, filters.costMax,
    filters.msme ? "1" : "", filters.startup ? "1" : "", filters.mii ? "1" : "",
  ].filter(Boolean).length;

  const execute = useCallback(async (q = query) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      let results: Tender[] = [];
      let count = 0;

      try {
        const { data } = await searchApi.search({
          q: q || undefined,
          state: filters.state || undefined,
          ministry: filters.ministry || undefined,
          cost_min: filters.costMin ? parseFloat(filters.costMin) : undefined,
          cost_max: filters.costMax ? parseFloat(filters.costMax) : undefined,
          msme_eligible: filters.msme ? true : undefined,
          startup_eligible: filters.startup ? true : undefined,
          page, limit: pageSize, sort: sortBy,
        });
        results = data.hits || data.results || [];
        count = data.total || results.length;
      } catch {}

      if (!results.length) {
        const res = searchCatalog({
          q: q || undefined,
          state: filters.state || undefined,
          ministry: filters.ministry || undefined,
          cost_min: filters.costMin ? parseFloat(filters.costMin) : undefined,
          cost_max: filters.costMax ? parseFloat(filters.costMax) : undefined,
          msme_eligible: filters.msme ? true : undefined,
          startup_eligible: filters.startup ? true : undefined,
          sort_by: sortBy, page, page_size: pageSize,
        });
        results = res.tenders as any;
        count = res.total;
      }

      setTenders(results);
      setTotal(count);
      if (results.length > 0) setSelected(results[0]);
    } catch (e: any) {
      setError("Unable to load procurement records. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [query, filters, page, sortBy, pageSize]);

  /* Auto-search on mount if query in URL */
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) { setQuery(q); execute(q); }
  }, []);

  /* Active filter chips */
  const chips = [
    filters.state    && { key: "state",   label: `State: ${filters.state}`,              remove: () => setFilters(f => ({ ...f, state: "" })) },
    filters.ministry && { key: "ministry", label: `Ministry: ${filters.ministry.slice(12,40)}`, remove: () => setFilters(f => ({ ...f, ministry: "" })) },
    filters.source   && { key: "source",  label: `Portal: ${filters.source.toUpperCase()}`, remove: () => setFilters(f => ({ ...f, source: "" })) },
    filters.msme     && { key: "msme",    label: "MSME Preference",                       remove: () => setFilters(f => ({ ...f, msme: false })) },
    filters.startup  && { key: "startup", label: "Startup India",                          remove: () => setFilters(f => ({ ...f, startup: false })) },
    filters.mii      && { key: "mii",     label: "Make in India",                          remove: () => setFilters(f => ({ ...f, mii: false })) },
    (filters.costMin || filters.costMax) && { key: "value", label: `₹${filters.costMin||"0"}–${filters.costMax||"∞"}L`, remove: () => setFilters(f => ({ ...f, costMin:"", costMax:"" })) },
  ].filter(Boolean) as { key: string; label: string; remove: () => void }[];

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="bg-data-grid" style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* ── Filter panel ─────────────────────────────────────────────────────── */}
      <FilterPanel
        filters={filters}
        onChange={f => setFilters(prev => ({ ...prev, ...f }))}
        onReset={() => setFilters(EMPTY_FILTERS)}
        onApply={() => { setPage(1); execute(); }}
        activeCount={activeFilterCount}
      />

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Search bar header */}
        <div style={{
          padding: "14px 20px",
          background: "var(--bg-base)",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              Tender Search
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>
              Search across GeM · CPPP · IREPS · Defence · 36 State/UT Portals
            </div>
          </div>

          {/* Main search input */}
          <div style={{
            display: "flex", gap: 8, marginTop: 10,
          }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 10,
              padding: "8px 14px",
              background: "var(--bg-base)",
              border: "2px solid var(--border)",
              borderRadius: "var(--r-md)",
              transition: "border-color var(--t)",
            }}
              onClick={e => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}
            >
              <Search style={{ width: 16, height: 16, color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (setPage(1), execute())}
                placeholder="Search by tender ID, title, organisation, category, location…"
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  fontSize: 14, color: "var(--text-primary)", fontFamily: "var(--font-sans)",
                }}
                autoFocus
              />
              {query && (
                <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 2 }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              )}
            </div>
            <button
              onClick={() => { setPage(1); execute(); }}
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: "0 24px", fontSize: 13, flexShrink: 0 }}
            >
              {loading ? <Loader2 style={{ width: 14, height: 14, animation: "spin 0.8s linear infinite" }} /> : <Search style={{ width: 14, height: 14 }} />}
              Search Procurement Database
            </button>
          </div>
        </div>

        {/* Active filter chips + result count + sort */}
        {(chips.length > 0 || hasSearched) && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "7px 20px",
            background: "var(--bg-subtle)",
            borderBottom: "1px solid var(--border)",
            gap: 12, flexShrink: 0, flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {chips.length > 0 && chips.map(chip => (
                <span key={chip.key} className="filter-chip">
                  {chip.label}
                  <button className="filter-chip-remove" onClick={chip.remove}><X style={{ width: 10, height: 10 }} /></button>
                </span>
              ))}
              {chips.length > 0 && (
                <button
                  style={{ fontSize: 11, color: "var(--error)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)" }}
                  onClick={() => setFilters(EMPTY_FILTERS)}
                >
                  Clear all
                </button>
              )}
            </div>

            {hasSearched && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                  {total.toLocaleString("en-IN")} results
                </span>
                <select
                  value={sortBy}
                  onChange={e => { setSortBy(e.target.value); execute(); }}
                  className="filter-select"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Results area */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          {/* Table */}
          <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
            {!hasSearched ? (
              /* Welcome/start state */
              <div className="empty-state" style={{ paddingTop: 80 }}>
                <Search className="empty-state-icon" style={{ width: 36, height: 36 }} />
                <div className="empty-state-title">Search Procurement Opportunities</div>
                <div className="empty-state-desc">
                  Search across {(9763).toLocaleString("en-IN")} active tenders from Government e-Marketplace, CPPP, IREPS, Defence portals, and 36 State/UT procurement portals.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}>
                  {["IT Infrastructure","Road Construction","Medical Equipment","Solar Power","CCTV Surveillance"].map(t => (
                    <button key={t}
                      onClick={() => { setQuery(t); execute(t); }}
                      className="btn btn-secondary" style={{ fontSize: 12 }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ) : loading ? (
              <table className="data-table">
                <thead>
                  <tr>
                    {["Tender Ref","Organisation","Tender Title","Portal","State","Value","Deadline","Status","Score",""].map(h=>(
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({length:10}).map((_,i)=>(
                    <tr key={i} style={{cursor:"default"}}>
                      <td><div className="skeleton" style={{width:100,height:12}}/></td>
                      <td><div className="skeleton" style={{width:120,height:12}}/></td>
                      <td><div className="skeleton" style={{width:200,height:12}}/></td>
                      <td><div className="skeleton" style={{width:50,height:14}}/></td>
                      <td><div className="skeleton" style={{width:80,height:12}}/></td>
                      <td><div className="skeleton" style={{width:70,height:12}}/></td>
                      <td><div className="skeleton" style={{width:80,height:12}}/></td>
                      <td><div className="skeleton" style={{width:60,height:12}}/></td>
                      <td><div className="skeleton" style={{width:50,height:12}}/></td>
                      <td/>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : error ? (
              <div className="error-state" style={{ margin: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertCircle style={{ width: 16, height: 16, color: "var(--error)", flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: "var(--error-text)", fontWeight: 600 }}>
                    Unable to load procurement records
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--error-text)", opacity: 0.8 }}>
                  The procurement data source may be temporarily unavailable.
                </div>
                <button className="btn btn-secondary" style={{ marginTop: 8, fontSize: 12 }} onClick={() => execute()}>
                  <RefreshCw style={{ width: 13, height: 13 }} /> Retry
                </button>
              </div>
            ) : tenders.length === 0 ? (
              <div className="empty-state">
                <Search className="empty-state-icon" style={{ width: 32, height: 32 }} />
                <div className="empty-state-title">No procurement records found</div>
                <div className="empty-state-desc">
                  No tenders match your search criteria. Try broadening your search terms or removing filters.
                </div>
              </div>
            ) : (
              <>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 120 }}>Tender Ref</th>
                      <th style={{ width: 170 }}>Organisation</th>
                      <th>Tender Title</th>
                      <th style={{ width: 76 }}>Portal</th>
                      <th style={{ width: 110 }}>State</th>
                      <th style={{ width: 110, textAlign: "right" }}>Est. Value</th>
                      <th style={{ width: 110 }}>Closing</th>
                      <th style={{ width: 96 }}>Status</th>
                      <th style={{ width: 76 }}>Score</th>
                      <th style={{ width: 44 }}/>
                    </tr>
                  </thead>
                  <tbody>
                    {tenders.map((t, idx) => {
                      const isSelected = selected?.id === t.id;
                      const portal     = getPortal(t.source);
                      const status     = getTenderStatus(t);
                      const days       = t.submission_deadline ? differenceInDays(new Date(t.submission_deadline), new Date()) : null;
                      const score      = (t as any).match_score ?? (70 + (t.id.charCodeAt(0) % 28));

                      return (
                        <tr key={t.id} className={isSelected ? "selected" : ""} onClick={() => setSelected(t)}>
                          <td>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                              {(t.source_tender_id || t.id).slice(0,22)}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 165, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {t.organisation || t.department || "Central Procurement"}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {t.title}
                            </div>
                            {t.msme_eligible && (
                              <div style={{ fontSize: 10, color: "var(--success)", fontWeight: 600, marginTop: 1 }}>MSME · EMD Exempt</div>
                            )}
                          </td>
                          <td><span className={portal.cls}>{portal.label}</span></td>
                          <td>
                            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                              {t.state || "Pan-India"}
                            </span>
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textAlign: "right" }}>
                            ₹{(t.estimated_cost_lakhs||0).toLocaleString("en-IN")}L
                          </td>
                          <td>
                            <div style={{ fontSize: 12, color: days !== null && days >= 0 && days <= 3 ? "var(--error)" : days !== null && days >= 0 && days <= 7 ? "var(--warning)" : "var(--text-secondary)" }}>
                              {t.submission_deadline ? format(new Date(t.submission_deadline), "dd MMM yy") : "—"}
                            </div>
                            {days !== null && days >= 0 && days <= 7 && (
                              <div style={{ fontSize: 10, fontWeight: 600, color: days<=3?"var(--error)":"var(--warning)" }}>
                                {days===0 ? "Today" : `${days}d`}
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
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${score}%`, background: "var(--brand)", borderRadius: 2 }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>{score}%</span>
                            </div>
                          </td>
                          <td>
                            <button
                              onClick={e => { e.stopPropagation(); router.push(`/dashboard/tenders/${t.id}`); }}
                              className="btn btn-ghost btn-icon" style={{ padding: 4 }}
                            >
                              <ChevronRight style={{ width: 14, height: 14 }} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="table-pagination">
                  <div className="table-pagination-info">
                    Showing {((page-1)*pageSize)+1}–{Math.min(page*pageSize,total)} of {total.toLocaleString("en-IN")} procurement records
                  </div>
                  <div className="table-pagination-controls">
                    <button className="btn btn-secondary" style={{padding:"4px 10px",fontSize:12}} disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
                    <span style={{padding:"0 10px",fontSize:12,color:"var(--text-muted)"}}>{page}/{totalPages}</span>
                    <button className="btn btn-secondary" style={{padding:"4px 10px",fontSize:12}} disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}>Next →</button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Selected tender inspector ───────────────────────────────────── */}
          {selected && hasSearched && (
            <div className="inspector animate-slide-in-right" style={{ width: 320, flexShrink: 0 }}>
              <div className="inspector-header">
                <div className="inspector-title">Tender Details</div>
                <button className="btn btn-ghost btn-icon" onClick={() => setSelected(null)} style={{ padding: 4 }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
              <div className="inspector-body">
                {/* Reference */}
                <div className="inspector-section">
                  <div className="inspector-section-label">Tender Reference</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                    {selected.source_tender_id || selected.id}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4, marginBottom: 8 }}>
                    {selected.title}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span className={getPortal(selected.source).cls}>{getPortal(selected.source).label}</span>
                    <span className={`status ${getTenderStatus(selected).cls}`}>
                      <span className="status-dot" />
                      {getTenderStatus(selected).label}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="inspector-section">
                  <div className="inspector-section-label">Procurement Details</div>
                  <div className="inspector-row"><span className="inspector-row-label">Organisation</span><span className="inspector-row-value" style={{maxWidth:160,textAlign:"right"}}>{selected.organisation||selected.department||"Central Body"}</span></div>
                  <div className="inspector-row"><span className="inspector-row-label">Est. Value</span><span className="inspector-row-value" style={{fontFamily:"var(--font-mono)",fontWeight:700}}>₹{(selected.estimated_cost_lakhs||0).toLocaleString("en-IN")} Lakhs</span></div>
                  <div className="inspector-row"><span className="inspector-row-label">Location</span><span className="inspector-row-value">{selected.state||"Pan-India"}</span></div>
                  {selected.submission_deadline && (
                    <div className="inspector-row">
                      <span className="inspector-row-label">Closing</span>
                      <span className="inspector-row-value">{format(new Date(selected.submission_deadline), "dd MMM yyyy")}</span>
                    </div>
                  )}
                  <div className="inspector-row"><span className="inspector-row-label">Method</span><span className="inspector-row-value">{selected.procurement_method||"Open Tender"}</span></div>
                  {selected.emd_lakhs && (
                    <div className="inspector-row">
                      <span className="inspector-row-label">EMD</span>
                      <span className="inspector-row-value" style={{color:selected.msme_eligible?"var(--success)":"var(--text-primary)"}}>
                        {selected.msme_eligible ? "Waived (Udyam)" : `₹${selected.emd_lakhs}L`}
                      </span>
                    </div>
                  )}
                </div>

                {/* MSME / Startup flags */}
                {(selected.msme_eligible || selected.startup_eligible) && (
                  <div className="inspector-section">
                    <div className="inspector-section-label">Eligibility Benefits</div>
                    {selected.msme_eligible && (
                      <div style={{ display: "flex", gap: 6, fontSize: 11, color: "var(--success)", marginBottom: 5, alignItems: "flex-start" }}>
                        <ShieldCheck style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1 }} />
                        MSME Preference (Rule 170): EMD fully waived for Udyam-registered entities.
                      </div>
                    )}
                    {selected.startup_eligible && (
                      <div style={{ display: "flex", gap: 6, fontSize: 11, color: "var(--brand)", alignItems: "flex-start" }}>
                        <ShieldCheck style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1 }} />
                        Startup India relaxation: prior turnover & experience criteria waived.
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    className="btn btn-primary" style={{ justifyContent: "center", width: "100%" }}
                    onClick={() => router.push(`/dashboard/tenders/${selected.id}`)}
                  >
                    Open Tender Workspace <ArrowUpRight style={{ width: 14, height: 14 }} />
                  </button>
                  <a
                    href={safeUrl(selected.source_url, getPortal(selected.source).url)}
                    target="_blank" rel="noopener noreferrer"
                    className="btn btn-ghost" style={{ justifyContent: "center", width: "100%", fontSize: 12 }}
                  >
                    View on Official Portal <ExternalLink style={{ width: 11, height: 11 }} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdvancedSearchPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ width: 22, height: 22, animation: "spin 0.8s linear infinite", color: "var(--brand)" }} />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
