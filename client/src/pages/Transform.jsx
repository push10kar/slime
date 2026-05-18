import { useState } from 'react'

const DEFAULT_INPUT = JSON.stringify(
  { CUST_NM: 'JOHN SMITH', ACT_FLG: 'Y', BAL: '12500.50', DOB: '15/03/85' },
  null, 2
)

export default function Transform() {
  const [raw,    setRaw]    = useState(DEFAULT_INPUT)
  const [useAI,  setUseAI]  = useState(false)
  const [result, setResult] = useState(null)
  const [loading,setLoading]= useState(false)
  const [error,  setError]  = useState(null)

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const parsed = JSON.parse(raw)
      const res = await fetch('/api/transform/normalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo',
        },
        body: JSON.stringify({ raw_data: parsed, use_ai: useAI }),
      })
      setResult(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Field Transformer</h2>
        <p>Paste raw legacy data to normalize field names and coerce values</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: '0.95rem' }}>Raw Legacy Input</h3>
          <textarea
            value={raw}
            onChange={e => setRaw(e.target.value)}
            rows={12}
            style={{
              width: '100%',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              padding: 12,
              color: 'var(--accent-2)',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              resize: 'vertical',
            }}
          />
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useAI}
                onChange={e => setUseAI(e.target.checked)}
                style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
              />
              Enable AI field mapping
            </label>
            <button className="btn btn-primary" onClick={run} disabled={loading}>
              {loading ? '⏳ Processing…' : '⚡ Transform'}
            </button>
          </div>
          {error && <p style={{ color: 'var(--danger)', marginTop: 12, fontSize: '0.82rem' }}>Error: {error}</p>}
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: '0.95rem' }}>
            Normalized Output
            {result && <span className="badge success" style={{ marginLeft: 10 }}>Success</span>}
          </h3>
          {result ? (
            <pre className="fade-in" style={{
              background: 'var(--bg-primary)',
              padding: 14,
              borderRadius: 8,
              fontSize: '0.78rem',
              color: 'var(--accent-2)',
              overflowX: 'auto',
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', paddingTop: 8 }}>
              Output will appear here after transformation.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
