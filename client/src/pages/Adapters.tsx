import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database, FileText, Code2, Network } from 'lucide-react'

const ADAPTERS = [
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
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Legacy Adapters</h1>
        <p className="text-slate-400 mt-2">Active protocol translators mapping legacy formats to standard JSON.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ADAPTERS.map(adapter => {
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
                <Badge variant="success">Active</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm mt-4 pt-4 border-t border-slate-800/50">
                  <div className="text-slate-400">
                    Capabilities:
                    <div className="flex flex-wrap gap-2 mt-2">
                      {adapter.features.map(f => (
                        <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xs text-slate-500">Avg Parsing Latency</div>
                    <div className="text-lg font-mono text-slate-200">{adapter.latency}</div>
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
