"use client";
import { useState, useEffect, useCallback } from "react";
import { analyticsApi } from "@/lib/api";
import type { ProcurementStats, AsyncState } from "@/types/procurement";

const REFRESH_INTERVAL_MS = 60_000; // 60s

export function useProcurementStats() {
  const [state, setState] = useState<AsyncState<ProcurementStats>>({ status: "loading" });

  const fetch = useCallback(async () => {
    try {
      const { data } = await analyticsApi.overview();
      if (data && typeof data.total_active_tenders === "number") {
        setState({ status: "success", data: data as ProcurementStats, lastUpdated: new Date() });
      } else {
        setState({ status: "error", message: "Unexpected response format" });
      }
    } catch {
      setState({ status: "error", message: "Unable to load procurement statistics" });
    }
  }, []);

  useEffect(() => {
    fetch();
    const timer = setInterval(fetch, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetch]);

  return { state, refresh: fetch };
}
