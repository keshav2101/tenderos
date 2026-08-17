import { useState, useEffect } from 'react';
import { fetchTenders } from '../services/api';
import { Search, Filter, ShieldCheck, MapPin, Building, Calendar, ExternalLink, Download } from 'lucide-react';

export default function Tenders() {
  const [data, setData] = useState({ tenders: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', category: '', msme_eligible: false });

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(async () => {
      try { setData(await fetchTenders(1, filters)); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [filters]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tender Catalog</h1>
          <p className="page-subtitle">Browse, filter, and track active government procurement opportunities</p>
        </div>
        <div className="flex-row gap-2">
          <button className="btn btn-outline flex-row gap-2">
            <Download size={14} />Export CSV
          </button>
          <button className="btn btn-primary flex-row gap-2">
            + Add Watchlist
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="panel mb-4" style={{ flexDirection: 'row', padding: '12px 16px', gap: 12, alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, width: 'auto' }}>
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by Tender ID, title, ministry, or organisation..."
            value={filters.q}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
          />
        </div>
        <select
          className="select-input"
          value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
          style={{ width: 180 }}
        >
          <option value="">All Categories</option>
          <option value="IT">IT & Software</option>
          <option value="Cybersecurity">Cybersecurity</option>
          <option value="Construction">Construction & Civil</option>
          <option value="Defence">Defence & Aerospace</option>
          <option value="Healthcare">Healthcare</option>
        </select>
        <button
          className={`btn flex-row gap-2 ${filters.msme_eligible ? 'btn-navy' : 'btn-outline'}`}
          onClick={() => setFilters(f => ({ ...f, msme_eligible: !f.msme_eligible }))}
          style={{ whiteSpace: 'nowrap' }}
        >
          <ShieldCheck size={14} />
          MSME Eligible
        </button>
        <button className="btn btn-outline flex-row gap-2">
          <Filter size={14} />More Filters
        </button>
      </div>

      {/* Table */}
      <div className="panel">
        {!loading && data.total > 0 && (
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--gray-50)', fontSize: 12, color: 'var(--text-muted)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{data.tenders.length}</strong> of <strong style={{ color: 'var(--navy)' }}>{data.total.toLocaleString('en-IN')}</strong> tenders
            {filters.msme_eligible && <span className="badge badge-green" style={{ marginLeft: 8 }}>MSME Filter Active</span>}
          </div>
        )}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '32%' }}>Tender Details</th>
                <th style={{ width: '22%' }}>Organization / State</th>
                <th style={{ width: '18%' }}>Value & EMD</th>
                <th style={{ width: '14%' }}>Deadline</th>
                <th style={{ width: '8%' }}>Status</th>
                <th style={{ width: '6%' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 48 }}>
                  <div className="loading-pulse">Fetching tenders from procurement database...</div>
                </td></tr>
              ) : data.tenders.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                  No tenders found matching your search criteria.
                </td></tr>
              ) : data.tenders.map((tender) => (
                <tr key={tender.id}>
                  <td>
                    <span className="table-title">{tender.title}</span>
                    <div className="flex-row gap-1 mt-1" style={{ flexWrap: 'wrap' }}>
                      <span className="badge badge-outline">{tender.id?.substring(0, 10)}…</span>
                      {tender.msme_eligible && <span className="badge badge-green">MSME Waiver</span>}
                      {tender.categories?.slice(0, 1).map(c => <span key={c} className="badge badge-blue">{c}</span>)}
                    </div>
                  </td>
                  <td>
                    <div className="flex-row gap-1 mb-1">
                      <Building size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{tender.organisation}</span>
                    </div>
                    <div className="flex-row gap-1">
                      <MapPin size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span className="text-xs text-muted">{tender.state} · {tender.ministry?.substring(0, 24)}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--navy)', fontSize: 14 }}>
                      ₹{tender.estimated_cost_lakhs?.toLocaleString('en-IN') ?? '—'}L
                    </div>
                    <div className="text-xs text-muted mt-1">EMD: ₹{tender.emd_lakhs?.toLocaleString('en-IN') ?? '—'}L</div>
                  </td>
                  <td>
                    <div className="flex-row gap-1">
                      <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-sm" style={{ fontWeight: 600 }}>
                        {new Date(tender.submission_deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-xs text-muted mt-1">{tender.procurement_method}</div>
                  </td>
                  <td>
                    <span className="badge badge-green">Open</span>
                  </td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '5px 10px', fontSize: 12 }}>
                      <ExternalLink size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
