import { ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle, FileText, Scale, Download } from 'lucide-react';

export default function Governance() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Governance & Compliance</h1>
          <p className="page-subtitle">Automated GFR 2017, CVC, and Make in India compliance audit framework</p>
        </div>
        <div className="flex-row gap-2">
          <button className="btn btn-outline flex-row gap-2"><Download size={14} />Export Audit Report</button>
          <button className="btn btn-primary flex-row gap-2"><ShieldCheck size={14} />Run Full Scan</button>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-grid">
        {[
          { label: 'Overall Compliance', value: '98.4%', sub: 'Based on 14,200 tender scans', icon: <ShieldCheck size={16} style={{ color: 'var(--success)' }} />, color: 'var(--success)' },
          { label: 'MII Class-I Violations', value: '12', sub: 'Detected across sub-contractors', icon: <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />, color: 'var(--warning)' },
          { label: 'MSME EMD Audit', value: '100%', sub: 'Zero unauthorized rejections', icon: <CheckCircle2 size={16} style={{ color: 'var(--navy)' }} />, color: 'var(--navy)' },
          { label: 'CVC Risk Flags', value: '3', sub: 'Requires immediate review', icon: <AlertCircle size={16} style={{ color: 'var(--danger)' }} />, color: 'var(--danger)' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ borderLeftColor: s.color }}>
            <div className="stat-card-header"><span>{s.label}</span>{s.icon}</div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-card-trend">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* GFR Table */}
      <div className="panel mb-4">
        <div className="panel-header">
          <h2 className="panel-title"><Scale size={15} />Automated Rule Verification — GFR 2017</h2>
          <span className="badge badge-green">All Systems Nominal</span>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule / Guideline</th>
                <th>Scope</th>
                <th>Description</th>
                <th>Status</th>
                <th>Last Run</th>
              </tr>
            </thead>
            <tbody>
              {[
                { rule: 'GFR Rule 144(xi)', scope: 'All Tenders',  desc: 'Land Border Country Restrictions & DPIIT Registration Verification', status: 'badge-green', label: 'Enforced', time: '10 min ago' },
                { rule: 'GFR Rule 170',     scope: 'MSME Bidders', desc: 'Udyam Certificate-based EMD Exemption (100% waiver)',               status: 'badge-green', label: 'Enforced', time: '1 hr ago' },
                { rule: 'MII Order 2017',   scope: 'All Tenders',  desc: 'Class-I / Class-II Local Content Preference Enforcement',           status: 'badge-green', label: 'Enforced', time: 'Realtime' },
                { rule: 'GFR Rule 173(i)',  scope: 'High-Value',   desc: 'Transparency & QCBS Evaluation Audit Trail',                        status: 'badge-orange', label: 'Reviewing (3)', time: 'Active' },
                { rule: 'GFR Rule 175',     scope: 'Above ₹2Cr',   desc: 'Integrity Pact Compliance — Anti-Corruption Mandate',               status: 'badge-green', label: 'Enforced', time: '30 min ago' },
                { rule: 'CVC Guidelines',   scope: 'All Stages',   desc: 'Central Vigilance Commission Procurement Process Audit',             status: 'badge-danger', label: 'Flag: 3 items', time: 'Active' },
              ].map((r, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--navy)', fontSize: 12.5 }}>{r.rule}</td>
                  <td><span className="badge badge-navy" style={{ fontSize: 11 }}>{r.scope}</span></td>
                  <td className="text-sm text-muted">{r.desc}</td>
                  <td><span className={`badge ${r.status}`}>{r.label}</span></td>
                  <td className="text-xs text-muted">{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Items */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title"><AlertCircle size={15} style={{ color: 'var(--danger)' }} />CVC Risk Flags — Manual Review Required</h2>
        </div>
        <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { id: 'TEN-2024-00412', issue: 'Single-bid scenario detected — consider re-tendering per CVC circular.', level: 'badge-danger' },
            { id: 'TEN-2024-00388', issue: 'Evaluation score deviation exceeds 15% threshold — review QCBS committee notes.', level: 'badge-orange' },
            { id: 'TEN-2024-00301', issue: 'Missing Integrity Pact certificate for contract above ₹2 Cr threshold.', level: 'badge-danger' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--gray-50)', alignItems: 'center' }}>
              <span className={`badge ${item.level}`} style={{ whiteSpace: 'nowrap' }}>Flag</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--navy)', fontWeight: 600, marginRight: 10 }}>{item.id}</span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.issue}</span>
              </div>
              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 12, flexShrink: 0 }}>Review</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
