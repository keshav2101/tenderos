"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Command, Zap, Layers, Cpu, Building2, MapPin,
  TrendingUp, Bookmark, Settings, Shield, ArrowRight, X, Sparkles, Sliders
} from "lucide-react";
import { matchStateName } from "@/lib/catalog";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const navigationItems = [
    { label: "Command Center Dashboard", href: "/dashboard", category: "Navigation", icon: Zap },
    { label: "Enterprise Tender Search", href: "/dashboard/search", category: "Navigation", icon: Search },
    { label: "AI Procurement Copilot & RAG", href: "/dashboard/intelligence", category: "AI & Analytics", icon: Cpu },
    { label: "Market Analytics & Projections", href: "/dashboard/analytics", category: "AI & Analytics", icon: TrendingUp },
    { label: "Saved Tenders & Proposal Generator", href: "/dashboard/watchlist", category: "Workflows", icon: Bookmark },
    { label: "Portals & Connectors Hub (36 States/UTs)", href: "/dashboard/connectors", category: "Infrastructure", icon: Layers },
    { label: "Organization Digital Twin & Compliance", href: "/dashboard/profile", category: "Account", icon: Building2 },
    { label: "System Settings & API Integrations", href: "/dashboard/settings", category: "Account", icon: Settings },
    { label: "Admin Console & Audit Logs", href: "/dashboard/admin", category: "Admin", icon: Shield },
  ];

  const quickFilterPrompts = [
    { label: "Show MSME Udyam EMD Exempt Tenders", action: () => router.push("/dashboard/search?msme=true") },
    { label: "Show Delhi (NCT) Tenders", action: () => router.push("/dashboard/states/Delhi%20(NCT)") },
    { label: "Show Jammu & Kashmir Tenders", action: () => router.push("/dashboard/states/Jammu%20%26%20Kashmir") },
    { label: "Show Ministry of Defence Tenders", action: () => router.push("/dashboard/ministries/Ministry%20of%20Defence") },
    { label: "Show High Value (> ₹10 Cr) Tenders", action: () => router.push("/dashboard/search?cost_min=1000") },
  ];

  const filteredNav = navigationItems.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPrompts = quickFilterPrompts.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const totalItems = filteredNav.length + filteredPrompts.length;

  const handleSelect = useCallback((index: number) => {
    if (index < filteredNav.length) {
      router.push(filteredNav[index].href);
    } else {
      const promptIndex = index - filteredNav.length;
      if (filteredPrompts[promptIndex]) {
        filteredPrompts[promptIndex].action();
      }
    }
    onClose();
  }, [filteredNav, filteredPrompts, router, onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItems) % Math.max(1, totalItems));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim() && totalItems === 0) {
        // Direct search routing
        router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
        onClose();
      } else if (totalItems > 0) {
        handleSelect(selectedIndex);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }, [isOpen, totalItems, selectedIndex, handleSelect, query, router, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border-indigo-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-800 bg-slate-900/90">
          <Search className="w-5 h-5 text-indigo-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, state (e.g. Delhi, J&K), ministry, or tender query..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full py-4 text-sm bg-transparent text-slate-100 placeholder-slate-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-200 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="ml-2 flex-shrink-0 text-[10px]">ESC</kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-4 max-h-[400px]">
          {/* Natural Language Prompt Execution */}
          {query.trim() && (
            <button
              onClick={() => {
                router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
                onClose();
              }}
              className="w-full p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-left hover:bg-indigo-900/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-indigo-200 font-medium">
                  Execute Live AI Search for <strong className="text-white">"{query}"</strong>
                </span>
              </div>
              <span className="text-[10px] text-indigo-400 flex items-center gap-1 font-semibold">
                Press Enter <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          )}

          {/* Navigation Section */}
          {filteredNav.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1">
                Pages & Workflows
              </div>
              {filteredNav.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={item.href}
                    onClick={() => handleSelect(idx)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30"
                        : "text-slate-300 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isSelected ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-400"}`}>
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Prompts Section */}
          {filteredPrompts.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1">
                Quick Intelligence Filters
              </div>
              {filteredPrompts.map((item, idx) => {
                const globalIdx = filteredNav.length + idx;
                const isSelected = selectedIndex === globalIdx;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleSelect(globalIdx)}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30"
                        : "text-slate-300 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sliders className={`w-4 h-4 ${isSelected ? "text-white" : "text-indigo-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-500"}`} />
                  </button>
                );
              })}
            </div>
          )}

          {totalItems === 0 && !query.trim() && (
            <div className="p-8 text-center text-xs text-slate-400">
              Type to search pages, ministries, states, or live tenders...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd>↵</kbd> Select</span>
            <span className="flex items-center gap-1"><kbd>ESC</kbd> Close</span>
          </div>
          <div className="flex items-center gap-1 text-indigo-400 font-semibold">
            <Zap className="w-3 h-3" /> TenderOS Command Matrix
          </div>
        </div>
      </div>
    </div>
  );
}
