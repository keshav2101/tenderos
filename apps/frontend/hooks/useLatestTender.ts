"use client";
import { useState, useEffect } from "react";
import { tendersApi } from "@/lib/api";
import type { Tender } from "@/types/procurement";

const FALLBACK_HERO_TENDER: Tender = {
  id: "hero-1",
  tender_id: "CPPP/2026/NIT-04812",
  title: "AI-based Fraud Detection System — Government of India",
  ministry: "Ministry of Finance",
  department: "Dept. of Revenue · CPPP",
  state: "Pan-India",
  source: "CPPP",
  estimated_cost_lakhs: 4280,
  msme_eligible: true,
  startup_eligible: true,
  submission_deadline: "2026-08-28T15:00:00Z",
  status: "active",
  categories: ["AI / Data Analytics"],
};

export function useLatestTender() {
  const [tender, setTender] = useState<Tender>(FALLBACK_HERO_TENDER);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await tendersApi.list({ page_size: 1, sort: "newest", status: "active" });
        const items: Tender[] = data?.items ?? data ?? [];
        if (!cancelled && items.length > 0) {
          setTender(items[0]);
          setIsLoading(false);
        } else if (!cancelled) {
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(null);
          setIsLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { tender, isLoading, error };
}
