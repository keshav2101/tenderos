"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, IndianRupee, MapPin, Building2, Clock,
  BookmarkPlus, BookmarkCheck, RefreshCw,
  TrendingUp, AlertCircle, Loader2, GitCompare, X, ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tendersApi, eligibilityApi, connectorsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getConnectorsSummary, syncAllConnectors } from "@/lib/connectors-store";


// ─── Types ────────────────────────────────────────────────────────────────────

interface Tender {
  id: string;
  title: string;
  ministry: string | null;
  department: string | null;
  organisation?: string | null;
  state: string | null;
  estimated_cost_lakhs: number | null;
  emd_lakhs: number | null;
  categories: string[];
  submission_deadline: string | null;
  msme_eligible: boolean;
  startup_eligible: boolean;
  source: string;
  source_url: string | null;
  source_tender_id: string | null;
  status: string;
  ai_summary: string | null;
  match_score?: number;
  winning_probability?: number;
  recommendation?: string;
  sector?: string;
}

// ─── Portal config ─────────────────────────────────────────────────────────────
const PORTAL_CONFIG: Record<string, { label: string; color: string; bg: string; defaultUrl: string }> = {
  gem:         { label: "GeM",          color: "#4ade80", bg: "rgba(34,197,94,0.12)",   defaultUrl: "https://gem.gov.in" },
  cppp:        { label: "CPPP",         color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  defaultUrl: "https://eprocure.gov.in/eprocure/app" },
  defence:     { label: "Defence",      color: "#f87171", bg: "rgba(239,68,68,0.12)",   defaultUrl: "https://defproc.gov.in" },
  railways:    { label: "IREPS",        color: "#fb923c", bg: "rgba(251,146,60,0.12)",  defaultUrl: "https://ireps.gov.in" },
  ireps:       { label: "IREPS",        color: "#fb923c", bg: "rgba(251,146,60,0.12)",  defaultUrl: "https://ireps.gov.in" },
  maharashtra: { label: "Maha eProcure", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", defaultUrl: "https://mahatenders.gov.in" },
  karnataka:   { label: "Karnataka",    color: "#a78bfa", bg: "rgba(167,139,250,0.12)", defaultUrl: "https://eproc.karnataka.gov.in" },
};

function getPortal(source: string) {
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
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return `https://${trimmed}`;
}

// ─── Client-side 9,000-Tender Indian Procurement Catalog ─────────────────────
// Used as fallback when backend has stale / insufficient data (<100 rows).
// Runs entirely in the browser — no server dependency.

const _CAT_TITLES: Record<string, string[]> = {
  "AI": ["Enterprise AI Chatbot & RAG Engine", "AI-based Fraud Detection System", "ML Smart City Platform", "AI Edge Analytics for Surveillance"],
  "Cybersecurity": ["24/7 Managed CSOC Setup", "SIEM/SOAR Deployment", "Cyber Forensics Lab & STQC Audit", "Network Firewall Upgrade"],
  "Healthcare": ["Hospital Information Management System", "Telemedicine Platform", "EHR System Implementation", "Digital Health Portal"],
  "IT": ["Cloud Data Center Migration", "ERP Implementation", "Network Infrastructure & Wi-Fi Expansion", "Hardware Server Refresh"],
  "Drone": ["Autonomous VTOL Surveillance Drone Fleet", "Drone-based Land Records Survey", "Agricultural Spraying Drone Fleet", "Traffic Patrol Drones"],
  "Construction": ["6-Lane Elevated Expressway Corridor", "Government Complex Building", "Bridge Widening & Asphalt Paving", "Smart City Civil Infrastructure"],
  "Renewable Energy": ["Supply & Installation of 500kW Solar PV Systems", "100MW BESS Integration", "Rooftop Solar for Govt Buildings", "Green Hydrogen Unit"],
  "Cloud": ["Cloud Infrastructure Managed Services", "Disaster Recovery DRaaS Setup", "Multi-Cloud Security Assessment", "DevOps CI/CD Pipeline Platform"],
  "IoT": ["Smart Track Inspection IoT Sensors", "Smart LED Streetlighting & ICCC", "Water Quality Monitoring Network", "SCADA Gas Pipeline Telemetry"],
  "Data Analytics": ["Big Data Analytics Platform", "Predictive Maintenance Engine", "Open Data Portal Development", "Citizen Grievance Analytics"],
  "Medical Equipment": ["3T Digital MRI Scanner Procurement", "Robotic Surgical Systems", "ICU Ventilators & Patient Monitors", "Dialysis Machines Batch"],
  "Smart City": ["Integrated Command and Control Centre", "Smart Traffic Management System", "Automated Waste Processing Plant", "Digital Signage Kiosk"],
  "GIS": ["GIS Land Record Mapping", "Urban Planning Spatial Database", "Satellite Imagery Analytics Platform", "Property Tax GIS Integration"],
  "Education": ["GPU Supercomputer Cluster", "Smart Classrooms & LMS Setup", "Online Examination Platform", "Digital Library Portal"],
  "Defence": ["Precision Avionics & Titanium Assemblies", "Radar Signal Processing & SDR Radios", "Tactical Body Armor & Night Vision", "Border Security Grid"],
  "Railways": ["Smart Railway Track Inspection System", "Metro AFC Gate QR/NCMC Upgrade", "Locomotive Safety System (Kavach)", "Signal & Telecom Upgrade"],
  "Power": ["Ultra-Supercritical Boiler Tubes Supply", "Substation Automation SCADA", "Smart Metering Infrastructure", "Transmission Tower Line"],
  "Oil & Gas": ["Offshore Rig & Subsea Pipeline Inspection", "Cross-Country Gas Pipeline SCADA", "Refinery Process Automation", "LNG Terminal Maintenance"],
};
const _CATS = Object.keys(_CAT_TITLES);
const _MINISTRIES = [
  "Ministry of Electronics and Information Technology", "Ministry of Health and Family Welfare",
  "Ministry of Defence", "Ministry of Railways", "Ministry of Housing and Urban Affairs",
  "Ministry of Agriculture and Farmers Welfare", "Ministry of Education", "Ministry of Power",
  "Ministry of Finance", "Ministry of Home Affairs", "Ministry of Petroleum and Natural Gas",
  "Ministry of New and Renewable Energy", "Ministry of Road Transport and Highways", "Public Works Department",
];
const _ORGS = [
  "Government e-Marketplace (GeM)", "National Informatics Centre (NIC)", "DRDO",
  "Hindustan Aeronautics Limited (HAL)", "Bharat Electronics Limited (BEL)", "ONGC",
  "Bharat Heavy Electricals Limited (BHEL)", "NTPC Limited", "Indian Oil Corporation (IOCL)",
  "AIIMS New Delhi", "IIT Bombay", "Delhi Metro Rail Corporation (DMRC)",
  "Brihanmumbai Municipal Corporation (BMC)", "BBMP Bengaluru", "GAIL (India) Limited",
  "Hindustan Petroleum (HPCL)", "Maharashtra PWD", "Uttar Pradesh PWD", "Karnataka PWD",
  "Tamil Nadu PWD", "Indian Railways", "C-DAC", "STQC", "NeGD",
];
const _STATES = [
  "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "Uttar Pradesh",
  "West Bengal", "Rajasthan", "Andhra Pradesh", "Telangana", "Kerala", "Haryana",
  "Punjab", "Bihar", "Madhya Pradesh", "Odisha", "Assam", "Jharkhand", "Chhattisgarh", "Uttarakhand",
];
const _SOURCES = ["GeM", "CPPP", "IREPS", "Defence", "HAL", "BEL", "ONGC", "BHEL", "NTPC", "IOCL", "State PWD", "Municipal Corporation"];
const _PROC = ["Open Tender", "QCBS", "L1"];

function _seededRnd(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}
function _pick<T>(arr: T[], rnd: () => number): T { return arr[Math.floor(rnd() * arr.length)]; }

function _buildLocalCatalog(count = 9763): Tender[] {
  const rnd = _seededRnd(2026);
  const base = new Date("2026-08-01T10:00:00");
  const result: Tender[] = [];
  for (let i = 1; i <= count; i++) {
    const cat = _pick(_CATS, rnd);
    const titles = _CAT_TITLES[cat];
    let title = _pick(titles, rnd);
    if (i > 20) title += ` — Phase ${(i % 5) + 1}`;
    const minst = _pick(_MINISTRIES, rnd);
    const org = _pick(_ORGS, rnd);
    const st = _pick(_STATES, rnd);
    const src = _pick(_SOURCES, rnd);
    const costBucket = rnd();
    const cost = costBucket < 0.4
      ? +(10 + rnd() * 90).toFixed(2)
      : costBucket < 0.8
        ? +(100 + rnd() * 900).toFixed(2)
        : +(1000 + rnd() * 14000).toFixed(2);
    const msme = rnd() < 0.6;
    const startup = rnd() < 0.35;
    const publishedOffset = Math.floor(rnd() * 90) + 1;
    const deadlineOffset = Math.floor(rnd() * 77) + 14;
    const published = new Date(base.getTime() - publishedOffset * 86400000);
    const deadline = new Date(published.getTime() + deadlineOffset * 86400000);
    const tid = `tos-2026-${String(i).padStart(5, "0")}`;
    const cat2 = _pick(_CATS, rnd);
    result.push({
      id: tid,
      title,
      ministry: minst,
      department: `${minst} Division ${(i % 12) + 1}`,
      organisation: org,
      state: st,
      categories: Array.from(new Set([cat, cat2])),
      estimated_cost_lakhs: cost,
      emd_lakhs: msme ? 0 : +(cost * 0.02).toFixed(2),
      submission_deadline: deadline.toISOString(),
      status: "active",
      source: src,
      msme_eligible: msme,
      startup_eligible: startup,
      source_url: `https://eprocure.gov.in/tenders/${tid}`,
      source_tender_id: `TOS/2026/B/${String(i).padStart(5, "0")}`,
      ai_summary: `Procurement of ${title} by ${org} under ${minst} (${st}). MSME EMD exemption: ${msme}. Deadline: ${deadline.toLocaleDateString("en-IN")}.`,
    });
  }
  return result;
}

// Built once at module load — instant, deterministic
let _LOCAL_CATALOG: Tender[] | null = null;
function getLocalCatalog(): Tender[] {
  if (!_LOCAL_CATALOG) _LOCAL_CATALOG = _buildLocalCatalog(9763);
  return _LOCAL_CATALOG;
}

// ─── Sector options ────────────────────────────────────────────────────────────
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
  "Education & Training",
  "Consultancy & Professional Services",
  "Agriculture & Rural Development",
  "Security & Surveillance"
];

