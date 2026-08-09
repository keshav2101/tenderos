"use client";

import { ShieldCheck, Check, Layers, Building2 } from "lucide-react";

export default function CompanyDigitalTwinView() {
  return (
    <div className="bg-white border border-[#D9E1E8] rounded p-6 sm:p-10 shadow-2xs min-w-0" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-xl mb-8">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#1F5A96] bg-[#F1F5F9] px-2.5 py-0.5 rounded border border-[#D9E1E8] uppercase tracking-wider mb-2">
          <Layers className="w-3 h-3 text-[#1F5A96]" /> AUTOMATED COMPLIANCE TWIN
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight">
          Your Company. Understood.
        </h2>
        <p className="text-xs sm:text-sm text-[#475569] mt-1">
          TenderOS builds a verified Digital Twin of your business credentials to automatically cross-match requirements in seconds.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Digital Twin Credentials Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { tag: "Udyam MSME", status: "VERIFIED", details: "Class: Small Enterprise · EMD Exemption active" },
            { tag: "GST & PAN", status: "ACTIVE", details: "GSTIN 27AAACT1234F1Z5 · Clean filing history" },
            { tag: "Audited Financials", status: "VERIFIED", details: "3-Yr Avg Turnover: ₹14.8 Cr · Positive Net Worth" },
            { tag: "Prior Work Certificates", status: "VERIFIED", details: "4 Completed Govt Contracts > ₹10 Cr value" },
            { tag: "Certifications", status: "ACTIVE", details: "ISO 9001:2015 · CMMI Level 3 · OEM Partnership" },
            { tag: "Class-I Local Supplier", status: "MII VALID", details: "55%+ Local Content under GFR Rule 144(xi)" },
          ].map(c => (
            <div key={c.tag} className="p-3.5 rounded border border-[#D9E1E8] bg-[#F7F9FC] space-y-1.5 min-w-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#0B1F33] truncate">{c.tag}</span>
                <span className="text-[9px] font-mono font-bold text-[#18794E] bg-[#EAF6EF] px-1.5 py-0.5 rounded border border-[#A7F3D0]">
                  {c.status}
                </span>
              </div>
              <p className="text-[10px] text-[#64748B] leading-tight line-clamp-2">{c.details}</p>
            </div>
          ))}
        </div>

        {/* Matching Visual */}
        <div className="bg-[#12355B] text-white rounded p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1F5A96] pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#60A5FA]" />
              <span className="font-extrabold text-sm">Automated Digital Twin Matcher</span>
            </div>
            <ShieldCheck className="w-4 h-4 text-[#18794E]" />
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center bg-[#0B1F33] p-2.5 rounded border border-[#1F5A96]">
              <span>Turnover Criteria (Min ₹10 Cr)</span>
              <span className="font-mono font-bold text-[#4ADE80] flex items-center gap-1"><Check className="w-3.5 h-3.5" /> ₹14.8 Cr (PASS)</span>
            </div>
            <div className="flex justify-between items-center bg-[#0B1F33] p-2.5 rounded border border-[#1F5A96]">
              <span>EMD Deposit Deposit Waiver</span>
              <span className="font-mono font-bold text-[#4ADE80] flex items-center gap-1"><Check className="w-3.5 h-3.5" /> EXEMPT (Udyam)</span>
            </div>
            <div className="flex justify-between items-center bg-[#0B1F33] p-2.5 rounded border border-[#1F5A96]">
              <span>Prior Govt Experience</span>
              <span className="font-mono font-bold text-[#4ADE80] flex items-center gap-1"><Check className="w-3.5 h-3.5" /> 4 Projects (PASS)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
