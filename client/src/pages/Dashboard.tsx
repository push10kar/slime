import { useAppStore } from '@/store/appStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Server, Database, ArrowRight, Zap, DatabaseBackup } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { useEffect } from 'react'

export default function Dashboard() {
  const { metrics, legacySystemStatus, latencyHistory, startPolling, stopPolling } = useAppStore()

  useEffect(() => {
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-2">Real-time telemetry and pipeline health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{metrics.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">+20.1% from last hour</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cache Hits</CardTitle>
            <DatabaseBackup className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{metrics.cacheHits.toLocaleString()}</div>
            <p className="text-xs text-success mt-1">Saves {Math.round(metrics.cacheHits * 0.45)}s of legacy processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Latency</CardTitle>
            <Zap className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{metrics.avgLatency}ms</div>
            <p className="text-xs text-muted-foreground mt-1">p99: 450ms</p>
          </CardContent>
        </Card>

        <Card className={legacySystemStatus === 'offline' ? 'border-error/50 bg-error/10' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Legacy Health</CardTitle>
            <Server className={`h-4 w-4 ${legacySystemStatus === 'offline' ? 'text-error animate-pulse' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${legacySystemStatus === 'offline' ? 'text-error' : 'text-success'}`}>
              {legacySystemStatus.toUpperCase()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Gateway fallback active</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Gateway Latency (ms)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="latency" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted border border-card-border">
                <Database className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">Legacy Mainframe</span>
                <span className="text-xs text-muted-foreground">CSV / XML / EBCDIC</span>
              </div>
              
              <div className="flex justify-center relative h-8">
                <div className="absolute top-0 bottom-0 w-px bg-slate-700"></div>
                <div className="absolute top-0 bottom-0 w-px bg-primary animate-[flow_2s_linear_infinite]" style={{ strokeDasharray: '4 4' }}></div>
                <ArrowRight className="h-5 w-5 text-primary rotate-90 absolute top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <Zap className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium text-primary">LegacyBridge Gateway</span>
                <span className="text-xs text-primary/70">Transformation & AI Mapping</span>
              </div>

              <div className="flex justify-center relative h-8">
                <div className="absolute top-0 bottom-0 w-px bg-slate-700"></div>
                <div className="absolute top-0 bottom-0 w-px bg-success animate-[flow_2s_linear_infinite]" style={{ strokeDasharray: '4 4' }}></div>
                <ArrowRight className="h-5 w-5 text-success rotate-90 absolute top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted border border-card-border">
                <Activity className="h-8 w-8 text-success" />
                <span className="text-sm font-medium">Modern Consumer</span>
                <span className="text-xs text-muted-foreground">Clean JSON REST API</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