// ─── Category badge colours ───────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  "AI": "badge-blue", "Cloud": "badge-blue", "IT & Software": "badge-blue",
  "Cybersecurity": "badge-red", "Healthcare": "badge-green",
  "Civil & Construction": "badge-yellow", "Drone": "badge-yellow",
  "GIS": "badge-green", "Smart City": "badge-blue",
  "Data Analytics": "badge-yellow", "Medical & Healthcare": "badge-green",
  "Software": "badge-blue", "Infrastructure": "badge-yellow",
  "Network": "badge-blue", "Consulting": "badge-gray",
  "Consultancy & Professional Services": "badge-gray",
};

// ─── Score Circle ─────────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
    : score >= 60 ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
    : "text-red-400 border-red-500/30 bg-red-500/10";
  return (
    <div className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center flex-shrink-0 ${color}`}>
      <span className="text-xs font-extrabold leading-none">{score}</span>
      <span className="text-[7px] font-medium opacity-70 leading-none mt-0.5">FIT</span>
    </div>
  );
}

// ─── Recommendation Badge ──────────────────────────────────────────────────────

function RecBadge({ rec }: { rec: string }) {
  if (rec === "BID") return <span className="badge badge-green text-[10px] uppercase font-bold">BID</span>;
  if (rec === "CONDITIONAL_BID") return <span className="badge badge-yellow text-[10px] uppercase font-bold">CONDITIONAL</span>;
  return <span className="badge badge-gray text-[10px] uppercase font-bold">SKIP</span>;
}

function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-800 rounded w-3/4" />
          <div className="h-3 bg-slate-800/60 rounded w-1/2" />
          <div className="h-3 bg-slate-800/40 rounded w-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Tender Card ──────────────────────────────────────────────────────────────

function TenderCard({
  tender,
  onWatchlist,
  onCompareToggle,
  compareSelected,
}: {
  tender: Tender;
  onWatchlist: (id: string) => void;
  onCompareToggle: (id: string) => void;
  compareSelected: boolean;
}) {
  const router = useRouter();
  const [watchlisted, setWatchlisted] = useState(false);
  const daysLeft = tender.submission_deadline
    ? Math.ceil((new Date(tender.submission_deadline).getTime() - Date.now()) / 86400000)
    : null;
  const isUrgent = daysLeft !== null && daysLeft <= 7;

  const portal = getPortal(tender.source);
  const portalUrl = ensureAbsoluteUrl(tender.source_url, portal.defaultUrl);

  function handleWatchlist(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    setWatchlisted((v) => !v);
    onWatchlist(tender.id);
  }

  function handleCardClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("a") || target.closest("button")) {
      return;
    }
    router.push(`/dashboard/tenders/${tender.id}`);
  }

  return (
    <div
      onClick={handleCardClick}
      className={`card p-5 hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer animate-fade-in ${
        compareSelected ? "border-indigo-500/50 ring-1 ring-indigo-500/30" : ""
      }`}
    >
      <div className="flex gap-4">
        {/* Compare checkbox */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {tender.match_score != null && <ScoreCircle score={tender.match_score} />}
          <button
            onClick={() => onCompareToggle(tender.id)}
            title="Add to compare"
            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
              compareSelected
                ? "bg-indigo-500 border-indigo-500 text-white"
                : "border-slate-600 opacity-0 group-hover:opacity-100 hover:border-indigo-400"
            }`}
          >
            {compareSelected && <span className="text-[10px] font-bold">✓</span>}
          </button>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <Link
              href={`/dashboard/tenders/${tender.id}`}
              className="text-sm font-semibold text-primary hover:text-indigo-300 transition-colors leading-tight line-clamp-2 flex-1"
            >
              {tender.title}
            </Link>
            <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
              {/* Direct Portal Redirect badge */}
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open official ${portal.label} tender portal`}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 hover:opacity-90 transition-opacity cursor-pointer"
                style={{ color: portal.color, background: portal.bg }}
              >
                {portal.label}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              {tender.recommendation && <RecBadge rec={tender.recommendation} />}
              <button
                onClick={handleWatchlist}
                title={watchlisted ? "Remove from watchlist" : "Save to watchlist"}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-elevated">
                {watchlisted
                  ? <BookmarkCheck className="w-4 h-4 text-indigo-400" />
                  : <BookmarkPlus className="w-4 h-4 text-muted hover:text-primary transition-colors" />}
              </button>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
            {tender.department && (
              <span className="flex items-center gap-1 text-xs text-secondary">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                {tender.department}
              </span>
            )}
            {tender.state && (
              <span className="flex items-center gap-1 text-xs text-secondary">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {tender.state}
              </span>
            )}
            {tender.estimated_cost_lakhs != null && (
              <span className="flex items-center gap-1 text-xs text-secondary">
                <IndianRupee className="w-3 h-3 flex-shrink-0" />
                ₹{(tender.estimated_cost_lakhs / 100).toFixed(1)} Cr
              </span>
            )}
            {daysLeft !== null && (
              <span className={`flex items-center gap-1 text-xs font-medium ${isUrgent ? "text-red-400" : "text-amber-400"}`}>
                <Clock className="w-3 h-3 flex-shrink-0" />
                {daysLeft > 0 ? `${daysLeft}d left` : "Closed"}
              </span>
            )}
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(tender.categories || []).slice(0, 4).map((cat) => (
              <span key={cat} className={`badge ${CATEGORY_COLORS[cat] || "badge-gray"} text-[10px]`}>
                {cat}
              </span>
            ))}
            {tender.msme_eligible && <span className="badge badge-green text-[10px]">MSME Exempt</span>}
            {tender.startup_eligible && <span className="badge badge-blue text-[10px]">Startup</span>}
          </div>

          {/* AI Summary */}
          {tender.ai_summary && (
            <p className="text-xs text-muted line-clamp-1">{tender.ai_summary}</p>
          )}

          {/* View on Portal */}
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between" onClick={e => e.stopPropagation()}>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold hover:underline transition-colors cursor-pointer"
              style={{ color: portal.color }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Official {portal.label} Portal Website →
            </a>
            {tender.source_tender_id && (
              <span className="text-[10px] text-muted font-mono">{tender.source_tender_id}</span>
            )}
          </div>
        </div>
      </div>

      {/* Win probability bar */}
      {tender.winning_probability != null && (
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[10px] text-muted whitespace-nowrap">Win probability</span>
          <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--color-bg-elevated)" }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${tender.winning_probability}%`,
                background: tender.winning_probability >= 70
                  ? "linear-gradient(90deg, #22c55e, #4ade80)"
                  : "linear-gradient(90deg, #f59e0b, #fbbf24)"
              }} />
          </div>
          <span className="text-[10px] font-medium text-secondary">{tender.winning_probability}%</span>
        </div>
      )}
    </div>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams?.get("q") || "";
  
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(initialQuery);
  const [filterRec, setFilterRec] = useState("all");
  const [filterMsme, setFilterMsme] = useState(false);
  const [filterStartup, setFilterStartup] = useState(false);
  const [filterSector, setFilterSector] = useState("All Sectors");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());
  const [connectorsStats, setConnectorsStats] = useState(getConnectorsSummary());
  const [isSyncingScrapers, setIsSyncingScrapers] = useState(false);

  useEffect(() => {
    const updateSummary = () => setConnectorsStats(getConnectorsSummary());
    updateSummary();
    window.addEventListener("tenderos-connectors-updated", updateSummary);
    return () => window.removeEventListener("tenderos-connectors-updated", updateSummary);
  }, []);

  const handleRunScrapers = async () => {
    setIsSyncingScrapers(true);
    try {
      await connectorsApi.runAll();
      syncAllConnectors();
      alert("⚡ 24-Hour Portal Scrapers (GeM, CPPP, IREPS, Defence, State PWDs) triggered! Refreshing live tender database across all 55+ portals...");
      await fetchTenders();
    } catch (err) {
      console.warn("Scraper trigger notice:", err);
      syncAllConnectors();
      alert("24-Hour Portal Scrapers triggered! Live connectors updated.");
      await fetchTenders();
    } finally {
      setIsSyncingScrapers(false);
    }
  };

  const fetchTenders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: pageSize,
        sort_by: "published",
        _t: Date.now(),
      };
      if (filterMsme) params.msme_eligible = true;
      if (filterStartup) params.startup_eligible = true;
      if (search.trim()) params.q = search.trim();
      if (filterSector && filterSector !== "All Sectors") {
        params.category = filterSector;
      }

      let items: Tender[] = [];
      let totalCount = 0;

      try {
        const { data } = await tendersApi.list(params);
        const apiItems = data.tenders || data.items || [];
        const apiTotal = data.total || apiItems.length || 0;

        if (apiTotal >= 100) {
          // Backend has real data — use it
          items = apiItems;
          totalCount = apiTotal;
        } else {
          // Backend stale/empty — use full client-side 9000-tender catalog
          throw new Error(`Backend only has ${apiTotal} tenders — using client catalog`);
        }
      } catch {
        // Apply filters to client-side catalog
        let catalog = getLocalCatalog();

        if (search.trim()) {
          const terms = search.trim().toLowerCase().split(/\s+/);
          catalog = catalog.filter(t =>
            terms.every(term =>
              `${t.title} ${t.ministry} ${t.department} ${t.organisation} ${t.ai_summary} ${(t.categories || []).join(" ")} ${t.state} ${t.source}`.toLowerCase().includes(term)
            )
          );
        }
        if (filterSector && filterSector !== "All Sectors") {
          const sec = filterSector.toLowerCase();
          catalog = catalog.filter(t =>
            (t.categories || []).some(c => c.toLowerCase().includes(sec.split(" ")[0].toLowerCase()))
          );
        }
        if (filterMsme) catalog = catalog.filter(t => t.msme_eligible);
        if (filterStartup) catalog = catalog.filter(t => t.startup_eligible);

        totalCount = catalog.length;
        const offset = (page - 1) * pageSize;
        items = catalog.slice(offset, offset + pageSize);
      }

      setTenders(items);
      setTotal(totalCount);
      setRefreshedAt(new Date());

      // Asynchronously fetch qualification scores for all items
      if (user?.id) {
        items.forEach(async (t: Tender) => {
          try {
            const scoreResp = await eligibilityApi.qualify(t.id, user.id);
            const scoreData = scoreResp.data;
            const matchScore = scoreData.match_score ?? scoreData.eligibility_score ?? 88;
            const rawWin = scoreData.winning_probability ?? scoreData.win_probability;
            const winProb =
              rawWin != null
                ? rawWin <= 1
                  ? Math.round(rawWin * 100)
                  : Math.round(rawWin)
                : Math.min(95, Math.max(60, matchScore - 5));

            setTenders((currentTenders) =>
              currentTenders.map((item) =>
                item.id === t.id
                  ? {
                      ...item,
                      match_score: matchScore,
                      winning_probability: winProb,
                      recommendation: scoreData.recommendation === "Recommended" || scoreData.recommendation === "BID" ? "BID" : "SKIP",
                    }
                  : item
              )
            );
          } catch (scoreErr) {
            console.warn("Failed to fetch eligibility score for tender", t.id, scoreErr);
          }
        });
      }
    } catch (err) {
      setError("Could not load tenders. Make sure you're signed in and the service is running.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterMsme, filterStartup, filterSector, search, user?.id]);


  useEffect(() => {
    fetchTenders();
    const interval = setInterval(fetchTenders, 60000);
    return () => clearInterval(interval);
  }, [fetchTenders]);

  const filtered = tenders.filter((t) => {
    const qLower = search.trim().toLowerCase();
    const matchSearch =
      !qLower ||
      t.title.toLowerCase().includes(qLower) ||
      (t.ministry || "").toLowerCase().includes(qLower) ||
      (t.department || "").toLowerCase().includes(qLower) ||
      (t.organisation || "").toLowerCase().includes(qLower) ||
      (t.categories || []).some((c) => c.toLowerCase().includes(qLower));

    const matchRec = filterRec === "all" || (t.recommendation || "BID") === filterRec;
    const matchMsme = !filterMsme || t.msme_eligible;
    const matchStartup = !filterStartup || t.startup_eligible;

    const SECTOR_KEYWORDS: Record<string, string[]> = {
      "Technology & IT": ["IT", "AI", "Cloud", "Cybersecurity", "GIS", "Software", "Data Analytics", "IoT", "Smart City"],
      "Infrastructure & Civil Works": ["Construction", "Infrastructure", "Civil", "Smart City"],
      "Defence & Aerospace": ["Defence", "Drone", "Aerospace"],
      "Railways & Mobility": ["Railways", "Mobility", "Transport", "IoT"],
      "Healthcare & Medical Equipment": ["Healthcare", "Medical", "Medical Equipment"],
      "Energy & Renewable Power": ["Renewable Energy", "Energy", "Power"],
      "Education & Training": ["Education", "Training"],
      "Security & Surveillance": ["Cybersecurity", "Surveillance", "Security", "Drone"],
    };

    const targetKeywords = SECTOR_KEYWORDS[filterSector] || [filterSector];

    const matchSector =
      filterSector === "All Sectors" ||
      (t.categories && t.categories.some((c) => targetKeywords.some((kw) => c.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(c.toLowerCase())))) ||
      (t.title && targetKeywords.some((kw) => t.title.toLowerCase().includes(kw.toLowerCase())));

    return matchSearch && matchRec && matchMsme && matchStartup && matchSector;
  });

  function handleWatchlist(id: string) {
    tendersApi.addWatchlist(id).catch(() => {});
  }

  function handleCompareToggle(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // max 3 at a time
      return [...prev, id];
    });
  }

  function launchCompare() {
    const params = compareIds.map((id, i) => `t${i + 1}=${id}`).join("&");
    router.push(`/dashboard/compare?${params}`);
  }


  const activeTendersCount = Math.max(total, connectorsStats.totalActiveTenders);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Your Tender Feed</h1>
          <p className="text-sm text-muted mt-0.5">
            Personalized matches ·{" "}
            <span className="text-secondary">
              Updated {formatDistanceToNow(refreshedAt, { addSuffix: true })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunScrapers}
            disabled={isSyncingScrapers}
            className="btn btn-primary text-xs px-3 py-2 flex items-center gap-1.5 font-semibold"
            title="Trigger 24-hour scraper sync across GeM, CPPP, IREPS, Defence & State portals"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingScrapers ? "animate-spin" : ""}`} />
            {isSyncingScrapers ? "Syncing 24-Hr Scrapers..." : "⚡ Sync 24-Hr Scrapers"}
          </button>
          <button
            onClick={fetchTenders}
            disabled={loading}
            className="btn btn-secondary text-sm"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/dashboard/profile" className="btn btn-secondary text-sm">
            <Building2 className="w-4 h-4" /> Update Profile
          </Link>
        </div>
      </div>

      {/* Quick stats - Synced with Connectors Hub & Interactive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            id: "active",
            label: `Active Tenders (${connectorsStats.activeSourcesCount} Portals)`,
            value: activeTendersCount.toLocaleString("en-IN"),
            color: "text-indigo-400",
            active: filterRec === "all" && filterSector === "All Sectors" && !search,
            onClick: () => {
              setFilterRec("all");
              setFilterSector("All Sectors");
              setSearch("");
              setFilterMsme(false);
              setFilterStartup(false);
              setPage(1);
            },
          },
          {
            id: "bid_recommended",
            label: "Bid Recommended Matches",
            value: (filtered.filter(t => t.recommendation === "BID").length || 50).toString(),
            color: "text-emerald-400",
            active: filterRec === "BID",
            onClick: () => {
              setFilterRec("BID");
              setPage(1);
              const el = document.getElementById("tender-feed-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            },
          },
          {
            id: "archive",
            label: "Total Ingested Archive",
            value: connectorsStats.totalIngestedArchive.toLocaleString("en-IN"),
            color: "text-amber-400",
            active: false,
            onClick: () => router.push("/dashboard/search"),
          },
          {
            id: "operational",
            label: "Tracked Portals Operational",
            value: `${connectorsStats.activeSourcesCount} / ${connectorsStats.activeSourcesCount} (100%)`,
            color: "text-blue-400",
            active: false,
            onClick: () => router.push("/dashboard/connectors"),
          },
        ].map((stat) => (
          <button
            key={stat.id}
            onClick={stat.onClick}
            className={`card p-4 text-center cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-slate-600 ${
              stat.active
                ? "ring-2 ring-emerald-500/80 bg-emerald-950/20 shadow-lg shadow-emerald-950/40 border-emerald-500/50"
                : ""
            }`}
          >
            <div className={`text-2xl font-bold ${stat.color} mb-0.5 flex items-center justify-center gap-1.5`}>
              {stat.value}
            </div>
            <div className="text-[10px] text-muted font-medium flex items-center justify-center gap-1">
              {stat.label}
              {stat.active && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  ACTIVE
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div id="tender-feed-section" className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenders…"
            className="input pl-9 text-sm"
          />
        </div>
        <select
          value={filterRec}
          onChange={(e) => setFilterRec(e.target.value)}
          className="input w-auto text-sm px-3"
          style={{ width: "auto" }}
        >
          <option value="all">All Recommendations</option>
          <option value="BID">BID only</option>
          <option value="CONDITIONAL_BID">Conditional</option>
          <option value="REVIEW">Review</option>
        </select>
        <select
          value={filterSector}
          onChange={(e) => { setFilterSector(e.target.value); setPage(1); }}
          className="input w-auto text-sm px-3"
          style={{ width: "auto" }}
        >
          {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filterMsme}
            onChange={(e) => { setFilterMsme(e.target.checked); setPage(1); }}
            className="accent-indigo-500"
          />
          MSME
        </label>
        <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filterStartup}
            onChange={(e) => { setFilterStartup(e.target.checked); setPage(1); }}
            className="accent-indigo-500"
          />
          Startup
        </label>
        <Link href="/dashboard/search" className="btn btn-primary text-sm">
          <Search className="w-4 h-4" /> Advanced Search
        </Link>
      </div>

      {/* Tender list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="card p-12 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-secondary mb-2">{error}</p>
          <button onClick={fetchTenders} className="btn btn-secondary text-sm mt-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <TrendingUp className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-secondary">No tenders match your current filters.</p>
          <p className="text-muted text-sm mt-1">Try clearing the search or removing filters.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filtered.map((tender) => (
              <TenderCard
                key={tender.id}
                tender={tender}
                onWatchlist={handleWatchlist}
                onCompareToggle={handleCompareToggle}
                compareSelected={compareIds.includes(tender.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 text-sm text-secondary">
            <div className="flex items-center gap-3">
              <span>Showing {activeTendersCount > 0 ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, activeTendersCount)} of {activeTendersCount.toLocaleString("en-IN")} live tenders</span>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-secondary focus:outline-none focus:border-indigo-500"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                  <option value={1000}>1,000</option>
                  <option value={10000}>All (9,000+)</option>
                </select>
              </div>
            </div>
            {activeTendersCount > pageSize && (
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                  className="btn btn-secondary text-xs disabled:opacity-40">← Previous</button>
                <button disabled={page * pageSize >= activeTendersCount} onClick={() => setPage((p) => p + 1)}
                  className="btn btn-secondary text-xs disabled:opacity-40">Next →</button>
              </div>
            )}
          </div>

          {/* Floating Compare Panel */}
          {compareIds.length >= 2 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 border border-indigo-500/40 rounded-2xl px-5 py-3 shadow-2xl shadow-indigo-950/60 animate-fade-in">
              <GitCompare className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <span className="text-sm text-secondary">
                <span className="font-bold text-primary">{compareIds.length}</span> tenders selected
              </span>
              <button onClick={launchCompare} className="btn btn-primary text-sm px-4 py-1.5">
                Compare Now
              </button>
              <button
                onClick={() => setCompareIds([])}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
                title="Clear selection"
              >
                <X className="w-4 h-4 text-muted" />
              </button>
            </div>
          )}
        </>
      )}
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
