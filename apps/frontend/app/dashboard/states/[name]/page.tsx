"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, IndianRupee, Clock, Building2,
  TrendingUp, BarChart3, ShieldAlert, Award, Calendar
} from "lucide-react";
import { tendersApi, analyticsApi } from "@/lib/api";

export default function StateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawState = params.name as string;
  const stateName = decodeURIComponent(rawState);

  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCount: 0,
    totalValueCr: 0,
    averageValueLakhs: 0,
    urgentCount: 0,
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const { data } = await tendersApi.list({ state: stateName, page_size: 50 });
        const list = data.tenders || [];
        setTenders(list);

        // Compute metrics
        let totalVal = 0;
        let urgent = 0;
        const now = Date.now();

        list.forEach((t: any) => {
          totalVal += t.estimated_cost_lakhs || 0;
          if (t.submission_deadline) {
            const days = (new Date(t.submission_deadline).getTime() - now) / 86400000;
            if (days > 0 && days <= 7) urgent++;
          }
        });

        setStats({
          totalCount: list.length,
          totalValueCr: Number((totalVal / 100).toFixed(2)),
          averageValueLakhs: list.length ? Math.round(totalVal / list.length) : 0,
          urgentCount: urgent,
        });
      } catch (err) {
        console.error("Failed to load state tenders", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [stateName]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn btn-secondary p-2 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-secondary text-xs font-semibold tracking-wider uppercase">State Intelligence</span>
          <h1 className="text-3xl font-extrabold text-primary">{stateName} Procurement</h1>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center gap-4 bg-slate-900/40 border border-slate-800">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-secondary font-medium">Active Tenders</span>
            <h3 className="text-2xl font-bold">{stats.totalCount}</h3>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4 bg-slate-900/40 border border-slate-800">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-secondary font-medium">Total Volume</span>
            <h3 className="text-2xl font-bold">₹{stats.totalValueCr} Cr</h3>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4 bg-slate-900/40 border border-slate-800">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-secondary font-medium">Avg Value</span>
            <h3 className="text-2xl font-bold">₹{stats.averageValueLakhs} L</h3>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4 bg-rose-500/10 border border-rose-500/20">
          <div className="p-3 bg-rose-500/20 rounded-xl text-rose-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-rose-400 font-medium">Closing Soon</span>
            <h3 className="text-2xl font-bold text-rose-400">{stats.urgentCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenders List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <span>Recent Solicitations</span>
            <span className="badge badge-blue">{stats.totalCount}</span>
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-5 skeleton h-32 rounded-xl" />
              ))}
            </div>
          ) : tenders.length === 0 ? (
            <div className="card p-8 text-center text-secondary border border-dashed border-slate-800">
              No active tenders found for this state portal.
            </div>
          ) : (
            <div className="space-y-4">
              {tenders.map((tender) => (
                <Link key={tender.id} href={`/dashboard/tenders/${tender.id}`}>
                  <div className="card p-5 hover:border-blue-500/40 transition-all cursor-pointer bg-slate-900/20 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-bold text-primary hover:text-blue-400 line-clamp-1">{tender.title}</h4>
                      <span className="badge badge-gray flex-shrink-0 uppercase text-[10px]">{tender.source}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-secondary">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{tender.department || "State Government"}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>₹{tender.estimated_cost_lakhs || 0} Lakhs</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Due {new Date(tender.submission_deadline).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Insights Sidebar */}
        <div className="space-y-6">
          <div className="card p-5 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-4">
            <h3 className="text-md font-bold text-primary flex items-center gap-2 text-indigo-400">
              <ShieldAlert className="w-5 h-5" />
              <span>Eligibility & Rules</span>
            </h3>
            <p className="text-xs text-secondary leading-relaxed">
              Procurement policies of {stateName} offer a 15% purchase preference for local MSMEs registered under Udyam. Startups are exempt from prior experience and turnover requirements under the State Startup Policy.
            </p>
            <div className="border-t border-slate-800 pt-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-secondary">EMD Exemptions</span>
                <span className="text-emerald-400 font-semibold">Allowed ✔</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Digital Signature</span>
                <span className="text-amber-400 font-semibold">Class 3 Req</span>
              </div>
            </div>
          </div>

          <div className="card p-5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-md font-bold text-primary flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <span>Key Buying Entities</span>
            </h3>
            <div className="space-y-2 text-xs text-secondary">
              <div className="p-2.5 bg-slate-800/40 rounded-lg flex justify-between">
                <span>{stateName} PWD</span>
                <span className="font-semibold text-primary">Civil & Roads</span>
              </div>
              <div className="p-2.5 bg-slate-800/40 rounded-lg flex justify-between">
                <span>National Health Mission</span>
                <span className="font-semibold text-primary">Healthcare</span>
              </div>
              <div className="p-2.5 bg-slate-800/40 rounded-lg flex justify-between">
                <span>Smart City SPVs</span>
                <span className="font-semibold text-primary">IT & CCTV</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
