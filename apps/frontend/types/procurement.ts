/**
 * TenderOS — Procurement Data Types
 * All types representing live API data. No hard-coded business values.
 */

export interface ProcurementStats {
  total_active_tenders: number;
  active_ministries: number;
  active_states: number;
  tenders_indexed_today: number;
  total_market_value_cr?: number;
  last_updated?: string;
}

export interface Tender {
  id: string;
  tender_id: string;
  title: string;
  ministry: string;
  department?: string;
  state?: string;
  source: string;
  estimated_cost_lakhs: number;
  msme_eligible?: boolean;
  startup_eligible?: boolean;
  published_date?: string;
  submission_deadline?: string;
  status: string;
  categories?: string[];
}

export interface PortalSource {
  name: string;
  full_name: string;
  count: number;
  color: string;
}

export interface PortalStats {
  sources: PortalSource[];
  total_sources: number;
  total_tenders: number;
  last_updated: string;
}

export interface SearchResult {
  id: string;
  title: string;
  ministry: string;
  score?: number;
  match_type?: string;
  estimated_cost_lakhs?: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total?: number;
  latency_ms?: number;
  status?: number;
}

export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T; lastUpdated: Date }
  | { status: "error"; message: string };
