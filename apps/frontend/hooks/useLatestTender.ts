"use client";
import { useState, useEffect } from "react";
import { tendersApi } from "@/lib/api";
import type { Tender } from "@/types/procurement";

export function useLatestTender() {
  const [tender, setTender] = useState<Tender | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await tendersApi.list({ page_size: 1, sort: "newest", status: "active" });
        const items: Tender[] = data?.items ?? data ?? [];
        if (!cancelled) {
          setTender(items[0] ?? null);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load tender");
          setIsLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { tender, isLoading, error };
}
