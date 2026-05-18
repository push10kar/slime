import { useState } from 'react'
import { Plug, ChevronRight } from 'lucide-react'

const ADAPTERS = [
  { id: 'csv',         label: 'CSV Adapter',         desc: 'Parse comma-separated dump files from legacy ERP exports.', icon: '📄' },
  { id: 'xml',         label: 'XML Adapter',          desc: 'Transform XML/SOAP-like structured data into clean JSON.',   icon: '🗂️' },
  { id: 'soap',        label: 'SOAP Adapter',         desc: 'Wrap and unwrap SOAP envelopes for legacy web services.',    icon: '📡' },
  { id: 'fixed_width', label: 'Fixed-Width Adapter',  desc: 'Read mainframe fixed-width text files with column specs.',   icon: '🖥️' },
]

export default function Adapters() {
  const [selected, setSelected] = useState(null)
  const [result,   setResult]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const run = async (adapter) => {
    setSelected(adapter.id)
    setResult(null)
    setError(null)
    setLoading(true)
    try {
      // In real use, swap /api/adapters with authenticated call
      const res = await fetch(`/api/adapters/${adapter.id}/fetch`, {
        headers: { Authorization: 'Bearer demo' },
      })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Adapter Management</h2>
        <p>Universal Legacy Connector Architecture – choose an adapter to fetch and normalize data</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 28 }}>
        {ADAPTERS.map(a => (
          <div
            key={a.id}
            className="card"
            style={{ cursor: 'pointer', borderColor: selected === a.id ? 'var(--accent)' : undefined }}
            onClick={() => run(a)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{a.icon}</div>
                <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>{a.label}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{a.desc}</p>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
          ⏳ Fetching from legacy system...
        </div>
      )}

      {error && (
        <div className="card" style={{ borderColor: 'var(--danger)' }}>
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>Error: {error}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 6 }}>
            Ensure the legacy simulator and API gateway are running.
          </p>
        </div>
      )}

      {result && (
        <div className="card fade-in">
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>
            Normalized Output <span className="badge info" style={{ marginLeft: 8 }}>{result.count} records</span>
          </h3>
          <pre style={{
            background: 'var(--bg-primary)',
            padding: 16,
            borderRadius: 8,
            fontSize: '0.78rem',
            color: 'var(--accent-2)',
            overflowX: 'auto',
            maxHeight: 400,
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
