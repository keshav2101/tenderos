import { Save, User, Building2, Key, Bell } from 'lucide-react';

function Section({ icon: Icon, title, children }) {
  return (
    <div className="panel mb-4">
      <div className="panel-header">
        <h2 className="panel-title"><Icon size={15} />{title}</h2>
      </div>
      <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {children}
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <div style={{ maxWidth: 780 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Settings</h1>
          <p className="page-subtitle">Manage your organization profile, compliance declarations, and API integrations</p>
        </div>
      </div>

      <Section icon={User} title="Administrator Profile">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label>Full Name</label>
            <input type="text" className="text-input" defaultValue="Sanjay Administrator" style={{ width: '100%' }} />
          </div>
          <div>
            <label>Email Address</label>
            <input type="email" className="text-input" defaultValue="admin@tenderos.gov.in" style={{ width: '100%', color: 'var(--text-muted)' }} disabled />
          </div>
          <div>
            <label>Designation</label>
            <input type="text" className="text-input" defaultValue="Joint Secretary (Procurement)" style={{ width: '100%' }} />
          </div>
          <div>
            <label>Ministry / Department</label>
            <input type="text" className="text-input" defaultValue="Ministry of Finance" style={{ width: '100%' }} />
          </div>
        </div>
        <div>
          <button className="btn btn-primary flex-row gap-2"><Save size={14} />Save Profile</button>
        </div>
      </Section>

      <Section icon={Building2} title="Organization Compliance Profile">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label>Udyam MSME Registration Number</label>
            <input type="text" className="text-input" defaultValue="UDYAM-MH-18-002144" style={{ width: '100%', fontFamily: 'var(--font-mono)' }} />
            <div className="text-xs text-muted mt-1">Enables automatic EMD waiver under GFR Rule 170</div>
          </div>
          <div>
            <label>DPIIT Startup Recognition Number</label>
            <input type="text" className="text-input" placeholder="DIPP-XXXXX" style={{ width: '100%', fontFamily: 'var(--font-mono)' }} />
            <div className="text-xs text-muted mt-1">Grants exemptions from prior turnover requirements</div>
          </div>
          <div>
            <label>GeM Seller ID</label>
            <input type="text" className="text-input" placeholder="GEM-Seller-XXXXXX" style={{ width: '100%', fontFamily: 'var(--font-mono)' }} />
          </div>
          <div>
            <label>GST Registration Number</label>
            <input type="text" className="text-input" placeholder="27AAAAA0000A1Z5" style={{ width: '100%', fontFamily: 'var(--font-mono)' }} />
          </div>
        </div>
        <div>
          <label>Make in India — Local Content Declaration</label>
          <select className="select-input" style={{ width: '100%' }} defaultValue="class1">
            <option value="class1">Class-I Local Supplier — ≥ 50% Local Content (Primary Purchase Preference)</option>
            <option value="class2">Class-II Local Supplier — 20% to 49% Local Content</option>
            <option value="nonlocal">Non-Local Supplier — Less than 20% Local Content</option>
          </select>
          <div className="text-xs text-muted mt-1">Used by AI Copilot to determine your purchase preference eligibility under MII Order 2017</div>
        </div>
        <div>
          <button className="btn btn-primary flex-row gap-2"><Save size={14} />Update Compliance Profile</button>
        </div>
      </Section>

      <Section icon={Bell} title="Notification Preferences">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'New tender matching your categories', sub: 'Get notified when new tenders are published', checked: true },
            { label: 'Corrigendum & deadline changes', sub: 'Alerts when tender documents are amended', checked: true },
            { label: 'MSME eligibility matches', sub: 'Notify when EMD waivers are applicable', checked: false },
            { label: 'Bid submission reminders', sub: '3 days and 1 day before closing', checked: true },
          ].map((n, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{n.label}</div>
                <div className="text-xs text-muted">{n.sub}</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 0 }}>
                <div style={{
                  width: 40, height: 22, borderRadius: 11, position: 'relative',
                  background: n.checked ? 'var(--navy)' : 'var(--gray-300)',
                  transition: 'background 0.2s'
                }}>
                  <div style={{
                    position: 'absolute', top: 2, left: n.checked ? 20 : 2, width: 18, height: 18,
                    borderRadius: '50%', background: 'white', transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgb(0 0 0 / 0.2)'
                  }} />
                </div>
              </label>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Key} title="API Access & Integrations">
        <div>
          <label>Production API Key</label>
          <div className="flex-row gap-3">
            <div style={{ flex: 1, padding: '9px 14px', background: 'var(--gray-50)', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              sk_prod_●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
            </div>
            <button className="btn btn-outline" style={{ flexShrink: 0 }}>Copy</button>
            <button className="btn btn-outline" style={{ flexShrink: 0, color: 'var(--danger)', borderColor: 'var(--danger-light)' }}>Revoke</button>
          </div>
          <div className="text-xs text-muted mt-1">Keep this key confidential. Do not expose in client-side code.</div>
        </div>
      </Section>
    </div>
  );
}
