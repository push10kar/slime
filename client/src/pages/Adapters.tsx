import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Database, FileText, Code2, Network, Plus, CheckCircle2, Play, AlertCircle, Upload, FileUp } from 'lucide-react'

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
    connectionType: 'api', // 'api' | 'file'
    endpoint: '',
    mappingMode: 'ai',
    manualMapping: ''
  })
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        setFileContent(text.slice(0, 1000)) // Preview first 1000 characters
      }
      reader.readAsText(file)
      setTestStatus('success')
    }
  }

  const handleTestConnection = () => {
    setTestStatus('testing')
    setTimeout(() => {
      if (formData.connectionType === 'file' && uploadedFile) {
        setTestStatus('success')
      } else if (formData.connectionType === 'api' && formData.endpoint) {
        setTestStatus('success')
      } else {
        setTestStatus('error')
      }
    }, 1500)
  }

  const handleActivateSource = () => {
    if (testStatus !== 'success') return;
    
    const sourceName = formData.connectionType === 'file' && uploadedFile
      ? uploadedFile.name
      : formData.endpoint || 'custom endpoint';

    const newAdapter = {
      id: `new-${Date.now()}`,
      name: `Custom ${formData.type.toUpperCase()} Source`,
      description: formData.connectionType === 'file'
        ? `Ingested local file: ${sourceName}`
        : `Ingests data from API: ${sourceName}`,
      status: 'active',
      icon: formData.type === 'csv' ? FileText : formData.type === 'xml' ? Code2 : formData.type === 'soap' ? Network : Database,
      latency: 'Calculating...',
      features: [
        formData.mappingMode === 'ai' ? 'AI Auto-Mapping' : 'Static Mapping Rules',
        formData.connectionType === 'file' ? 'Local System Ingest' : 'Remote Fetch Pipeline'
      ]
    };
    
    setAdapters([...adapters, newAdapter])
    setShowAddForm(false)
    setFormData({ type: 'csv', connectionType: 'api', endpoint: '', mappingMode: 'ai', manualMapping: '' })
    setUploadedFile(null)
    setFileContent('')
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
            <CardDescription>Establish a connection to a new legacy system or upload a file containing legacy formats.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Source Type</label>
                <div className="relative">
                  <select 
                    className="flex h-10 w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm text-white focus:outline-none focus:border-white focus:ring-0 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="csv">Flat File (CSV)</option>
                    <option value="xml">Hierarchical (XML)</option>
                    <option value="soap">SOAP Service</option>
                    <option value="fixed">Fixed-Width (Mainframe)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Ingestion Method</label>
                <div className="flex h-10 w-full rounded-md bg-muted p-1 border border-card-border">
                  <button 
                    type="button"
                    onClick={() => {
                      setFormData({...formData, connectionType: 'api'})
                      setTestStatus('idle')
                    }}
                    className={`flex-1 rounded-sm text-xs font-semibold transition-all duration-200 ${formData.connectionType === 'api' ? 'bg-zinc-800 text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
                  >
                    API Endpoint
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setFormData({...formData, connectionType: 'file'})
                      setTestStatus('idle')
                    }}
                    className={`flex-1 rounded-sm text-xs font-semibold transition-all duration-200 ${formData.connectionType === 'file' ? 'bg-zinc-800 text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
                  >
                    File Ingest
                  </button>
                </div>
              </div>
            </div>

            {formData.connectionType === 'api' ? (
              <div className="space-y-2 animate-in fade-in duration-300">
                <label className="text-sm font-medium text-white">Connection Endpoint / URL</label>
                <input 
                  type="text" 
                  placeholder="http://legacy-system:7000/api/..." 
                  className="flex h-10 w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-white focus:ring-0 transition-all duration-200"
                  value={formData.endpoint}
                  onChange={e => {
                    setFormData({...formData, endpoint: e.target.value})
                    setTestStatus('idle')
                  }}
                />
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in duration-300">
                <label className="text-sm font-medium text-white">Upload Legacy File</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".csv,.xml,.txt,.soap,.dat"
                  onChange={handleFileChange}
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center border border-dashed border-card-border rounded-lg p-6 bg-card hover:border-white/50 cursor-pointer transition-all duration-200"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-white font-medium">
                    {uploadedFile ? uploadedFile.name : 'Click to upload legacy file'}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Supports .csv, .xml, .txt, .soap, .dat up to 10MB
                  </span>
                </div>

                {fileContent && (
                  <div className="mt-4 p-4 rounded-lg bg-muted border border-card-border animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Raw File Payload Preview</span>
                      <FileUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <pre className="text-xs font-mono text-white whitespace-pre-wrap max-h-32 overflow-y-auto bg-black/30 p-2 rounded">
                      {fileContent}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <label className="text-sm font-medium text-white">Mapping Mode</label>
              <div className="flex gap-4">
                <label className={`flex flex-1 items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all duration-200 ${formData.mappingMode === 'ai' ? 'border-primary bg-primary/5 shadow-sm shadow-primary/5' : 'border-card-border bg-card hover:border-white/20'}`}>
                  <input type="radio" name="mappingMode" value="ai" checked={formData.mappingMode === 'ai'} onChange={() => setFormData({...formData, mappingMode: 'ai'})} className="mt-1 accent-primary" />
                  <div>
                    <div className="font-medium text-white">AI Handles It (Recommended)</div>
                    <div className="text-sm text-muted-foreground mt-1">Automatically infers schema and semantic mappings in real-time.</div>
                  </div>
                </label>
                <label className={`flex flex-1 items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all duration-200 ${formData.mappingMode === 'manual' ? 'border-primary bg-primary/5 shadow-sm shadow-primary/5' : 'border-card-border bg-card hover:border-white/20'}`}>
                  <input type="radio" name="mappingMode" value="manual" checked={formData.mappingMode === 'manual'} onChange={() => setFormData({...formData, mappingMode: 'manual'})} className="mt-1 accent-primary" />
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
                {testStatus === 'testing' ? <><span className="animate-spin mr-2">⟳</span> Testing...</> : formData.connectionType === 'file' ? 'Validate Payload' : 'Test Connection'}
              </Button>
              
              {testStatus === 'success' && <div className="flex items-center text-success text-sm"><CheckCircle2 className="h-4 w-4 mr-1" /> Ready to ingest</div>}
              {testStatus === 'error' && <div className="flex items-center text-error text-sm"><AlertCircle className="h-4 w-4 mr-1" /> Validation Failed</div>}

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
