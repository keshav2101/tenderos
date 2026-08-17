import { useState, useEffect } from 'react';
import { fetchMarketTrends, fetchBuyerProfiles } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, FileCheck, Landmark, MapPin, Building2, CheckCircle } from 'lucide-react';

const COLORS = ['#1a3c6e', '#FF6B00', '#138808', '#0284c7', '#7c3aed'];

export default function Dashboard() {
  const [trends, setTrends] = useState(null);
  const [buyers, setBuyers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [t, b] = await Promise.all([fetchMarketTrends(), fetchBuyerProfiles(5)]);
        setTrends(t);
        setBuyers(b.buyer_profiles);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  if (loading) return <div className="loading-pulse" style={{ padding: 40 }}>Loading dashboard data...</div>;
  if (!trends || !buyers) return (
    <div style={{ padding: 40, color: 'var(--danger)', fontSize: 14 }}>
      ⚠ Error loading data. Please ensure the backend is running at http://localhost:8000
    </div>
  );

  const stateData = trends.state_distribution.slice(0, 5).map(s => ({
    name: s.state_name, value: s.tender_count
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Real-time overview of the Indian Government Procurement Ecosystem</p>
        </div>
        <button className="btn btn-primary">+ Create New Tender</button>
      </div>

      {/* Notice Banner */}
      <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderLeft: '4px solid #f59e0b', borderRadius: 6, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
        <CheckCircle size={15} style={{ color: '#d97706', flexShrink: 0 }} />
        <span style={{ color: '#92400e' }}>
          <strong>GeM Portal Sync Active</strong> — 9,000+ tenders loaded. MSME EMD exemptions under GFR Rule 170 are enforced automatically.
        </span>
      </div>

      {/* Stat Cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span>Active Tenders</span>
            <FileCheck size={16} style={{ color: 'var(--navy)' }} />
          </div>
          <div className="stat-card-value">{trends.total_tenders.toLocaleString('en-IN')}</div>
          <div className="flex-row gap-1">
            <TrendingUp size={13} className="trend-up" />
            <span className="stat-card-trend trend-up">+12.5% this month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span>MSME Exemption Rate</span>
            <span style={{ fontSize: 16 }}>⚖️</span>
          </div>
          <div className="stat-card-value">{trends.msme_exemption_rate}%</div>
          <div className="stat-card-trend">Eligible for EMD waiver under Rule 170</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span>Total Value Processed</span>
            <Landmark size={16} style={{ color: '#138808' }} />
          </div>
          <div className="stat-card-value">₹8,420 Cr</div>
          <div className="flex-row gap-1">
            <TrendingUp size={13} className="trend-up" />
            <span className="stat-card-trend trend-up">+4.2% vs last quarter</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span>Top Origin State</span>
            <MapPin size={16} style={{ color: '#0284c7' }} />
          </div>
          <div className="stat-card-value" style={{ fontSize: 20, paddingTop: 4 }}>{stateData[0]?.name}</div>
          <div className="stat-card-trend">{stateData[0]?.value?.toLocaleString('en-IN')} active tenders</div>
        </div>
      </div>

      {/* Panels Grid */}
      <div className="panels-grid">
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title"><Building2 size={16} />Top Government Buyers</h2>
            <button className="btn btn-outline" style={{ padding: '5px 12px', fontSize: 12 }}>View All</button>
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Organization</th>
                  <th>Ministry</th>
                  <th style={{ textAlign: 'right' }}>Tenders</th>
                  <th style={{ textAlign: 'right' }}>Value (₹L)</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((b, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)', width: 32 }}>{i + 1}</td>
                    <td>
                      <span className="table-title" style={{ fontSize: 13.5 }}>{b.buyer_name}</span>
                    </td>
                    <td><span className="text-sm text-muted">{b.ministry_name}</span></td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--navy)' }}>{b.total_tenders}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12 }}>₹{b.total_value_lakhs?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Tenders by State</h2>
          </div>
          <div className="panel-content">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stateData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                  {stateData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, boxShadow: 'var(--shadow-md)' }}
                  formatter={(v) => [v.toLocaleString('en-IN'), 'Tenders']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {stateData.map((d, i) => (
                <div key={i} className="flex-row gap-2" style={{ justifyContent: 'space-between' }}>
                  <div className="flex-row gap-2">
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i], flexShrink: 0 }} />
                    <span className="text-sm text-muted">{d.name}</span>
                  </div>
                  <span className="font-mono text-xs" style={{ color: 'var(--navy)', fontWeight: 600 }}>{d.value?.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
