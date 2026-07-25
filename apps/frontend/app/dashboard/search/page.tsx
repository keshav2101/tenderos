"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, IndianRupee, MapPin, Building2, Clock, Filter,
  RotateCcw, SlidersHorizontal, ArrowUpDown, ChevronRight, AlertCircle, Loader2
} from "lucide-react";
import { searchApi, tendersApi, eligibilityApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Tender {
  id: string;
  title: string;
  ministry: string | null;
  department: string | null;
  state: string | null;
  estimated_cost_lakhs: number | null;
  emd_lakhs: number | null;
  categories: string[];
  submission_deadline: string | null;
  msme_eligible: boolean;
  startup_eligible: boolean;
  source: string;
  status: string;
  ai_summary: string | null;
  match_score?: number;
  winning_probability?: number;
  recommendation?: string;
}

const STATES_LIST = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", 
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Andaman and Nicobar Islands", 
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep"
];

const MINISTRIES_LIST = [
  "Ministry of Defence", "Ministry of Railways", "Ministry of Road Transport and Highways", 
  "Ministry of Power", "Ministry of Electronics and IT", "Ministry of Health and Family Welfare", 
  "Ministry of Finance", "Ministry of Education", "Ministry of Housing and Urban Affairs", 
  "Ministry of Jal Shakti", "Ministry of Petroleum and Natural Gas", "Ministry of Home Affairs", 
  "Ministry of Agriculture and Farmers Welfare", "Ministry of Civil Aviation", "Ministry of Communications",
  "Ministry of New and Renewable Energy", "Ministry of Ports, Shipping and Waterways"
];

function SearchContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  // Search query & results
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Suggestions & history
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Filters
  const [selectedState, setSelectedState] = useState("");
  const [selectedMinistry, setSelectedMinistry] = useState("");
  const [costMin, setCostMin] = useState("");
  const [costMax, setCostMax] = useState("");
  const [msmeOnly, setMsmeOnly] = useState(false);
  const [startupOnly, setStartupOnly] = useState(false);
  
  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("published_at_desc");

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tenderos_recent_searches");
      if (stored) {
        try { setRecentSearches(JSON.parse(stored)); } catch (_) {}
      }
    }
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const { data } = await searchApi.suggest(query);
        setSuggestions(data.suggestions || []);
      } catch (_) {}
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [query]);

  const executeSearch = useCallback(async (searchQuery = query) => {
    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    
    // Save to recent searches
    if (searchQuery.trim() && !recentSearches.includes(searchQuery)) {
      const updated = [searchQuery, ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem("tenderos_recent_searches", JSON.stringify(updated));
    }

    try {
      const params: Record<string, any> = {
        q: searchQuery || undefined,
        state: selectedState || undefined,
        ministry: selectedMinistry || undefined,
        cost_min: costMin ? parseFloat(costMin) : undefined,
        cost_max: costMax ? parseFloat(costMax) : undefined,
        msme_eligible: msmeOnly ? true : undefined,
        startup_eligible: startupOnly ? true : undefined,
        page,
        limit: 10,
        sort: sortBy,
      };

      const { data } = await searchApi.search(params);
      const results = data.hits || data.results || [];
      setTenders(results);
      setTotal(data.total || results.length || 0);

      // Async fetch match scores if user is authenticated
      if (user?.id) {
        results.forEach(async (t: Tender) => {
          try {
            const scoreResp = await eligibilityApi.qualify(t.id, user.id);
            setTenders((current) =>
              current.map((item) =>
                item.id === t.id
                  ? {
                      ...item,
                      match_score: scoreResp.data.eligibility_score,
                      winning_probability: Math.round((scoreResp.data.winning_probability || 0.5) * 100),
                      recommendation: scoreResp.data.recommendation === "Recommended" ? "BID" : "SKIP",
                    }
                  : item
              )
            );
          } catch (_) {}
        });
      }
    } catch (err) {
      setError("Failed to execute search. Make sure the search service is running.");
    } finally {
      setLoading(false);
    }
  }, [query, selectedState, selectedMinistry, costMin, costMax, msmeOnly, startupOnly, page, sortBy, recentSearches, user?.id]);

  useEffect(() => {
    executeSearch();
  }, [page, sortBy, selectedState, selectedMinistry, msmeOnly, startupOnly]);

  const resetFilters = () => {
    setSelectedState("");
    setSelectedMinistry("");
    setCostMin("");
    setCostMax("");
    setMsmeOnly(false);
    setStartupOnly(false);
    setQuery("");
    setPage(1);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto flex gap-6">
      {/* ─── Sidebar Filters ─────────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 space-y-4">
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-subtle pb-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filters
            </span>
            <button onClick={resetFilters} className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1">
              <RotateCcw className="w-2.5 h-2.5" /> Reset
            </button>
          </div>

          {/* State */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted uppercase">State / Territory</label>
            <select
              value={selectedState}
              onChange={e => { setSelectedState(e.target.value); setPage(1); }}
              className="input text-xs px-2.5 py-1.5"
            >
              <option value="">All States</option>
              {STATES_LIST.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>

          {/* Ministry */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted uppercase">Ministry</label>
            <select
              value={selectedMinistry}
              onChange={e => { setSelectedMinistry(e.target.value); setPage(1); }}
              className="input text-xs px-2.5 py-1.5"
            >
              <option value="">All Ministries</option>
              {MINISTRIES_LIST.map(min => <option key={min} value={min}>{min}</option>)}
            </select>
          </div>

          {/* Estimated Value */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted uppercase">Value Range (₹ Lakhs)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={costMin}
                onChange={e => setCostMin(e.target.value)}
                placeholder="Min"
                className="input text-xs px-2 py-1"
              />
              <input
                type="number"
                value={costMax}
                onChange={e => setCostMax(e.target.value)}
                placeholder="Max"
                className="input text-xs px-2 py-1"
              />
            </div>
            <button onClick={() => { setPage(1); executeSearch(); }} className="btn btn-secondary text-[10px] w-full mt-2 py-1.5">
              Apply range
            </button>
          </div>

          {/* MSME / Startup checkboxes */}
          <div className="space-y-2 pt-2 border-t border-subtle">
            <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={msmeOnly}
                onChange={e => { setMsmeOnly(e.target.checked); setPage(1); }}
                className="accent-indigo-500"
              />
              MSME Waiver Exempt
            </label>
            <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={startupOnly}
                onChange={e => { setStartupOnly(e.target.checked); setPage(1); }}
                className="accent-indigo-500"
              />
              Startup Relaxations
            </label>
          </div>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="card p-4">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-2">Recent Searches</span>
            <div className="space-y-1.5">
              {recentSearches.map((rec, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(rec); executeSearch(rec); }}
                  className="text-xs text-secondary hover:text-indigo-300 block text-left truncate w-full"
                >
                  🔍 {rec}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ─── Main Content / Search Results ───────────────────────────────────── */}
      <div className="flex-1 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <div className="flex gap-2 p-1.5 rounded-xl border border-subtle" style={{ background: "var(--color-bg-card)" }}>
            <div className="flex-1 flex items-center gap-2 px-2">
              <Search className="w-4 h-4 text-muted" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={e => e.key === "Enter" && executeSearch()}
                placeholder="Search by keywords, tags, or tender ID..."
                className="bg-transparent text-sm text-primary outline-none w-full py-1"
              />
            </div>
            <button onClick={() => executeSearch()} className="btn btn-primary px-5 py-1.5 text-xs">
              Search
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-subtle shadow-2xl z-30 divide-y divide-subtle overflow-hidden"
              style={{ background: "var(--color-bg-card)" }}>
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(sug); executeSearch(sug); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-xs text-primary transition-colors"
                >
                  💡 {sug}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between text-xs text-secondary border-b border-subtle pb-2">
          <span>Found <strong>{total}</strong> opportunities</span>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent text-primary border-none outline-none font-medium"
            >
              <option value="published_at_desc">Newest Published</option>
              <option value="submission_deadline_asc">Closing Soon</option>
              <option value="estimated_cost_lakhs_desc">Highest Value</option>
              <option value="match_score_desc">Best Match Score</option>
            </select>
          </div>
        </div>

        {/* Results List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-5 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card p-12 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-secondary">{error}</p>
          </div>
        ) : tenders.length === 0 ? (
          <div className="card p-12 text-center text-secondary">
            No tenders found matching your query and filters. Try widening your criteria.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {tenders.map((tender) => (
                <div key={tender.id} className="card p-5 hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="flex gap-4">
                    {tender.match_score != null && (
                      <div className="w-9 h-9 rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {tender.match_score}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <Link href={`/dashboard/tenders/${tender.id}`} className="text-sm font-semibold text-primary hover:text-indigo-300 leading-tight line-clamp-1">
                          {tender.title}
                        </Link>
                        <span className="badge badge-gray text-[9px] flex-shrink-0">{tender.source}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-secondary mb-2">
                        <span>{tender.ministry || "Ministry"}</span>
                        <span>·</span>
                        <span>{tender.state || "State"}</span>
                        <span>·</span>
                        {tender.estimated_cost_lakhs && (
                          <span className="font-semibold text-primary">₹{(tender.estimated_cost_lakhs / 100).toFixed(2)} Cr</span>
                        )}
                        {tender.submission_deadline && (
                          <span>· {new Date(tender.submission_deadline).toLocaleDateString()}</span>
                        )}
                      </div>
                      {tender.ai_summary && (
                        <p className="text-xs text-muted line-clamp-2">{tender.ai_summary}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination controls */}
            {total > 10 && (
              <div className="flex items-center justify-between text-xs text-secondary pt-4">
                <span>Page {page} of {Math.ceil(total / 10)}</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary py-1 px-3 disabled:opacity-40">
                    Previous
                  </button>
                  <button disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)} className="btn btn-secondary py-1 px-3 disabled:opacity-40">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdvancedSearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
