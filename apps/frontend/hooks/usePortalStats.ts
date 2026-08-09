"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { PortalSource, AsyncState } from "@/types/procurement";

export function usePortalStats() {
  const [state, setState] = useState<AsyncState<PortalSource[]>>({ status: "loading" });

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get("/analytics/sources");
      const sources: PortalSource[] = data?.sources ?? [];
      if (sources.length > 0) {
        setState({ status: "success", data: sources, lastUpdated: new Date() });
      } else {
        setState({ status: "error", message: "No portal data available" });
      }
    } catch {
      setState({ status: "error", message: "Unable to load portal statistics" });
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { state, refresh: fetch };
}
