"use client";

import { motion } from "framer-motion";
import { Check, ShieldCheck, Zap, Layers, ArrowDown } from "lucide-react";
import Link from "next/link";

export default function DigitalTwinDiagram() {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-3xl p-6 sm:p-10 shadow-xs" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-xl mb-8">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#1d4ed8] uppercase tracking-wider bg-[#eff6ff] px-3 py-1 rounded-full mb-2">
          <Layers className="w-3 h-3 text-[#1d4ed8]" /> Company Twin &amp; Decision Matrix
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
          Bid Intelligence Engine
        </h2>
        <p className="text-xs sm:text-sm text-[#6b7280] mt-1 leading-relaxed">
          Not just a list of tenders. TenderOS cross-references your Company Digital Twin against every tender requirement and delivers an automated Go / No-Go decision with cited rationale.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 items-center">
        
        {/* Left Feature Bullet Checklist */}
        <div className="space-y-4">
          <div className="text-sm font-extrabold text-[#111827]">
            Automated Cross-Referencing &amp; Compliance Checks
          </div>

          <div className="space-y-3 text-xs text-[#374151]">
            {[
              { title: "Eligibility & Turnover Verification", desc: "Cross-checks 3-year turnover and audited balance sheets against NIT criteria." },
              { title: "EMD & Security Deposit Exemption", desc: "Detects Udyam MSME and Startup India waivers under GFR 2017 Rule 170." },
              { title: "Make in India (MII) Preference", desc: "Verifies Class-I/II local content percentages under GFR 144(xi) norms." },
              { title: "Price Intelligence & L1 Estimation", desc: "Predicts competitive bidding ranges based on historical PSU awarded contracts." },
              { title: "Onerous Risk & Penalty Detection", desc: "Flags liquid damages, strict arbitration clauses, and tight SLA timelines." },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#eff6ff] text-[#1d4ed8] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-bold text-[#111827]">{item.title}</div>
                  <div className="text-[11px] text-[#6b7280] leading-snug">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#1d4ed8] text-white px-4 py-2 rounded-lg hover:bg-[#1e40af] transition-colors shadow-xs">
              Explore Decision Engine
            </Link>
          </div>
        </div>

        {/* Right Product-Native System Diagram */}
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-5 sm:p-6 space-y-4 text-center">
          
          {/* Node 1: Digital Twin */}
          <div className="bg-white border-2 border-[#bfdbfe] rounded-xl p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-[#1d4ed8] uppercase tracking-wider mb-1">
              <span>COMPANY DIGITAL TWIN</span>
              <ShieldCheck className="w-4 h-4 text-[#1d4ed8]" />
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-[9px] font-mono text-[#475569] font-medium pt-1">
              <span className="bg-[#f1f5f9] py-1 rounded">GST</span>
              <span className="bg-[#f1f5f9] py-1 rounded">PAN</span>
              <span className="bg-[#f1f5f9] py-1 rounded">UDYAM</span>
              <span className="bg-[#f1f5f9] py-1 rounded">FINANCIALS</span>
              <span className="bg-[#f1f5f9] py-1 rounded truncate">EXPERIENCE</span>
            </div>
          </div>

          <div className="flex justify-center text-[#9ca3af]">
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </div>

          {/* Node 2: AI Engine */}
          <div className="bg-[#eff6ff] border-2 border-[#1d4ed8] rounded-xl p-4 shadow-sm text-left space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold text-[#1d4ed8] uppercase tracking-wider">AI ANALYSIS ENGINE</div>
              <Zap className="w-4 h-4 text-[#1d4ed8]" />
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="bg-white border border-[#bfdbfe] p-2 rounded-lg">
                <div className="text-[#6b7280]">Eligibility</div>
                <div className="font-mono font-bold text-[#059669] mt-0.5">100% PASS</div>
              </div>
              <div className="bg-white border border-[#bfdbfe] p-2 rounded-lg">
                <div className="text-[#6b7280]">Risk Score</div>
                <div className="font-mono font-bold text-[#1d4ed8] mt-0.5">LOW RISK</div>
              </div>
              <div className="bg-white border border-[#bfdbfe] p-2 rounded-lg">
                <div className="text-[#6b7280]">Win Prob.</div>
                <div className="font-mono font-bold text-[#059669] mt-0.5">81%</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center text-[#9ca3af]">
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </div>

          {/* Node 3: Decision */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#059669] text-white py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" /> BID RECOMMENDATION
            </div>
            <div className="bg-[#e2e8f0] text-[#6b7280] py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center">
              NO BID
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
