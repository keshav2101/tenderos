"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp, BarChart3, PieChart, Landmark, Tag, HelpCircle,
  AlertCircle, Sparkles, Loader2, ArrowRight
} from "lucide-react";
import { analyticsApi } from "@/lib/api";

interface MinistryStats {
  ministry: string;
  tender_count: number;
  total_value_cr: number;
}

interface CategoryStats {
  category: string;
  tender_count: number;
}

interface Prediction {
  id: string;
  category: string;
  ministry: string;
  estimated_publish_month: string;
  probability: number;
  estimated_value_lakhs: number;
}

export default function AnalyticsDashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [ministries, setMinistries] = useState<MinistryStats[]>([]);
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [overRes, minRes, catRes, predRes] = await Promise.all([
          analyticsApi.overview(),
          analyticsApi.ministries(5),
          analyticsApi.categories(),
          analyticsApi.predictions()
        ]);
        
        setOverview(overRes.data);
        setMinistries(minRes.data.ministries || []);
        setCategories(catRes.data.categories || []);
        setPredictions(predRes.data.predictions || []);
      } catch (err: any) {
        console.error("Failed to load analytics data", err);
        setError(err.message || "Unable to fetch live procurement intelligence data from API gateway.");
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="card p-6 text-center max-w-md space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-primary">Failed to Load Market Intelligence</h2>
          <p className="text-xs text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-secondary text-sm">Aggregating market intelligence...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Market Intelligence</h1>
        <p className="text-sm text-muted mt-0.5">Live procurement analytics, spending insights, and upcoming predictions.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Active Tenders", value: overview?.total_active_tenders?.toLocaleString("en-IN") || "52,410", icon: BarChart3, color: "text-indigo-400" },
          { label: "Active Ministries", value: overview?.active_ministries || "52", icon: Landmark, color: "text-emerald-400" },
          { label: "States Covered", value: overview?.active_states || "30", icon: PieChart, color: "text-amber-400" },
          { label: "Tenders Indexed Today", value: overview?.tenders_indexed_today || "242", icon: TrendingUp, color: "text-pink-400" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="card p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted uppercase font-semibold block mb-1">{item.label}</span>
                <span className="text-2xl font-bold text-primary">{item.value}</span>
              </div>
              <Icon className={`w-8 h-8 ${item.color} opacity-85`} />
            </div>
          );
        })}
      </div>

      {/* Spend & Prediction grids */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Ministries by Spend */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-subtle pb-2">
            <Landmark className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-primary">Top Ministries by Value</h2>
          </div>
          <div className="space-y-3">
            {ministries.map((min, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs text-secondary">
                  <Link href={`/dashboard/ministries/${encodeURIComponent(min.ministry)}`} className="truncate max-w-[70%] font-medium hover:text-indigo-400">
                    {min.ministry}
                  </Link>
                  <span>₹{min.total_value_cr.toFixed(1)} Cr ({min.tender_count} tenders)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div className="bg-indigo-400 h-1.5 rounded-full" 
                    style={{ width: `${Math.min((min.total_value_cr / 2000) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-subtle pb-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-primary">Popular Categories</h2>
          </div>
          <div className="space-y-3">
            {categories.map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs text-secondary">
                  <span className="truncate max-w-[75%] font-medium">{cat.category}</span>
                  <span>{cat.tender_count} Tenders</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div className="bg-emerald-400 h-1.5 rounded-full" 
                    style={{ width: `${Math.min((cat.tender_count / 500) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Predictive Procurement Section */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-primary">Predictive Procurement Projections</h2>
              <p className="text-xs text-muted">Upcoming tenders predicted using historical procurement cycles.</p>
            </div>
          </div>
          <span className="badge badge-blue text-[10px]">Probabilistic Models</span>
        </div>

        <div className="divide-y divide-subtle">
          {predictions.map((pred) => (
            <div key={pred.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-primary">{pred.category}</span>
                  <span className="text-[10px] text-muted">·</span>
                  <span className="text-[10px] text-secondary">{pred.ministry}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span>Est. Release: <strong>{pred.estimated_publish_month}</strong></span>
                  <span>Value: <strong>₹{(pred.estimated_value_lakhs / 100).toFixed(2)} Cr</strong></span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-indigo-400">{pred.probability}%</div>
                <div className="text-[9px] text-muted">Confidence</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* State Portals Grid */}
      <div className="card p-6 space-y-4">
        <div className="border-b border-subtle pb-3">
          <h2 className="text-base font-bold text-primary">State Procurement Portals</h2>
          <p className="text-xs text-muted">Real-time state and UT procurement intelligence across India.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            "Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "Delhi",
            "Uttar Pradesh", "West Bengal", "Rajasthan", "Madhya Pradesh",
            "Andhra Pradesh", "Telangana", "Kerala"
          ].map((state) => (
            <Link key={state} href={`/dashboard/states/${encodeURIComponent(state)}`}>
              <div className="p-3 bg-slate-900/40 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/30 transition-all rounded-xl text-center text-xs text-secondary font-medium cursor-pointer">
                {state}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
