import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Tenders from './pages/Tenders';
import Copilot from './pages/Copilot';
import Intelligence from './pages/Intelligence';
import Governance from './pages/Governance';
import Settings from './pages/Settings';
import { Bell, Search, ChevronRight } from 'lucide-react';

const TITLES = {
  '/':             'Dashboard',
  '/tenders':      'Tender Catalog',
  '/copilot':      'AI Copilot',
  '/intelligence': 'Market Intelligence',
  '/governance':   'AI Governance',
  '/settings':     'Settings',
};

function Header() {
  const loc = useLocation();
  const title = TITLES[loc.pathname] || 'TenderOS';
  return (
    <header className="top-header">
      <div className="header-breadcrumb">
        <span style={{ color: 'var(--text-muted)' }}>TenderOS</span>
        <ChevronRight size={13} />
        <span>{title}</span>
      </div>
      <div className="search-bar">
        <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input type="text" placeholder="Search tenders, organizations, departments..." />
      </div>
      <div className="header-actions">
        <button className="icon-btn" title="Notifications">
          <Bell size={16} />
        </button>
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=GovAdmin"
          alt="Profile"
          className="sidebar-avatar"
          style={{ width: 34, height: 34, border: '2px solid var(--border)', cursor: 'pointer' }}
        />
      </div>
    </header>
  );
}

function AppLayout({ children }) {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="content-scrollable">{children}</div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/tenders"      element={<AppLayout><Tenders /></AppLayout>} />
        <Route path="/copilot"      element={<AppLayout><Copilot /></AppLayout>} />
        <Route path="/intelligence" element={<AppLayout><Intelligence /></AppLayout>} />
        <Route path="/governance"   element={<AppLayout><Governance /></AppLayout>} />
        <Route path="/settings"     element={<AppLayout><Settings /></AppLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
