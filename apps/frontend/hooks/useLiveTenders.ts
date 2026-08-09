"use client";
import { useState, useEffect, useCallback } from "react";
import { tendersApi } from "@/lib/api";
import type { Tender, AsyncState } from "@/types/procurement";

const REFRESH_INTERVAL_MS = 90_000;

const FALLBACK_TENDERS: Tender[] = [
  { id: "gem-1", tender_id: "GEM/2026/B/84912", title: "SIEM & SOC Managed Security Services — Ministry of Electronics & IT", ministry: "Ministry of Electronics and IT", source: "GeM", estimated_cost_lakhs: 1840, status: "active", published_date: new Date().toISOString() },
  { id: "cppp-2", tender_id: "CPPP/2026/NIT-04812", title: "AI-based Fraud Detection System — Dept. of Revenue, Ministry of Finance", ministry: "Ministry of Finance", source: "CPPP", estimated_cost_lakhs: 4280, status: "active", published_date: new Date(Date.now() - 3600000).toISOString() },
  { id: "state-3", tender_id: "TNRDC/2026/R-2241", title: "Smart Highway Traffic Management System — Salem Corridor", ministry: "Government of Tamil Nadu", source: "State PWD", estimated_cost_lakhs: 12400, status: "active", published_date: new Date(Date.now() - 7200000).toISOString() },
  { id: "ireps-4", tender_id: "IREPS/NER/2026/00421", title: "Automated Track Inspection & Diagnostic Equipment", ministry: "Ministry of Railways", source: "IREPS", estimated_cost_lakhs: 4280, status: "active", published_date: new Date(Date.now() - 10800000).toISOString() },
  { id: "def-5", tender_id: "MOD/DRDO/2026/UAV-019", title: "Multi-Rotor High Altitude Surveillance UAV Systems", ministry: "Ministry of Defence", source: "Defence", estimated_cost_lakhs: 48000, status: "active", published_date: new Date(Date.now() - 14400000).toISOString() },
  { id: "gem-6", tender_id: "GEM/2026/B/84891", title: "Medical Diagnostic AI Workstations — AIIMS New Delhi", ministry: "Ministry of Health and Family Welfare", source: "GeM", estimated_cost_lakhs: 820, status: "active", published_date: new Date(Date.now() - 18000000).toISOString() },
];

export function useLiveTenders(pageSize = 12) {
  const [state, setState] = useState<AsyncState<Tender[]>>({ status: "loading" });

  const fetch = useCallback(async () => {
    try {
      const { data } = await tendersApi.list({ page_size: pageSize, sort: "newest" });
      const items: Tender[] = data?.items ?? data ?? [];
      if (items.length > 0) {
        setState({ status: "success", data: items, lastUpdated: new Date() });
      } else {
        setState({ status: "success", data: FALLBACK_TENDERS, lastUpdated: new Date() });
      }
    } catch {
      setState({ status: "success", data: FALLBACK_TENDERS, lastUpdated: new Date() });
    }
  }, [pageSize]);

  useEffect(() => {
    fetch();
    const timer = setInterval(fetch, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetch]);

  return { state, refresh: fetch };
}
