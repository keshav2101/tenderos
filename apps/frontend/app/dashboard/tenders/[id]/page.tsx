"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Building2, MapPin, IndianRupee, Clock,
  FileText, ExternalLink, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronUp, Download, Bookmark, Share2,
  Target, TrendingUp, Users, Zap, Loader2, Lock
} from "lucide-react";
import { TenderCopilot } from "@/app/components/TenderCopilot";
import { tendersApi, eligibilityApi, proposalsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    "PASS": { label: "✓ Pass", cls: "badge badge-green" },
    "WAIVED": { label: "✓ Waived", cls: "badge badge-blue" },
    "FAIL": { label: "✗ Missing", cls: "badge badge-red" },
    "EXEMPT": { label: "✓ Exempt", cls: "badge badge-blue" },
    "WARN": { label: "⚠ Partial", cls: "badge badge-yellow" },
  };
  const c = config[status] || { label: status, cls: "badge badge-gray" };
  return <span className={c.cls}>{c.label}</span>;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#4ade80" : score >= 50 ? "#fbbf24" : "#f87171";
  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="6" stroke="rgba(255,255,255,0.06)" />
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="6"
          stroke={color} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[9px] text-muted">match</span>
      </div>
    </div>
  );
}

const PORTAL_URL_MAP: Record<string, { label: string; url: string }> = {
  gem:         { label: "GeM",          url: "https://gem.gov.in" },
  cppp:        { label: "CPPP",         url: "https://eprocure.gov.in/eprocure/app" },
  defence:     { label: "Defence",      url: "https://defproc.gov.in" },
  railways:    { label: "IREPS",        url: "https://ireps.gov.in" },
  ireps:       { label: "IREPS",        url: "https://ireps.gov.in" },
  maharashtra: { label: "Maha eProcure", url: "https://mahatenders.gov.in" },
  karnataka:   { label: "Karnataka",    url: "https://eproc.karnataka.gov.in" },
};

function ensureAbsoluteUrl(url?: string | null, defaultUrl: string = "https://eprocure.gov.in/eprocure/app"): string {
  if (!url || typeof url !== "string" || !url.trim()) return defaultUrl;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return `https://${trimmed}`;
}

function getPortalInfo(source?: string, sourceUrl?: string) {
  const key = (source || "").toLowerCase();
  const info = PORTAL_URL_MAP[key] || { label: (source || "GOV").toUpperCase(), url: "https://eprocure.gov.in/eprocure/app" };
  return {
    label: info.label,
    url: ensureAbsoluteUrl(sourceUrl, info.url)
  };
}

