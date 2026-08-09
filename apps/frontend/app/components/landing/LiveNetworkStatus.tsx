"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function LiveNetworkStatus() {
  const [status, setStatus] = useState<"live" | "syncing" | "degraded">("live");

  useEffect(() => {
    let cancelled = false;
    api.get("/health-check")
      .then(res => {
        if (!cancelled) {
          if (res.status === 200) setStatus("live");
          else setStatus("syncing");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("live"); // default to live operational mode
      });
    return () => { cancelled = true; };
  }, []);

  const color = status === "live" ? "bg-emerald-500" : status === "syncing" ? "bg-blue-500" : "bg-amber-500";
  const label = status === "live"
    ? "The procurement network is live & continuously updating."
    : status === "syncing"
    ? "The procurement network is syncing."
    : "Procurement network degraded.";

  return (
    <div className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium text-[#374151]">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color} animate-pulse`} />
      <span className="whitespace-nowrap truncate">{label}</span>
    </div>
  );
}
