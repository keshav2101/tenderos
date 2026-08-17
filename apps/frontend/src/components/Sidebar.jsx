import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Bot, LineChart, ShieldCheck, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard',          path: '/',            icon: LayoutDashboard },
  { name: 'Tender Catalog',     path: '/tenders',     icon: FileText },
  { name: 'AI Copilot',         path: '/copilot',     icon: Bot },
  { name: 'Market Intelligence',path: '/intelligence',icon: LineChart },
  { name: 'Governance',         path: '/governance',  icon: ShieldCheck },
  { name: 'Settings',           path: '/settings',    icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-row">
          <div className="sidebar-emblem">🏛</div>
          <h1>TenderOS</h1>
        </div>
        <div className="sidebar-tagline">Government e-Procurement Platform</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Navigation</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon className="nav-item-icon" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <img
            className="sidebar-avatar"
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=GovAdmin"
            alt="Admin"
          />
          <div>
            <div className="sidebar-user-name">Administrator</div>
            <div className="sidebar-user-role">Govt. of India · Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