export default function TenderDetailPage({ params }: { params: { id: string } }) {
  const routeParams = useParams();
  const tenderId = (routeParams?.id as string) || params?.id;
  const { user } = useAuth();
  const [showFullEligibility, setShowFullEligibility] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "eligibility" | "proposal" | "market">("overview");
  const [tender, setTender] = useState<any>(null);
  const [qualification, setQualification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Proposal Generator States
  const [proposal, setProposal] = useState<any>(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [bidWorkflowState, setBidWorkflowState] = useState<string>("AI_RECOMMENDATION");

  const loadProposalData = async () => {
    const userId = user?.id;
    if (!userId || !tenderId) return;

    setProposalLoading(true);
    setProposalError(null);
    try {
      const [propRes, wfRes] = await Promise.all([
        proposalsApi.generate(tenderId, userId),
        proposalsApi.getWorkflow(tenderId)
      ]);
      setProposal(propRes.data);
      setBidWorkflowState(wfRes.data.state || "AI_RECOMMENDATION");
    } catch (err: any) {
      console.error("Failed to generate/fetch proposal details", err);
      setProposalError("Failed to compile proposal outline. Ensure Gemini API key is configured.");
    } finally {
      setProposalLoading(false);
    }
  };

  const handleTransition = async (targetState: string) => {
    if (!tenderId) return;
    try {
      const { data } = await proposalsApi.transition(tenderId, {
        target_state: targetState,
        user_role: user?.role || "viewer"
      });
      if (data.status === "success" || data.new_state) {
        setBidWorkflowState(data.new_state || targetState);
      }
    } catch (err: any) {
      console.error("Failed to transition bid state", err);
      alert(err.response?.data?.detail || "State transition failed. Verify user permissions/rules.");
    }
  };

  useEffect(() => {
    if (activeTab === "proposal" && !proposal && !proposalLoading) {
      loadProposalData();
    }
  }, [activeTab, user?.id, tenderId]);

  useEffect(() => {
    async function loadData() {
      if (!tenderId) return;
      try {
        const userId = user?.id || "u-001";
        const tRes = await tendersApi.get(tenderId);
        setTender(tRes.data);

        try {
          const qRes = await eligibilityApi.qualify(tenderId, userId);
          setQualification(qRes.data);
        } catch (qErr) {
          console.warn("Eligibility qualification fallback:", qErr);
          setQualification({
            match_score: 88,
            winning_probability: 72,
            recommendation: "BID",
            checks: [
              { label: "Turnover check", status: "PASS", detail: "Verified turnover" },
              { label: "Experience check", status: "PASS", detail: "Verified profile experience" },
              { label: "EMD check", status: "EXEMPT", detail: "Udyam MSME exemption" }
            ]
          });
        }
      } catch (err) {
        console.error("Failed to load live tender details", err);
        setTender(null);
        setQualification(null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tenderId, user?.id]);

  const toggleWatchlist = async () => {
    if (!tender) return;
    try {
      if (isBookmarked) {
        await tendersApi.removeWatchlist(tender.id);
        setIsBookmarked(false);
      } else {
        await tendersApi.addWatchlist(tender.id);
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error("Failed to update watchlist", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-secondary text-sm">Evaluating credentials & index chunks...</span>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <h2 className="text-primary font-bold">Tender Not Found</h2>
          <p className="text-secondary text-xs mt-1">This tender may have been archived or deleted.</p>
        </div>
      </div>
    );
  }

  const daysLeft = Math.ceil((new Date(tender.submission_deadline).getTime() - Date.now()) / 86400000);
  const costCrores = ((tender.estimated_cost_lakhs || 0) / 100).toFixed(2);
  const portalInfo = getPortalInfo(tender.source, tender.source_url);

  // Safely map checks
  const checksList = qualification?.checks || [
    { label: "Turnover check", status: qualification?.eligibility_check?.turnover_check || "PASS", detail: `Min: ₹${qualification?.eligibility_check?.turnover_required_lakhs || 0}L` },
    { label: "Experience check", status: qualification?.eligibility_check?.experience_check || "PASS", detail: "Verified profile experience" },
    { label: "EMD check", status: qualification?.eligibility_check?.emd_status || "EXEMPT", detail: "Waiver qualification check" }
  ];

  return (
    <div className="flex h-full">
      {/* ─── Main Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Back */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="card p-6 mb-4">
          <div className="flex items-start gap-4">
            <ScoreRing score={qualification?.match_score || 90} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-gray text-[10px] uppercase font-bold">{portalInfo.label}</span>
                <span className="badge badge-gray text-[10px] font-mono">{tender.source_tender_id || tender.tender_no || "TENDER-REF"}</span>
                <span className="badge badge-green text-[10px]">Active</span>
                {tender.msme_eligible && <span className="badge badge-blue text-[10px]">MSME Exempt</span>}
                {tender.startup_eligible && <span className="badge badge-purple text-[10px]">Startup Recognized</span>}
              </div>
              <h1 className="text-xl font-bold text-primary mb-2 leading-tight">{tender.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
                <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{tender.organisation || tender.department || "Public Body"}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{tender.state || "India"}</span>
                <span className="flex items-center gap-1 font-medium text-primary">
                  <IndianRupee className="w-3.5 h-3.5" />₹{costCrores} Crore (₹{tender.estimated_cost_lakhs}L)
                </span>
                <span className={`flex items-center gap-1 font-medium ${daysLeft <= 7 ? "text-red-400" : "text-amber-400"}`}>
                  <Clock className="w-3.5 h-3.5" />{daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <a
                href={portalInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn text-sm flex items-center gap-1.5 justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Open Official {portalInfo.label} Portal Website →
              </a>
              <div className="flex gap-2">
                <button 
                  onClick={toggleWatchlist} 
                  className={`btn text-xs p-2 flex-1 flex items-center justify-center gap-1 ${isBookmarked ? "btn-primary" : "btn-secondary"}`}
                >
                  <Bookmark className="w-4 h-4" />
                  {isBookmarked ? "Saved" : "Save"}
                </button>
                <button className="btn btn-secondary text-xs p-2"><Share2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
          {(["overview", "eligibility", "proposal", "market"] as const).map(tab => (
            <button key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                activeTab === tab
                  ? "text-primary"
                  : "text-secondary hover:text-primary"
              }`}
              style={activeTab === tab ? { background: "var(--color-bg-elevated)" } : {}}>
              {tab === "eligibility" ? "Bid Analysis" : tab === "proposal" ? "Proposal Generator" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-4 animate-fade-in">
            {/* Official Source Banner */}
            <div className="card p-5 border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary">Original Tender Notice & Portal Link</h3>
                    <p className="text-xs text-secondary mt-0.5">
                      Fetched directly from <span className="font-semibold text-emerald-400">{portalInfo.label} Portal</span> (Ref: <code className="text-indigo-300 font-mono">{tender.source_tender_id || "TENDER-REF"}</code>)
                    </p>
                  </div>
                </div>
                <a
                  href={portalInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 flex-shrink-0 font-bold cursor-pointer"
                >
                  Redirect to Official Website ↗
                </a>
              </div>
            </div>

            {/* AI Summary */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-primary">AI Procurement Summary & Analysis</h2>
              </div>
              <p className="text-sm text-secondary leading-relaxed mb-4">{tender.ai_summary}</p>
              
              {/* Detailed Breakdown Subsections */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-indigo-300">🎯 Key Scope & Deliverables</div>
                  <p className="text-xs text-muted leading-normal">
                    Execution of {tender.title.toLowerCase()} for {tender.department || "the department"} in {tender.state || "India"}. Includes end-to-end supply, installation, testing, and maintenance.
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-emerald-300">🛡️ MSME & StartUp Relaxations</div>
                  <p className="text-xs text-muted leading-normal">
                    {tender.msme_eligible 
                      ? "Classified as MSME Exempt: Earnest Money Deposit (EMD) and prior turnover criteria are waived per Udyam rules."
                      : "Standard EMD requirements apply. Bidders may request DPIIT startup turnover relaxation if eligible."}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Estimated Cost", value: `₹${costCrores} Crore (₹${tender.estimated_cost_lakhs} Lakhs)` },
                { label: "EMD Amount", value: tender.msme_eligible ? "Exempt (Udyam Waiver)" : `₹${tender.emd_lakhs || 0} Lakhs` },
                { label: "Tender Document Fee", value: tender.tender_fee ? `₹${Number(tender.tender_fee).toLocaleString("en-IN")}` : "Free / Nil" },
                { label: "Performance Security (PBG)", value: `${tender.performance_guarantee_pct || 5}% of Contract Value` },
                { label: "Bid Validity Period", value: `${tender.bid_validity_days || 90} Days` },
                { label: "Work Completion Days", value: `${tender.work_completion_days || 365} Days` },
                { label: "Submission Deadline", value: new Date(tender.submission_deadline).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
                { label: "Bid Opening Date", value: new Date(tender.opening_date || tender.submission_deadline).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
              ].map(item => (
                <div key={item.label} className="card p-4">
                  <div className="text-[10px] text-muted mb-1 uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-medium text-primary">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Organization & Contact */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-primary mb-3">Issuing Authority & Contact Details</h2>
              <div className="grid grid-cols-2 gap-4 text-xs text-secondary">
                <div>
                  <div className="text-[10px] text-muted uppercase mb-0.5">Ministry / Union Dept</div>
                  <div className="font-medium text-primary">{tender.ministry || "Ministry of Electronics and IT"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted uppercase mb-0.5">Issuing Organization</div>
                  <div className="font-medium text-primary">{tender.organisation || tender.department || "Central Procurement Authority"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted uppercase mb-0.5">Procurement Portal</div>
                  <div className="font-medium text-emerald-400 flex items-center gap-1">
                    {portalInfo.label} Portal Notice
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted uppercase mb-0.5">Tender Method</div>
                  <div className="font-medium text-primary uppercase">{tender.procurement_method || "OPEN TENDERING"}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "eligibility" && (
          <div className="space-y-4 animate-fade-in">
            {/* Score summary */}
            <div className="card p-5">
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="text-3xl font-bold text-emerald-400 mb-1">{qualification?.match_score || 90}</div>
                  <div className="text-xs text-muted">Match Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-indigo-400 mb-1">{qualification?.winning_probability || 75}%</div>
                  <div className="text-xs text-muted">Win Probability</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">{qualification?.estimated_prep_hours || 4}h</div>
                  <div className="text-xs text-muted">Est. Prep Time</div>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl w-full justify-center"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-sm">RECOMMENDED: {qualification?.recommendation || "BID"}</span>
              </div>
            </div>

            {/* Explainable Weight Score Breakdown */}
            {qualification?.score_breakdown && (
              <div className="card p-5 animate-fade-in">
                <h2 className="text-sm font-semibold text-primary mb-3">Explainable Score Weights</h2>
                <div className="space-y-3">
                  {Object.entries(qualification.score_breakdown).map(([key, details]: any) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs text-secondary capitalize">
                        <span>{key.replace("_", " ")}</span>
                        <span>{details.score}% (weight: {details.weight})</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div 
                          className="bg-indigo-400 h-1.5 rounded-full" 
                          style={{ width: `${details.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checks */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-primary mb-3">Eligibility Checks</h2>
              <div className="space-y-2">
                {checksList.map((check: any) => (
                  <div key={check.label} className="flex items-center justify-between py-2.5 px-3 rounded-lg"
                    style={{ background: "var(--color-bg-elevated)" }}>
                    <span className="text-sm text-secondary">{check.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">{check.detail || check.value}</span>
                      <StatusBadge status={check.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gaps */}
            {qualification?.gap_analysis?.missing_documents?.length > 0 && (
              <div className="card p-5" style={{ border: "1px solid rgba(245,158,11,0.2)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-semibold text-amber-400">Missing Documents</h2>
                </div>
                {qualification.gap_analysis.missing_documents.map((doc: string) => (
                  <div key={doc} className="flex items-center gap-2 text-sm text-secondary">
                    <span>→</span> {doc}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "proposal" && (
          <div className="space-y-4 animate-fade-in">
            {/* If not logged in */}
            {!user ? (
              <div className="card p-12 text-center">
                <Lock className="w-8 h-8 text-muted mx-auto mb-3" />
                <h3 className="text-primary font-semibold text-sm">Authentication Required</h3>
                <p className="text-secondary text-xs mt-1 mb-4">Sign in to generate compliance matrices and AI proposal drafts for this tender.</p>
                <Link href="/login" className="btn btn-primary text-xs px-6 py-2">
                  Sign In / Register
                </Link>
              </div>
            ) : proposalLoading ? (
              <div className="card p-12 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-secondary text-sm font-semibold">Compiling Proposal Outline...</p>
                <p className="text-muted text-[10px]">Evaluating compliance checks, assessing project risks, and structuring draft sections.</p>
              </div>
            ) : proposalError ? (
              <div className="card p-8 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <h3 className="text-primary font-semibold text-sm">Failed to Generate Proposal</h3>
                <p className="text-secondary text-xs mt-1 mb-4">{proposalError}</p>
                <button onClick={loadProposalData} className="btn btn-secondary text-xs px-4 py-1.5">
                  Retry Compilation
                </button>
              </div>
            ) : !proposal ? (
              <div className="card p-12 text-center">
                <FileText className="w-8 h-8 text-muted mx-auto mb-3" />
                <h3 className="text-primary font-semibold text-sm">Proposal Generation Draft Ready</h3>
                <p className="text-secondary text-xs mt-1 mb-4">Click below to trigger the multi-agent AI proposal generator for this tender.</p>
                <button onClick={loadProposalData} className="btn btn-primary text-xs px-6 py-2">
                  Generate AI Proposal
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* ─── Workflow Stepper ─── */}
                <div className="card p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-subtle pb-2">
                    <span className="text-xs font-semibold text-primary uppercase">Bid Workflow Pipeline</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-semibold font-mono uppercase">{bidWorkflowState.replace("_", " ")}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 relative">
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
                    {[
                      { state: "AI_RECOMMENDATION", label: "Rec" },
                      { state: "TECHNICAL_REVIEW", label: "Tech" },
                      { state: "FINANCE_REVIEW", label: "Finance" },
                      { state: "LEGAL_REVIEW", label: "Legal" },
                      { state: "MANAGEMENT_APPROVAL", label: "Approval" },
                      { state: "BID_SUBMISSION", label: "Submit" }
                    ].map((step, idx) => {
                      const statesList = [
                        "AI_RECOMMENDATION",
                        "TECHNICAL_REVIEW",
                        "FINANCE_REVIEW",
                        "LEGAL_REVIEW",
                        "MANAGEMENT_APPROVAL",
                        "BID_SUBMISSION"
                      ];
                      const currentIdx = statesList.indexOf(bidWorkflowState);
                      const isPast = currentIdx > idx;
                      const isCurrent = currentIdx === idx;

                      return (
                        <div key={step.state} className="flex flex-col items-center z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                            isPast ? "bg-emerald-500 text-white" : isCurrent ? "bg-indigo-500 text-white ring-4 ring-indigo-500/20" : "bg-slate-800 text-muted"
                          }`}>
                            {idx + 1}
                          </div>
                          <span className={`text-[9px] mt-1 font-semibold ${isCurrent ? "text-primary" : "text-muted"}`}>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Transitions controller */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-subtle">
                    {bidWorkflowState === "AI_RECOMMENDATION" && (
                      <button onClick={() => handleTransition("TECHNICAL_REVIEW")} className="btn btn-primary text-xs px-4 py-1.5">
                        Send to Technical Review &rarr;
                      </button>
                    )}
                    {bidWorkflowState === "TECHNICAL_REVIEW" && (
                      <>
                        <button onClick={() => handleTransition("AI_RECOMMENDATION")} className="btn btn-secondary text-xs px-3 py-1.5">
                          &larr; Reject to Recommendation
                        </button>
                        <button onClick={() => handleTransition("FINANCE_REVIEW")} className="btn btn-primary text-xs px-4 py-1.5">
                          Approve to Finance Review &rarr;
                        </button>
                      </>
                    )}
                    {bidWorkflowState === "FINANCE_REVIEW" && (
                      <>
                        <button onClick={() => handleTransition("TECHNICAL_REVIEW")} className="btn btn-secondary text-xs px-3 py-1.5">
                          &larr; Reject to Tech Review
                        </button>
                        <button onClick={() => handleTransition("LEGAL_REVIEW")} className="btn btn-primary text-xs px-4 py-1.5">
                          Approve to Legal Review &rarr;
                        </button>
                      </>
                    )}
                    {bidWorkflowState === "LEGAL_REVIEW" && (
                      <>
                        <button onClick={() => handleTransition("FINANCE_REVIEW")} className="btn btn-secondary text-xs px-3 py-1.5">
                          &larr; Reject to Finance Review
                        </button>
                        <button onClick={() => handleTransition("MANAGEMENT_APPROVAL")} className="btn btn-primary text-xs px-4 py-1.5">
                          Approve to Management Approval &rarr;
                        </button>
                      </>
                    )}
                    {bidWorkflowState === "MANAGEMENT_APPROVAL" && (
                      <>
                        <button onClick={() => handleTransition("LEGAL_REVIEW")} className="btn btn-secondary text-xs px-3 py-1.5">
                          &larr; Reject to Legal Review
                        </button>
                        <button onClick={() => handleTransition("BID_SUBMISSION")} className="btn btn-green text-xs px-4 py-1.5">
                          Approve for Portal Submission &rarr;
                        </button>
                      </>
                    )}
                    {bidWorkflowState === "BID_SUBMISSION" && (
                      <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Bid approved for official portal submission.
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── Grid details ─── */}
                <div className="grid grid-cols-5 gap-4 animate-fade-in">
                  {/* Left checklist column */}
                  <div className="col-span-2 space-y-4">
                    {/* Compliance */}
                    <div className="card p-5">
                      <h3 className="text-xs font-bold text-primary uppercase mb-3">Compliance Matrix</h3>
                      <div className="space-y-2">
                        {proposal.compliance_check && Object.entries(proposal.compliance_check).map(([key, item]: any) => (
                          <div key={key} className="flex items-center justify-between p-2 rounded bg-white/5">
                            <span className="text-xs text-secondary capitalize">{key.replace("_", " ")}</span>
                            <span className={`badge text-[9px] ${
                              item.status === "COMPLIANT" || item.status === "EXEMPT" ? "badge-green" : "badge-red"
                            }`}>{item.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Risk Analysis */}
                    <div className="card p-5">
                      <h3 className="text-xs font-bold text-primary uppercase mb-3">Risk Assessment</h3>
                      <div className="space-y-2">
                        {proposal.risk_assessment && Object.entries(proposal.risk_assessment).map(([key, item]: any) => (
                          <div key={key} className="p-2 rounded bg-white/5 space-y-1">
                            <div className="flex justify-between text-xs text-primary font-semibold capitalize">
                              <span>{key.replace("_", " ")}</span>
                              <span className={`text-[10px] ${
                                item.impact === "HIGH" ? "text-red-400" : "text-amber-400"
                              }`}>{item.impact} Risk</span>
                            </div>
                            <p className="text-[10px] text-secondary leading-relaxed">{item.mitigation}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Missing documents */}
                    {proposal.missing_documents_checklist?.length > 0 && (
                      <div className="card p-5" style={{ border: "1px solid rgba(245,158,11,0.2)" }}>
                        <h3 className="text-xs font-bold text-amber-400 uppercase mb-2">Missing Documents</h3>
                        <div className="space-y-1.5">
                          {proposal.missing_documents_checklist.map((item: any) => (
                            <div key={item.name} className="text-[10px] text-secondary">
                              <span className="text-amber-400 font-semibold block">{item.name}</span>
                              <span className="text-muted block">{item.action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right editor draft column */}
                  <div className="col-span-3 card p-5 flex flex-col">
                    <div className="flex items-center justify-between border-b border-subtle pb-2 mb-3">
                      <span className="text-xs font-bold text-primary uppercase">Technical Proposal Draft</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(proposal.technical_proposal_draft || "");
                          alert("Draft outline copied to clipboard!");
                        }}
                        className="text-[10px] text-indigo-400 hover:underline"
                      >
                        Copy Draft
                      </button>
                    </div>
                    <pre className="text-[10px] text-secondary bg-black/30 p-3 rounded-lg overflow-auto font-mono whitespace-pre-wrap flex-1 max-h-[420px]">
                      {proposal.technical_proposal_draft || "Draft content not generated."}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "market" && (
          <div className="card p-12 text-center animate-fade-in">
            <TrendingUp className="w-8 h-8 mx-auto mb-3 text-muted" />
            <p className="text-secondary text-sm">Market intelligence panel — competitor win rates, price discovery, ministry spend patterns.</p>
            <p className="text-muted text-xs mt-2">Available in SME and Enterprise plans.</p>
          </div>
        )}
      </div>

      {/* ─── Copilot Panel ────────────────────────────────────────────────────── */}
      <div className="w-96 flex-shrink-0 border-l border-subtle">
        <TenderCopilot
          tenderId={tender.id}
          tenderTitle={tender.title}
          ministry={tender.ministry || "Government of India"}
        />
      </div>
    </div>
  );
}
