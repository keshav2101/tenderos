"use client";
import { useEffect, useRef, useState } from "react";

export default function BidDecisionEngine() {
  const ref = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const lineClass = visible ? "svg-draw" : "";

  return (
    <svg
      ref={ref}
      viewBox="0 0 420 480"
      className="w-full max-w-md"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* COMPANY PROFILE */}
      <rect x="130" y="10" width="160" height="38" rx="4" fill="#f0f5ff" stroke="#bfdbfe" strokeWidth="1" />
      <text x="210" y="24" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e40af" letterSpacing="1">COMPANY PROFILE</text>
      <text x="210" y="38" textAnchor="middle" fontSize="7" fill="#6b7280">Digital Twin · Udyam · GST · ISO</text>

      {/* Branches from profile */}
      {/* Vertical down from box */}
      <line x1="210" y1="48" x2="210" y2="68" stroke="#e5e7eb" strokeWidth="1" className={lineClass} />

      {/* Horizontal spread */}
      <line x1="80" y1="68" x2="340" y2="68" stroke="#e5e7eb" strokeWidth="1" className={lineClass} />

      {/* Branch lines down */}
      {[80, 150, 210, 270, 340].map((x, i) => (
        <line key={i} x1={x} y1="68" x2={x} y2="88" stroke="#e5e7eb" strokeWidth="1" className={lineClass} />
      ))}

      {/* Attribute boxes */}
      {[
        { x: 40, label: "Turnover", sub: "₹72.4 Cr" },
        { x: 112, label: "Experience", sub: "8.2 yrs" },
        { x: 178, label: "Certifications", sub: "ISO/EMD" },
        { x: 236, label: "Geography", sub: "Pan-India" },
        { x: 303, label: "MSME", sub: "Udyam" },
      ].map((item) => (
        <g key={item.label}>
          <rect x={item.x} y="88" width="64" height="30" rx="3" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="1" />
          <text x={item.x + 32} y="100" textAnchor="middle" fontSize="7" fontWeight="600" fill="#374151">{item.label}</text>
          <text x={item.x + 32} y="112" textAnchor="middle" fontSize="6.5" fill="#9ca3af">{item.sub}</text>
        </g>
      ))}

      {/* Lines from attributes converging down */}
      {[72, 144, 210, 268, 335].map((x, i) => (
        <line key={i} x1={x} y1="118" x2={x} y2="138" stroke="#e5e7eb" strokeWidth="1" className={lineClass} />
      ))}
      <line x1="72" y1="138" x2="335" y2="138" stroke="#e5e7eb" strokeWidth="1" className={lineClass} />
      <line x1="210" y1="138" x2="210" y2="158" stroke="#e5e7eb" strokeWidth="1" className={lineClass} />

      {/* TENDER REQUIREMENTS */}
      <rect x="115" y="158" width="190" height="36" rx="4" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="1" />
      <text x="210" y="172" textAnchor="middle" fontSize="8" fontWeight="700" fill="#374151" letterSpacing="1">TENDER REQUIREMENTS</text>
      <text x="210" y="186" textAnchor="middle" fontSize="7" fill="#9ca3af">NIT · BOQ · Qualification Criteria · GFR</text>

      {/* Down to AI ANALYSIS */}
      <line x1="210" y1="194" x2="210" y2="218" stroke="#1d4ed8" strokeWidth="1.5" strokeDasharray="4 2" className={lineClass} />

      {/* AI ANALYSIS */}
      <rect x="115" y="218" width="190" height="38" rx="4" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.5" />
      <text x="210" y="233" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1d4ed8" letterSpacing="1">AI ANALYSIS</text>
      <text x="210" y="247" textAnchor="middle" fontSize="7" fill="#60a5fa">Eligibility · Risk · Market · L1 Price</text>

      {/* Three outputs */}
      <line x1="210" y1="256" x2="210" y2="272" stroke="#e5e7eb" strokeWidth="1" className={lineClass} />
      <line x1="90" y1="272" x2="330" y2="272" stroke="#e5e7eb" strokeWidth="1" className={lineClass} />
      {[90, 210, 330].map((x, i) => (
        <line key={i} x1={x} y1="272" x2={x} y2="292" stroke="#e5e7eb" strokeWidth="1" className={lineClass} />
      ))}

      {/* Output boxes */}
      {[
        { x: 50, bg: "#f0fdf4", stroke: "#86efac", label: "ELIGIBLE", sub: "94% match" },
        { x: 173, bg: "#fffbeb", stroke: "#fde68a", label: "RISK", sub: "3 items" },
        { x: 288, bg: "#eff6ff", stroke: "#bfdbfe", label: "OPPORTUNITY", sub: "81% win" },
      ].map(o => (
        <g key={o.label}>
          <rect x={o.x} y="292" width="82" height="36" rx="4" fill={o.bg} stroke={o.stroke} strokeWidth="1" />
          <text x={o.x + 41} y="307" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#374151">{o.label}</text>
          <text x={o.x + 41} y="320" textAnchor="middle" fontSize="7" fill="#9ca3af">{o.sub}</text>
        </g>
      ))}

      {/* Converge to decision */}
      {[91, 214, 329].map((x, i) => (
        <line key={i} x1={x} y1="328" x2={x} y2="348" stroke="#e5e7eb" strokeWidth="1" className={lineClass} />
      ))}
      <line x1="91" y1="348" x2="329" y2="348" stroke="#e5e7eb" strokeWidth="1" className={lineClass} />
      <line x1="210" y1="348" x2="210" y2="368" stroke="#1d4ed8" strokeWidth="1.5" className={lineClass} />

      {/* FINAL BID DECISION */}
      <rect x="130" y="368" width="160" height="48" rx="6" fill="#1d4ed8" />
      <text x="210" y="388" textAnchor="middle" fontSize="9" fontWeight="800" fill="white" letterSpacing="1.5">BID</text>
      <text x="210" y="404" textAnchor="middle" fontSize="7" fill="#bfdbfe">Win Probability 81%</text>
      <text x="210" y="416" textAnchor="middle" fontSize="6.5" fill="#93c5fd">Recommended · 4h preparation</text>

      {/* Side: NO BID */}
      <rect x="358" y="368" width="56" height="48" rx="4" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="1" />
      <text x="386" y="390" textAnchor="middle" fontSize="8" fontWeight="700" fill="#9ca3af">NO</text>
      <text x="386" y="404" textAnchor="middle" fontSize="8" fontWeight="700" fill="#9ca3af">BID</text>
      <line x1="330" y1="392" x2="358" y2="392" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 2" className={lineClass} />

      {/* Source annotation */}
      <text x="10" y="470" fontSize="7" fill="#c5cdd8" fontFamily="JetBrains Mono, monospace">
        TenderOS Bid Intelligence Engine · Layer 6 · GFR 2017 compliant
      </text>
    </svg>
  );
}
