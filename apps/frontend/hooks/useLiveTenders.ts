"use client";
import { useState, useEffect, useCallback } from "react";
import { tendersApi } from "@/lib/api";
import type { Tender, AsyncState } from "@/types/procurement";

const REFRESH_INTERVAL_MS = 90_000; // 90s

export function useLiveTenders(pageSize = 12) {
  const [state, setState] = useState<AsyncState<Tender[]>>({ status: "loading" });

  const fetch = useCallback(async () => {
    try {
      const { data } = await tendersApi.list({ page_size: pageSize, sort: "newest" });
      const items: Tender[] = data?.items ?? data ?? [];
      setState({ status: "success", data: items, lastUpdated: new Date() });
    } catch {
      setState({ status: "error", message: "Unable to connect to procurement network" });
    }
  }, [pageSize]);

  useEffect(() => {
    fetch();
    const timer = setInterval(fetch, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetch]);

  return { state, refresh: fetch };
}
