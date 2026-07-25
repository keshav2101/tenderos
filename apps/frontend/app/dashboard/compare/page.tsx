"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, GitCompare, CheckCircle, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import { tendersApi, eligibilityApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function CompareTendersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Extract up to 3 tender IDs from search parameters
  const t1 = searchParams.get("t1");
  const t2 = searchParams.get("t2");
  const t3 = searchParams.get("t3");
  const ids = [t1, t2, t3].filter(Boolean) as string[];

  const [tenders, setTenders] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComparison() {
      if (ids.length === 0) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Load tenders metadata
        const tenderPromises = ids.map(id => tendersApi.get(id));
        const tenderRes = await Promise.all(tenderPromises);
        const tenderDataList = tenderRes.map(res => res.data);
        setTenders(tenderDataList);

        if (user?.id) {
          const reportPromises = ids.map(id => eligibilityApi.qualify(id, user.id));
          const reportRes = await Promise.all(reportPromises);
          setReports(reportRes.map(res => res.data));
        } else {
          setReports([]);
        }
      } catch (err) {
        console.error("Failed to load comparison data", err);
      } finally {
        setLoading(false);
      }
    }
    loadComparison();
  }, [t1, t2, t3, user?.id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-secondary text-sm">Assembling comparison matrix...</p>
        </div>
      </div>
    );
  }

  if (ids.length === 0) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <GitCompare className="w-12 h-12 text-secondary mx-auto opacity-50" />
        <h3 className="text-lg font-bold text-primary">No Tenders Selected</h3>
        <p className="text-xs text-secondary">Please select tenders from search or watchlist to compare them side-by-side.</p>
        <button onClick={() => router.push("/dashboard")} className="btn btn-primary w-full">Back to Browse</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn btn-secondary p-2 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-secondary text-xs font-semibold uppercase tracking-wider">Analysis Matrix</span>
          <h1 className="text-3xl font-extrabold text-primary flex items-center gap-2">
            <GitCompare className="w-7 h-7 text-blue-400" />
            <span>Tender Comparison</span>
          </h1>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="card bg-slate-900/20 border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50">
              <th className="p-4 w-1/4 text-xs font-semibold text-secondary uppercase">Parameter</th>
              {tenders.map((t, idx) => (
                <th key={t.id} className="p-4 w-1/4 font-extrabold text-primary text-sm border-l border-slate-800">
                  <div className="space-y-1">
                    <span className="badge badge-blue text-[9px] uppercase">{t.source}</span>
                    <h3 className="line-clamp-2 leading-snug">{t.title}</h3>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-xs text-secondary divide-y divide-slate-800/60">
            {/* 1. EMD Amount */}
            <tr>
              <td className="p-4 font-semibold text-primary">Earnest Money Deposit (EMD)</td>
              {tenders.map(t => (
                <td key={t.id} className="p-4 border-l border-slate-800 text-primary font-bold">
                  {t.emd_lakhs ? `₹${t.emd_lakhs} Lakhs` : "Exempt / Nil"}
                </td>
              ))}
            </tr>
            {/* 2. Budget/Value */}
            <tr>
              <td className="p-4 font-semibold text-primary">Estimated Budget</td>
              {tenders.map(t => (
                <td key={t.id} className="p-4 border-l border-slate-800 text-primary font-bold">
                  {t.estimated_cost_lakhs ? `₹${t.estimated_cost_lakhs} Lakhs` : "Tender Value not specified"}
                </td>
              ))}
            </tr>
            {/* 3. Bid Fee */}
            <tr>
              <td className="p-4 font-semibold text-primary">Tender Document Fee</td>
              {tenders.map(t => (
                <td key={t.id} className="p-4 border-l border-slate-800">
                  {t.tender_fee ? `₹${t.tender_fee}` : "Free"}
                </td>
              ))}
            </tr>
            {/* 4. Submission Deadline */}
            <tr>
              <td className="p-4 font-semibold text-primary">Deadline Date</td>
              {tenders.map(t => (
                <td key={t.id} className="p-4 border-l border-slate-800">
                  {t.submission_deadline ? new Date(t.submission_deadline).toLocaleDateString() : "Open"}
                </td>
              ))}
            </tr>
            {/* 5. Buying Entity */}
            <tr>
              <td className="p-4 font-semibold text-primary">Buying Entity</td>
              {tenders.map(t => (
                <td key={t.id} className="p-4 border-l border-slate-800 line-clamp-2">
                  {t.organisation || t.department || "N/A"}
                </td>
              ))}
            </tr>
            {/* 6. AI Match Score */}
            <tr className="bg-slate-900/30">
              <td className="p-4 font-semibold text-primary">AI Eligibility Match</td>
              {reports.map((r, idx) => (
                <td key={idx} className="p-4 border-l border-slate-800 font-bold">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" style={{
                      color: r.eligibility_score >= 70 ? "#4ade80" : r.eligibility_score >= 50 ? "#fbbf24" : "#f87171"
                    }}>{r.eligibility_score}%</span>
                    <span className="badge badge-gray text-[9px]">{r.recommendation}</span>
                  </div>
                </td>
              ))}
            </tr>
            {/* 7. Winning Probability */}
            <tr className="bg-slate-900/30">
              <td className="p-4 font-semibold text-primary">Calculated Winning Prob.</td>
              {reports.map((r, idx) => (
                <td key={idx} className="p-4 border-l border-slate-800 text-primary font-bold">
                  {r.winning_probability ? `${Math.round(r.winning_probability * 100)}%` : "N/A"}
                </td>
              ))}
            </tr>
            {/* 8. Relaxations */}
            <tr>
              <td className="p-4 font-semibold text-primary">MSME/Startup waivers</td>
              {reports.map((r, idx) => (
                <td key={idx} className="p-4 border-l border-slate-800">
                  {r.eligibility_check?.turnover_status === "WAIVED" ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Waived ✔</span>
                    </span>
                  ) : (
                    <span>Standard rules apply</span>
                  )}
                </td>
              ))}
            </tr>
            {/* 9. Missing Documents */}
            <tr>
              <td className="p-4 font-semibold text-primary">Gaps / Missing Docs</td>
              {reports.map((r, idx) => {
                const docs = r.gap_analysis?.missing_documents || [];
                return (
                  <td key={idx} className="p-4 border-l border-slate-800 text-rose-400 font-semibold space-y-1">
                    {docs.length === 0 ? (
                      <span className="text-emerald-400">All documents matched ✔</span>
                    ) : (
                      docs.map((doc: string, dIdx: number) => (
                        <div key={dIdx} className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{doc}</span>
                        </div>
                      ))
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
