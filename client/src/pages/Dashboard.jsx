import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Zap, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

// Mock data simulating live transformation activity
const generateMetric = () => ({
  time: new Date().toLocaleTimeString(),
  latency: Math.floor(Math.random() * 200 + 40),
  success: Math.floor(Math.random() * 30 + 80),
  retries: Math.floor(Math.random() * 5),
})

const ADAPTERS = ['CSVAdapter', 'XMLAdapter', 'SOAPAdapter', 'FixedWidthAdapter']
const STATUS   = ['healthy', 'healthy', 'healthy', 'degraded']

export default function Dashboard() {
  const [metrics, setMetrics] = useState(() => Array.from({ length: 10 }, generateMetric))

  useEffect(() => {
    const id = setInterval(() => {
      setMetrics(prev => [...prev.slice(-19), generateMetric()])
    }, 2000)
    return () => clearInterval(id)
  }, [])

  const latest = metrics[metrics.length - 1]

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Real-time gateway activity and adapter health</p>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="card stat-card">
          <Zap size={20} color="var(--accent)" />
          <div className="stat-value">{latest.latency}ms</div>
          <div className="stat-label">Avg Latency</div>
          <div className="stat-delta up">▲ Live</div>
        </div>
        <div className="card stat-card">
          <CheckCircle2 size={20} color="var(--success)" />
          <div className="stat-value">{latest.success}%</div>
          <div className="stat-label">Success Rate</div>
          <div className="stat-delta up">↑ Last 5m</div>
        </div>
        <div className="card stat-card">
          <AlertTriangle size={20} color="var(--warning)" />
          <div className="stat-value">{latest.retries}</div>
          <div className="stat-label">Retries</div>
          <div className="stat-delta down">Auto-recovered</div>
        </div>
        <div className="card stat-card">
          <Clock size={20} color="var(--accent-2)" />
          <div className="stat-value">4</div>
          <div className="stat-label">Active Adapters</div>
          <div className="stat-delta up">3 healthy</div>
        </div>
      </div>

      {/* Latency chart */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>
            Response Latency (ms)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="latency" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>
            Success Rate (%)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="success" stroke="var(--success)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Adapter table */}
      <div className="card">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 16 }}>Adapter Status</h3>
        <table>
          <thead>
            <tr>
              <th>Adapter</th>
              <th>Status</th>
              <th>Requests</th>
              <th>Avg Latency</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {ADAPTERS.map((name, i) => (
              <tr key={name}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{name}</td>
                <td>
                  <span className={`badge ${STATUS[i] === 'healthy' ? 'success' : 'warning'}`}>
                    <span className="dot" /> {STATUS[i]}
                  </span>
                </td>
                <td>{Math.floor(Math.random() * 500 + 50)}</td>
                <td>{Math.floor(Math.random() * 150 + 30)}ms</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Just now</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
