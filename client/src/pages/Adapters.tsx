import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Database, FileText, Code2, Network, Plus, CheckCircle2, Play, AlertCircle } from 'lucide-react'

const INITIAL_ADAPTERS = [
  {
    id: 'csv',
    name: 'Flat File (CSV)',
    description: 'Ingests messy comma-separated values from legacy FTP drops.',
    status: 'active',
    icon: FileText,
    latency: '12ms',
    features: ['Auto-header detection', 'Type coercion', 'Quote parsing']
  },
  {
    id: 'xml',
    name: 'Hierarchical (XML)',
    description: 'Parses deeply nested legacy XML structures into flat JSON.',
    status: 'active',
    icon: Code2,
    latency: '45ms',
    features: ['XPath mapping', 'Namespace stripping', 'List flattening']
  },
  {
    id: 'soap',
    name: 'SOAP / WSDL',
    description: 'Wraps ancient SOAP services with a modern REST interface.',
    status: 'active',
    icon: Network,
    latency: '180ms',
    features: ['Envelope unwrapping', 'Fault handling', 'WSDL schema validation']
  },
  {
    id: 'fixed',
    name: 'Fixed-Width (Mainframe)',
    description: 'Parses positional byte streams from AS400 / zOS systems.',
    status: 'active',
    icon: Database,
    latency: '8ms',
    features: ['EBCDIC decoding', 'Copybook layouts', 'Padding removal']
  }
]

export default function Adapters() {
  const [adapters, setAdapters] = useState(INITIAL_ADAPTERS)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    type: 'csv',
    endpoint: '',
    mappingMode: 'ai',
    manualMapping: ''
  })
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  const handleTestConnection = () => {
    setTestStatus('testing')
    setTimeout(() => {
      if (formData.endpoint) {
        setTestStatus('success')
      } else {
        setTestStatus('error')
      }
    }, 1500)
  }

  const handleActivateSource = () => {
    if (testStatus !== 'success') return;
    
    const newAdapter = {
      id: `new-${Date.now()}`,
      name: `Custom ${formData.type.toUpperCase()} Source`,
      description: `Ingests data from ${formData.endpoint || 'custom endpoint'}.`,
      status: 'active',
      icon: formData.type === 'csv' ? FileText : formData.type === 'xml' ? Code2 : formData.type === 'soap' ? Network : Database,
      latency: 'Calculating...',
      features: formData.mappingMode === 'ai' ? ['AI Auto-Mapping', 'Dynamic Schema'] : ['Static Mapping Rules']
    };
    
    setAdapters([...adapters, newAdapter])
    setShowAddForm(false)
    setFormData({ type: 'csv', endpoint: '', mappingMode: 'ai', manualMapping: '' })
    setTestStatus('idle')
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Legacy Adapters</h1>
          <p className="text-muted-foreground mt-2">Manage active protocol translators mapping legacy formats to standard JSON.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          {showAddForm ? 'Cancel' : <><Plus className="h-4 w-4" /> Add Source</>}
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle>Configure New Legacy Source</CardTitle>
            <CardDescription>Establish a connection to a new legacy system and map its outputs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Source Type</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="csv">Flat File (CSV)</option>
                  <option value="xml">Hierarchical (XML)</option>
                  <option value="soap">SOAP Service</option>
                  <option value="fixed">Fixed-Width (Mainframe)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Connection Endpoint / URL</label>
                <input 
                  type="text" 
                  placeholder="http://legacy-system:7000/api/..." 
                  className="flex h-10 w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  value={formData.endpoint}
                  onChange={e => {
                    setFormData({...formData, endpoint: e.target.value})
                    setTestStatus('idle')
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-white">Mapping Mode</label>
              <div className="flex gap-4">
                <label className={`flex flex-1 items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${formData.mappingMode === 'ai' ? 'border-primary bg-primary/10' : 'border-card-border bg-card'}`}>
                  <input type="radio" name="mappingMode" value="ai" checked={formData.mappingMode === 'ai'} onChange={() => setFormData({...formData, mappingMode: 'ai'})} className="mt-1" />
                  <div>
                    <div className="font-medium text-white">AI Handles It (Recommended)</div>
                    <div className="text-sm text-muted-foreground mt-1">Automatically infers schema and semantic mappings in real-time.</div>
                  </div>
                </label>
                <label className={`flex flex-1 items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${formData.mappingMode === 'manual' ? 'border-primary bg-primary/10' : 'border-card-border bg-card'}`}>
                  <input type="radio" name="mappingMode" value="manual" checked={formData.mappingMode === 'manual'} onChange={() => setFormData({...formData, mappingMode: 'manual'})} className="mt-1" />
                  <div>
                    <div className="font-medium text-white">Manual Mapping</div>
                    <div className="text-sm text-muted-foreground mt-1">Define strict field-to-field transformation rules.</div>
                  </div>
                </label>
              </div>
            </div>

            {formData.mappingMode === 'manual' && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <label className="text-sm font-medium text-white">Transformation Rules (JSON)</label>
                <textarea 
                  placeholder='{"CUST_NM": "customerName", "BAL": "balance"}'
                  className="flex min-h-[100px] w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 font-mono"
                  value={formData.manualMapping}
                  onChange={e => setFormData({...formData, manualMapping: e.target.value})}
                />
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t border-card-border">
              <Button variant="outline" onClick={handleTestConnection} disabled={testStatus === 'testing'}>
                {testStatus === 'testing' ? <><span className="animate-spin mr-2">⟳</span> Testing...</> : 'Test Connection'}
              </Button>
              
              {testStatus === 'success' && <div className="flex items-center text-success text-sm"><CheckCircle2 className="h-4 w-4 mr-1" /> Connection OK</div>}
              {testStatus === 'error' && <div className="flex items-center text-error text-sm"><AlertCircle className="h-4 w-4 mr-1" /> Connection Failed</div>}

              <div className="flex-1"></div>
              
              <Button onClick={handleActivateSource} disabled={testStatus !== 'success'} className="gap-2">
                <Play className="h-4 w-4" /> Activate Source
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adapters.map(adapter => {
          const Icon = adapter.icon
          return (
            <Card key={adapter.id} className="hover:border-primary/50 transition-colors cursor-default">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {adapter.name}
                  </CardTitle>
                  <CardDescription className="pt-1">{adapter.description}</CardDescription>
                </div>
                <Badge variant="success" className="bg-success/10 text-success border-success/20">Active</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm mt-4 pt-4 border-t border-card-border">
                  <div className="text-muted-foreground">
                    Capabilities:
                    <div className="flex flex-wrap gap-2 mt-2">
                      {adapter.features.map(f => (
                        <Badge key={f} variant="outline" className="text-[10px] bg-muted/50 text-white">{f}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xs text-muted-foreground">Avg Parsing Latency</div>
                    <div className="text-lg font-mono text-white">{adapter.latency}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
