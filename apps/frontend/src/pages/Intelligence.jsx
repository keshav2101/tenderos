import { useState, useEffect } from 'react';
import { fetchMarketTrends } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, TrendingUp, Users, Globe } from 'lucide-react';

const SECTOR_COLORS = ['#1a3c6e', '#FF6B00', '#138808', '#0284c7', '#7c3aed'];

export default function Intelligence() {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketTrends().then(setTrends).catch(console.error).finally(() => setLoading(false));
  }, []);

  const timeData = [
    { month: 'Feb', tenders: 3000 }, { month: 'Mar', tenders: 2000 },
    { month: 'Apr', tenders: 2780 }, { month: 'May', tenders: 1890 },
    { month: 'Jun', tenders: 2390 }, { month: 'Jul', tenders: trends?.total_tenders ?? 3490 },
  ];

  const sectorData = [
    { name: 'Defence', value: 1245 },
    { name: 'IT', value: 980 },
    { name: 'Healthcare', value: 856 },
    { name: 'Civil', value: 2100 },
    { name: 'Energy', value: 654 },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Market Intelligence</h1>
          <p className="page-subtitle">Advanced analytics, sector forecasting, and procurement network analysis</p>
        </div>
        <button className="btn btn-outline flex-row gap-2">
          <Globe size={14} />GeM Portal Sync
        </button>
      </div>

      {loading ? <div className="loading-pulse" style={{ padding: 40 }}>Loading intelligence data...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Area Chart */}
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title"><Activity size={15} />Tender Issuance Volume — Last 6 Months</h2>
              <span className="badge badge-green">Live Sync</span>
            </div>
            <div className="panel-content" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="navyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1a3c6e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1a3c6e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: 6, boxShadow: 'var(--shadow-md)', fontSize: 13 }} />
                  <Area type="monotone" dataKey="tenders" name="Tenders" stroke="#1a3c6e" strokeWidth={2.5} fill="url(#navyGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Bar Chart */}
            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title"><TrendingUp size={15} />Active Bids by Sector</h2>
              </div>
              <div className="panel-content" style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
                    <XAxis dataKey="name" fontSize={11.5} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11.5} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: 6, boxShadow: 'var(--shadow-md)', fontSize: 13 }} />
                    <Bar dataKey="value" name="Active Bids" radius={[4, 4, 0, 0]} fill="#1a3c6e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PSU Concentration */}
            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title"><Users size={15} />PSU Supplier Concentration</h2>
              </div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>PSU / Body</th>
                      <th>Risk Level</th>
                      <th style={{ textAlign: 'right' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'ONGC', risk: 'badge-danger', label: 'Very High', score: '90%' },
                      { name: 'HAL (Defence)', risk: 'badge-danger', label: 'Very High', score: '95%' },
                      { name: 'BHEL', risk: 'badge-orange', label: 'Medium', score: '55%' },
                      { name: 'NTPC', risk: 'badge-orange', label: 'Medium', score: '50%' },
                      { name: 'IREPS Railways', risk: 'badge-green', label: 'Competitive', score: '25%' },
                    ].map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</td>
                        <td><span className={`badge ${r.risk}`}>{r.label}</span></td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
