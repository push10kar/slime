import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, Plug, RefreshCw, Activity, ShieldCheck } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Adapters from './pages/Adapters'
import Transform from './pages/Transform'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/adapters',  icon: Plug,            label: 'Adapters'  },
  { to: '/transform', icon: RefreshCw,       label: 'Transform' },
  { to: '/monitor',   icon: Activity,        label: 'Monitoring' },
]

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        {/* Sidebar */}
        <nav className="sidebar">
          <div className="sidebar-logo">
            <h1>⚡ LegacyBridge AI</h1>
            <p>Enterprise Modernization Gateway</p>
          </div>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}

          <div style={{ marginTop: 'auto', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <div className="live-dot" />
              System Online
            </div>
          </div>
        </nav>

        {/* Main */}
        <main className="main-content fade-in">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/adapters"  element={<Adapters />}  />
            <Route path="/transform" element={<Transform />} />
            <Route path="/monitor"   element={<div style={{color:'var(--text-secondary)'}}>Monitoring → <a href="http://localhost:3001" target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>Open Grafana ↗</a></div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
