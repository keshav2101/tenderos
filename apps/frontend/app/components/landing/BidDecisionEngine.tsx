"use client";
import { useEffect, useRef, useState } from "react";

export default function BidDecisionEngine() {
  const ref = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const lc = visible ? "svg-draw" : "";

  return (
    <svg
      ref={ref}
      viewBox="0 0 560 640"
      className="w-full"
      style={{ fontFamily: "Inter, system-ui, sans-serif", maxHeight: "640px" }}
    >
      {/* ── COMPANY PROFILE ── */}
      <rect x="160" y="12" width="240" height="52" rx="6" fill="#f0f5ff" stroke="#bfdbfe" strokeWidth="1.5" />
      <text x="280" y="32" textAnchor="middle" fontSize="10" fontWeight="800" fill="#1e40af" letterSpacing="1.5">COMPANY DIGITAL TWIN</text>
      <text x="280" y="50" textAnchor="middle" fontSize="8.5" fill="#6b7280">Udyam · GST · PAN · CIN · DSC · ISO</text>

      {/* down */}
      <line x1="280" y1="64" x2="280" y2="90" stroke="#e5e7eb" strokeWidth="1" className={lc} />
      {/* horizontal spread */}
      <line x1="60" y1="90" x2="500" y2="90" stroke="#e5e7eb" strokeWidth="1" className={lc} />
      {[60, 170, 280, 390, 500].map((x, i) => (
        <line key={i} x1={x} y1="90" x2={x} y2="112" stroke="#e5e7eb" strokeWidth="1" className={lc} />
      ))}

      {/* Attribute boxes */}
      {[
        { x: 18,  label: "Turnover",      sub: "₹72.4 Cr" },
        { x: 124, label: "Experience",    sub: "8.2 yrs" },
        { x: 232, label: "Certs",         sub: "ISO/EMD" },
        { x: 340, label: "Geography",     sub: "Pan-India" },
        { x: 456, label: "MSME",          sub: "Class-I" },
      ].map(item => (
        <g key={item.label}>
          <rect x={item.x} y="112" width="86" height="38" rx="4" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="1" />
          <text x={item.x + 43} y="126" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#374151">{item.label}</text>
          <text x={item.x + 43} y="142" textAnchor="middle" fontSize="7.5" fill="#9ca3af">{item.sub}</text>
        </g>
      ))}

      {/* converge */}
      {[61, 167, 275, 383, 499].map((x, i) => (
        <line key={i} x1={x} y1="150" x2={x} y2="172" stroke="#e5e7eb" strokeWidth="1" className={lc} />
      ))}
      <line x1="61" y1="172" x2="499" y2="172" stroke="#e5e7eb" strokeWidth="1" className={lc} />
      <line x1="280" y1="172" x2="280" y2="196" stroke="#e5e7eb" strokeWidth="1" className={lc} />

      {/* ── TENDER REQUIREMENTS ── */}
      <rect x="140" y="196" width="280" height="52" rx="5" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="1.5" />
      <text x="280" y="216" textAnchor="middle" fontSize="10" fontWeight="700" fill="#374151" letterSpacing="1">TENDER REQUIREMENTS</text>
      <text x="280" y="234" textAnchor="middle" fontSize="8" fill="#9ca3af">NIT · BOQ · Qualification · GFR · CVC</text>
      <text x="280" y="247" textAnchor="middle" fontSize="7.5" fill="#c5cdd8">₹42.8 Cr · QCBS 70:30 · Single envelope</text>

      {/* dashed down */}
      <line x1="280" y1="248" x2="280" y2="278" stroke="#1d4ed8" strokeWidth="1.5" strokeDasharray="5 3" className={lc} />

      {/* ── AI ANALYSIS ── */}
      <rect x="140" y="278" width="280" height="52" rx="5" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" />
      <text x="280" y="299" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1d4ed8" letterSpacing="1.5">AI ANALYSIS ENGINE</text>
      <text x="280" y="318" textAnchor="middle" fontSize="8" fill="#60a5fa">Eligibility · Risk · Market Intel · L1 Price</text>

      {/* three outputs */}
      <line x1="280" y1="330" x2="280" y2="352" stroke="#e5e7eb" strokeWidth="1" className={lc} />
      <line x1="100" y1="352" x2="460" y2="352" stroke="#e5e7eb" strokeWidth="1" className={lc} />
      {[100, 280, 460].map((x, i) => (
        <line key={i} x1={x} y1="352" x2={x} y2="376" stroke="#e5e7eb" strokeWidth="1" className={lc} />
      ))}

      {/* Output cards */}
      {[
        { x: 24,  bg: "#f0fdf4", border: "#86efac", label: "ELIGIBLE",     sub: "94% match score",  badge: "PASS",   bc: "#15803d" },
        { x: 206, bg: "#fffbeb", border: "#fde68a", label: "RISK",          sub: "1 HIGH · 2 MED",  badge: "MED",    bc: "#b45309" },
        { x: 386, bg: "#eff6ff", border: "#bfdbfe", label: "OPPORTUNITY",   sub: "81% win prob.",   badge: "HIGH",   bc: "#1d4ed8" },
      ].map(o => (
        <g key={o.label}>
          <rect x={o.x} y="376" width="148" height="52" rx="5" fill={o.bg} stroke={o.border} strokeWidth="1.5" />
          <text x={o.x + 74} y="395" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#374151">{o.label}</text>
          <text x={o.x + 74} y="412" textAnchor="middle" fontSize="8" fill="#6b7280">{o.sub}</text>
          <rect x={o.x + 54} y="420" width="40" height="14" rx="3" fill={o.bc} opacity="0.12" />
          <text x={o.x + 74} y="430" textAnchor="middle" fontSize="7" fontWeight="700" fill={o.bc}>{o.badge}</text>
        </g>
      ))}

      {/* converge to decision */}
      {[98, 280, 460].map((x, i) => (
        <line key={i} x1={x} y1="428" x2={x} y2="450" stroke="#e5e7eb" strokeWidth="1" className={lc} />
      ))}
      <line x1="98" y1="450" x2="460" y2="450" stroke="#e5e7eb" strokeWidth="1" className={lc} />
      <line x1="280" y1="450" x2="280" y2="474" stroke="#1d4ed8" strokeWidth="2" className={lc} />

      {/* ── FINAL DECISION ── */}
      <rect x="158" y="474" width="244" height="66" rx="8" fill="#1d4ed8" />
      <text x="280" y="498" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" letterSpacing="3">BID</text>
      <text x="280" y="518" textAnchor="middle" fontSize="9" fill="#bfdbfe">Win Probability: 81%</text>
      <text x="280" y="533" textAnchor="middle" fontSize="8" fill="#93c5fd">High confidence · 4 hr preparation</text>

      {/* NO BID branch */}
      <rect x="456" y="482" width="82" height="50" rx="5" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="1.5" />
      <text x="497" y="505" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#9ca3af">NO</text>
      <text x="497" y="521" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#9ca3af">BID</text>
      <line x1="402" y1="507" x2="456" y2="507" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 3" className={lc} />

      {/* annotation */}
      <text x="14" y="628" fontSize="8" fill="#c5cdd8">TenderOS Bid Intelligence Engine · GFR 2017 · CVC Compliant</text>
    </svg>
  );
}
