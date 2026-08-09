"use client";

import { ShieldCheck, Lock, FileText, CheckCircle2 } from "lucide-react";

export default function TrustVerificationSection() {
  return (
    <div className="bg-[#0B1F33] text-white rounded p-8 sm:p-10 shadow-sm" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-xl mb-8">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#EAF6EF] bg-[#18794E] px-2.5 py-0.5 rounded uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#EAF6EF]" /> ENTERPRISE SECURITY &amp; COMPLIANCE
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Trust, Security &amp; Data Governance
        </h2>
        <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
          Built to government security standards with end-to-end encryption, role-based access controls, and audit logging.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded bg-[#12355B] border border-[#1F5A96] space-y-2">
          <Lock className="w-5 h-5 text-[#60A5FA] mb-1" />
          <h3 className="text-xs font-bold text-white">ISO 27001 &amp; SOC 2 Ready</h3>
          <p className="text-[11px] text-[#94A3B8] leading-relaxed">
            Data encrypted in transit (TLS 1.3) and at rest (AES-256) with isolated tenant data stores.
          </p>
        </div>

        <div className="p-5 rounded bg-[#12355B] border border-[#1F5A96] space-y-2">
          <FileText className="w-5 h-5 text-[#60A5FA] mb-1" />
          <h3 className="text-xs font-bold text-white">GFR 2017 &amp; CVC Compliance</h3>
          <p className="text-[11px] text-[#94A3B8] leading-relaxed">
            Rules engine aligned with General Financial Rules 2017 (Rule 170/144) and Central Vigilance Commission guidelines.
          </p>
        </div>

        <div className="p-5 rounded bg-[#12355B] border border-[#1F5A96] space-y-2">
          <CheckCircle2 className="w-5 h-5 text-[#60A5FA] mb-1" />
          <h3 className="text-xs font-bold text-white">Role-Based Access &amp; Audit Logs</h3>
          <p className="text-[11px] text-[#94A3B8] leading-relaxed">
            Granular permissions for Bid Managers, Finance, and Technical teams with full audit trail logging.
          </p>
        </div>
      </div>
    </div>
  );
}
