"use client";

import { useState, useEffect, useRef } from "react";
import {
  Shield, Server, Play, RefreshCw, Terminal, Eye,
  CheckCircle2, AlertOctagon, RotateCw, Settings, Trash2, Cpu
} from "lucide-react";

interface ScraperJob {
  portal: string;
  status: "idle" | "running" | "success" | "failed";
  last_run: string;
  tenders_indexed: number;
}

interface IngestionLog {
  timestamp: string;
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
}

export default function AdminPanelPage() {
  const [jobs, setJobs] = useState<ScraperJob[]>([
    { portal: "Government e-Marketplace (GeM)", status: "idle", last_run: "2026-07-05 02:30:12", tenders_indexed: 145 },
    { portal: "Central Public Procurement Portal (CPPP)", status: "idle", last_run: "2026-07-05 03:00:45", tenders_indexed: 98 },
    { portal: "Indian Railways (IREPS)", status: "idle", last_run: "2026-07-04 18:15:20", tenders_indexed: 54 },
  ]);

  const [logs, setLogs] = useState<IngestionLog[]>([
    { timestamp: "04:10:02", level: "INFO", message: "Scheduler initialized successfully. Checking cron jobs..." },
    { timestamp: "04:10:05", level: "INFO", message: "Synchronizing state cache with Redis cluster..." },
    { timestamp: "04:11:15", level: "INFO", message: "Checking CPPP RSS seed feeds..." },
    { timestamp: "04:11:17", level: "INFO", message: "Parsed 12 new notices from CPPP. Queueing to Celery worker..." },
  ]);

  const [systemStats, setSystemStats] = useState({
    cpu: 18,
    memory: 42,
    redisQueue: 0,
    dbConnection: "Healthy",
  });

  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Simulate stats updates
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        cpu: Math.min(Math.max(prev.cpu + Math.floor(Math.random() * 7) - 3, 10), 45),
        redisQueue: Math.max(prev.redisQueue + (Math.random() > 0.85 ? Math.floor(Math.random() * 3) : 0), 0)
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const triggerJob = (portalIndex: number) => {
    // Set status to running
    setJobs(prev => prev.map((j, i) => i === portalIndex ? { ...j, status: "running" as const } : j));
    
    // Add info log
    const portalName = jobs[portalIndex].portal;
    const now = new Date().toLocaleTimeString("en-IN", { hour12: false });
    setLogs(l => [...l, { timestamp: now, level: "INFO", message: `Manually triggered ingestion connector for: ${portalName}` }]);

    // Complete job on a simulated timeout
    setTimeout(() => {
      setJobs(prev => prev.map((j, i) => i === portalIndex ? {
        ...j,
        status: "success" as const,
        last_run: new Date().toISOString().replace("T", " ").substring(0, 19),
        tenders_indexed: j.tenders_indexed + Math.floor(Math.random() * 25) + 5
      } : j));

      const doneTime = new Date().toLocaleTimeString("en-IN", { hour12: false });
      setLogs(l => [...l, 
        { timestamp: doneTime, level: "INFO", message: `Successfully completed indexing for ${portalName}. Added documents to vector storage.` }
      ]);
    }, 4000);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-400" /> Administrative Panel
        </h1>
        <p className="text-sm text-muted mt-0.5">Control ingestion schedulers, trigger scrapers, and monitor system health.</p>
      </div>

      {/* Observability Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Broker Queue Length", value: `${systemStats.redisQueue} jobs`, desc: "Redis pending tasks", color: "text-indigo-400" },
          { label: "Vector Ingestion API", value: "Healthy", desc: "Response latency ~12ms", color: "text-emerald-400" },
          { label: "Gateway CPU load", value: `${systemStats.cpu}%`, desc: "Virtual cores active", color: "text-amber-400" },
          { label: "Active Connections", value: "100%", desc: "DB connection pool size: 20", color: "text-pink-400" },
        ].map((item, i) => (
          <div key={i} className="card p-4">
            <span className="text-[10px] text-muted uppercase font-semibold block mb-0.5">{item.label}</span>
            <span className={`text-lg font-bold ${item.color} block`}>{item.value}</span>
            <span className="text-[9px] text-muted mt-0.5 block">{item.desc}</span>
          </div>
        ))}
      </div>

      {/* Main grids */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Scheduler / Jobs panel */}
        <div className="card p-5 space-y-4 col-span-2">
          <div className="flex items-center justify-between border-b border-subtle pb-2">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-primary font-bold">Connector Schedulers</h2>
            </div>
            <span className="badge badge-blue text-[9px]">Cron Sync Enabled</span>
          </div>

          <div className="divide-y divide-subtle">
            {jobs.map((job, idx) => (
              <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-primary">{job.portal}</h3>
                  <div className="flex gap-3 text-[10px] text-muted mt-0.5">
                    <span>Last Run: {job.last_run}</span>
                    <span>•</span>
                    <span>Indexed: {job.tenders_indexed} opportunities</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {job.status === "running" ? (
                    <span className="text-xs text-indigo-400 flex items-center gap-1 font-medium">
                      <RotateCw className="w-3.5 h-3.5 animate-spin" /> Ingestion active
                    </span>
                  ) : (
                    <button
                      onClick={() => triggerJob(idx)}
                      className="btn btn-secondary text-[10px] py-1 px-3 flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3 text-emerald-400 fill-current" /> Trigger Sync
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System resources */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-subtle pb-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-primary font-bold">Node Hardware Metrics</h2>
          </div>

          <div className="space-y-4 text-xs text-secondary">
            {/* CPU */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>CPU Utilization</span>
                <span>{systemStats.cpu}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-indigo-400 h-1.5 rounded-full transition-all duration-300" style={{ width: `${systemStats.cpu}%` }} />
              </div>
            </div>

            {/* Memory */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>RAM Usage</span>
                <span>{systemStats.memory}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${systemStats.memory}%` }} />
              </div>
            </div>

            <div className="pt-2 border-t border-subtle space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Elasticsearch Shards</span>
                <span className="text-primary font-mono">15 Active</span>
              </div>
              <div className="flex justify-between">
                <span>OCR Pipeline Workers</span>
                <span className="text-primary font-mono">4 Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logs console */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-subtle pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-primary font-bold">Ingestion Console Outputs</h2>
          </div>
          <button onClick={clearLogs} className="text-[10px] text-red-400 hover:underline flex items-center gap-1">
            <Trash2 className="w-3 h-3" /> Clear Console
          </button>
        </div>

        <div className="bg-black/40 rounded-xl border border-subtle p-4 font-mono text-[10.5px] leading-relaxed text-slate-300 overflow-y-auto max-h-64 space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-slate-500 flex-shrink-0">[{log.timestamp}]</span>
              <span className={`flex-shrink-0 ${log.level === "ERROR" ? "text-red-400 font-bold" : log.level === "WARNING" ? "text-amber-400" : "text-emerald-400"}`}>
                {log.level}
              </span>
              <span className="text-slate-300 select-all">{log.message}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
