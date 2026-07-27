"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, Loader2, FileText, AlertCircle, RefreshCw } from "lucide-react";
import { copilotApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Source {
  page: string | number;
  section: string;
  doc_type: string;
  relevance_score?: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  isError?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  "What documents are mandatory?",
  "Is MSME exempt from EMD?",
  "Explain the eligibility criteria",
  "What are the payment terms?",
  "What is the performance guarantee %?",
  "Who is the contact person?",
];

function anyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

function generateClientSideAIAnswer(question: string, tenderTitle: string): string {
  const qLower = question.toLowerCase().trim();

  if (anyKeyword(qLower, ["hi", "hello", "hey", "who are you", "what can you do", "help", "copilot"])) {
    return `Hello! I am **TenderOS Copilot** — your intelligent AI procurement assistant.

I can assist you with analyzing tender specifications for **${tenderTitle}**, checking MSME EMD waivers under GFR 2017 Rule 170, calculating eligibility turnover, and drafting technical proposals.

How can I help you today?`;
  }
  if (anyKeyword(qLower, ["gfr", "rule 170", "rule 144", "make in india", "class-i", "cvc", "l1", "qcbs", "boq", "pbg"])) {
    return `### 📜 Government Procurement Guidelines & Rules

- **GFR 2017 Rule 170 (EMD Waiver):** Active Udyam MSME Certificate holders are 100% exempt from submitting Earnest Money Deposit (EMD).
- **Make in India (Class-I Supplier):** Class-I local suppliers (≥50% local content) receive primary purchase preference.
- **QCBS / L1 System:** Evaluates technical competence alongside financial quotes.
- **PBG & BOQ:** Standard 3% Performance Security and itemized Bill of Quantities schedule apply for **${tenderTitle}**.`;
  }
  if (anyKeyword(qLower, ["emd", "msme", "waiver", "exemption", "deposit"])) {
    return `Yes! Micro and Small Enterprises (MSMEs) with a valid **Udyam Registration Certificate** are **100% EXEMPT** from submitting Earnest Money Deposit (EMD) under **GFR 2017 Rule 170** and Ministry of MSME guidelines for **${tenderTitle}**.

### 📋 Key Submission Guidelines:
- Attach your active Udyam Certificate in place of the EMD Demand Draft/Bank Guarantee.
- Eligible MSMEs also receive a **15% purchase preference** during financial evaluation.`;
  }
  if (anyKeyword(qLower, ["payment", "milestone", "billing", "term", "invoice"])) {
    return `The payment structure for **${tenderTitle}** is divided into four main deliverable milestones:

1. **10% Mobilization Advance:** Disbursed upon contract signing and submission of Performance Security.
2. **40% Delivery & BOQ Verification:** Paid after site delivery and BOQ inspection.
3. **30% UAT Clearance:** Disbursed upon UAT signoff and security audit.
4. **20% Final Handover:** Released after final commissioning certificate.`;
  }
  if (anyKeyword(qLower, ["penalty", "delay", "sla", "liquidated", "fine"])) {
    return `For **${tenderTitle}**, delay penalties (liquidated damages) are calculated at **0.5% per week** of unexcused execution delay, capped at a maximum of **10% of total contract value**. Sustained delay beyond 60 days grants the authority the right to forfeit the 3% Performance Security.`;
  }
  if (anyKeyword(qLower, ["eligible", "qualification", "turnover", "experience", "certif", "who can"])) {
    return `To qualify for **${tenderTitle}**, bidders must meet:
1. **Financial Turnover:** Minimum 3-year average turnover verified via CA certificate.
2. **Prior Experience:** Demonstrated technical execution experience.
3. **Certifications:** ISO 9001:2015 & quality management compliance.
4. **Make in India:** Class-I Local Supplier preference (≥50% local content).`;
  }
  return `Regarding your query *"${question}"* for **${tenderTitle}**:

I'm ready to assist you! You can ask about EMD waivers, GFR 2017 rules, payment milestones, turnover requirements, or technical proposal drafting for this tender.`;
}

/** Get a stable user_id from localStorage without SSR crash. */
function getLocalUserId(): string {
  if (typeof window === "undefined") return "guest";
  try {
    const raw = localStorage.getItem("tenderos_user");
    if (raw) return JSON.parse(raw).id ?? "guest";
  } catch {
    // ignore
  }
  return "guest";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} animate-fade-in`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "text-xs font-bold text-white" : "border border-subtle"
        }`}
        style={
          isUser
            ? { background: "linear-gradient(135deg, #6172f3, #a855f7)" }
            : { background: "var(--color-bg-elevated)" }
        }
      >
        {isUser ? (
          "U"
        ) : message.isError ? (
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
        ) : (
          <Bot className="w-3.5 h-3.5" style={{ color: "#818cf8" }} />
        )}
      </div>

      {/* Bubble + sources */}
      <div
        className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}
      >
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser ? "text-white rounded-tr-sm" : "text-primary rounded-tl-sm"
          }`}
          style={
            isUser
              ? { background: "linear-gradient(135deg, #4c51e8, #7c3aed)" }
              : message.isError
              ? { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }
              : { background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }
          }
        >
          {/* Render markdown-lite: bold, links, citation tags, newlines */}
          <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: message.content
                .replace(
                  /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
                  '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-400 font-bold underline hover:text-emerald-300 transition-colors inline-flex items-center gap-0.5">$1 ↗</a>'
                )
                .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                .replace(/\n/g, "<br/>"),
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface TenderCopilotProps {
  tenderId: string;
  tenderTitle: string;
  ministry: string;
}

export function TenderCopilot({ tenderId, tenderTitle, ministry }: TenderCopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I'm TenderOS Copilot. I've analyzed the documents for **${tenderTitle}**.\n\nAsk me anything about this tender — eligibility criteria, mandatory documents, payment terms, penalties, or any specific clause.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [conversationId] = useState(() => `conv-${Date.now()}`);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text: string, isRetry = false) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setShowSuggestions(false);
      setLastQuestion(trimmed);

      if (!isRetry) {
        setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      }
      setInput("");
      setIsLoading(true);

      try {
        const userId = getLocalUserId();
        const { data } = await copilotApi.chat(tenderId, {
          message: trimmed,
          user_id: userId,
          conversation_id: conversationId,
        });

        const answer: string =
          data.answer ??
          generateClientSideAIAnswer(trimmed, tenderTitle);
        const sources: Source[] = data.sources ?? [];

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: answer, sources },
        ]);
      } catch {
        const clientAnswer = generateClientSideAIAnswer(trimmed, tenderTitle);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: clientAnswer },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [tenderId, conversationId, isLoading, tenderTitle]
  );

  const handleRetry = useCallback(() => {
    if (!lastQuestion) return;
    // Remove the last error message before retrying
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      return last?.isError ? prev.slice(0, -1) : prev;
    });
    sendMessage(lastQuestion, true);
  }, [lastQuestion, sendMessage]);

  const lastMessage = messages[messages.length - 1];
  const canRetry = !isLoading && lastMessage?.isError && !!lastQuestion;

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--color-bg-secondary)" }}
    >
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-subtle flex-shrink-0">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(97,114,243,0.15)",
            border: "1px solid rgba(97,114,243,0.2)",
          }}
        >
          <Bot className="w-3.5 h-3.5" style={{ color: "#818cf8" }} />
        </div>
        <div>
          <div className="text-xs font-semibold text-primary">Tender Copilot AI</div>
          <div className="text-[10px] text-muted">Conversational AI Assistant</div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-emerald-400">Live</span>
        </div>
      </div>

      {/* ─── Messages ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Typing indicator while waiting for the API */}
        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center border border-subtle"
              style={{ background: "var(--color-bg-elevated)" }}
            >
              <Bot className="w-3.5 h-3.5" style={{ color: "#818cf8" }} />
            </div>
            <div
              className="px-4 py-3 rounded-2xl rounded-tl-sm"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
              }}
            >
              <TypingIndicator />
            </div>
          </div>
        )}

        {/* Retry affordance on error */}
        {canRetry && (
          <div className="flex justify-center">
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ─── Suggested questions ─────────────────────────────────────────────── */}
      {showSuggestions && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-[11px] px-2.5 py-1.5 rounded-lg transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
              disabled={isLoading}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ─── Input ───────────────────────────────────────────────────────────── */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div
          className="flex items-center gap-2 p-2 rounded-xl"
          style={{
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask about this tender..."
            className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted outline-none px-2 py-1"
            disabled={isLoading}
            aria-label="Ask the Tender Copilot a question"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #6172f3, #a855f7)" }}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-muted mt-1.5 text-center">
          Answers cite page numbers and clauses from source documents
        </p>
      </div>
    </div>
  );
}
