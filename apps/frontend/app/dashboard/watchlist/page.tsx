"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bookmark, IndianRupee, MapPin, Building2, Clock, Trash2,
  AlertCircle, Loader2
} from "lucide-react";
import { tendersApi } from "@/lib/api";

interface Tender {
  id: string;
  title: string;
  ministry: string | null;
  department: string | null;
  state: string | null;
  estimated_cost_lakhs: number | null;
  submission_deadline: string | null;
  source: string;
}

export default function WatchlistPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadWatchlist() {
    try {
      const { data } = await tendersApi.listWatchlist();
      setTenders(data || []);
    } catch (err) {
      setError("Failed to load watchlist. Sign in to view saved tenders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWatchlist();
  }, []);

  async function removeTender(id: string) {
    try {
      await tendersApi.removeWatchlist(id);
      setTenders(prev => prev.filter(t => t.id !== id));
    } catch (_) {}
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-indigo-400" /> Watchlist
        </h1>
        <p className="text-sm text-muted mt-0.5">Your saved tenders and active opportunities.</p>
      </div>

      {error ? (
        <div className="card p-12 text-center text-secondary">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          {error}
        </div>
      ) : tenders.length === 0 ? (
        <div className="card p-12 text-center text-secondary">
          No saved tenders in your watchlist yet. Browse active opportunities to save them here.
        </div>
      ) : (
        <div className="space-y-3">
          {tenders.map((tender) => {
            const costCrores = tender.estimated_cost_lakhs ? ((tender.estimated_cost_lakhs) / 100).toFixed(2) : null;
            return (
              <div key={tender.id} className="card p-5 flex items-start gap-4 hover:-translate-y-0.5 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <Link href={`/dashboard/tenders/${tender.id}`} className="text-sm font-semibold text-primary hover:text-indigo-300 leading-tight">
                      {tender.title}
                    </Link>
                    <span className="badge badge-gray text-[9px]">{tender.source}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary">
                    {tender.department && (
                      <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{tender.department}</span>
                    )}
                    {tender.state && (
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{tender.state}</span>
                    )}
                    {costCrores && (
                      <span className="flex items-center gap-1 font-semibold text-primary">
                        <IndianRupee className="w-3.5 h-3.5" />₹{costCrores} Cr
                      </span>
                    )}
                    {tender.submission_deadline && (
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(tender.submission_deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeTender(tender.id)}
                  title="Remove from watchlist"
                  className="btn-ghost p-2 rounded-lg text-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
