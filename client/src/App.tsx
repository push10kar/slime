import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, Plug, RefreshCw, Activity, Zap, Server } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Adapters from './pages/Adapters'
import Transform from './pages/Transform'
import { Badge } from '@/components/ui/badge'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transform', icon: RefreshCw,       label: 'Transformation Pipeline' },
  { to: '/adapters',  icon: Plug,            label: 'Legacy Adapters'  },
  { to: '/monitor',   icon: Activity,        label: 'Observability' },
]

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-background overflow-hidden data-grid-bg">
        {/* Sidebar */}
        <nav className="w-64 glass-panel flex flex-col z-10 relative">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-6 w-6 text-primary fill-primary" />
              <h1 className="text-xl font-medium tracking-tight text-white">LegacyBridge AI</h1>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase mt-1">Modernization Gateway</p>
          </div>
          
          <div className="flex-1 px-4 space-y-1 overflow-y-auto mt-4">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-muted text-white' 
                      : 'text-muted-foreground hover:text-white hover:bg-muted/50'
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </NavLink>
            ))}
          </div>

          <div className="p-6 border-t border-card-border mt-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-medium">SYSTEM STATUS</span>
              <Badge variant="success" className="h-5 px-1.5 rounded-sm bg-success/10 text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse" />
                HEALTHY
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Server className="h-4 w-4" />
              <span>v1.0.0-rc.2</span>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/transform" element={<Transform />} />
            <Route path="/adapters"  element={<Adapters />}  />
            <Route path="/monitor"   element={
              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">Observability</h2>
                <p className="text-slate-400 mb-6">Metrics and distributed tracing are available via Grafana.</p>
                <a 
                  href="http://localhost:3001" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
                >
                  Open Grafana Dashboard ↗
                </a>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
