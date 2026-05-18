import { useAppStore } from '@/store/appStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Server, Database, ArrowRight, Zap, DatabaseBackup } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useEffect } from 'react'

export default function Dashboard() {
  const { metrics, legacySystemStatus, latencyHistory, startPolling, stopPolling } = useAppStore()

  useEffect(() => {
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 relative z-10">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gradient">System Overview</h1>
        <p className="text-muted-foreground mt-2">Real-time telemetry and pipeline health logs.</p>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Requests</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-white tracking-tight">{metrics.totalRequests.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active stream processing</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cache Hits</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <DatabaseBackup className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-white tracking-tight">{metrics.cacheHits.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <span>Saved ~{(metrics.cacheHits * 0.45).toFixed(1)}s legacy load</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Latency</CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-white tracking-tight">{metrics.avgLatency}ms</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <span>p99: ~{(metrics.avgLatency * 1.8).toFixed(0)}ms latency</span>
            </div>
          </CardContent>
        </Card>

        <Card className={`glass-card ${legacySystemStatus === 'offline' ? 'border-error/50 bg-error/5' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legacy Status</CardTitle>
            <div className={`p-2 rounded-lg ${legacySystemStatus === 'offline' ? 'bg-error/10' : 'bg-emerald-500/10'}`}>
              <Server className={`h-4 w-4 ${legacySystemStatus === 'offline' ? 'text-error animate-pulse' : 'text-emerald-400'}`} />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className={`text-3xl font-bold tracking-tight ${legacySystemStatus === 'offline' ? 'text-error' : 'text-emerald-400'}`}>
              {legacySystemStatus.toUpperCase()}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <span>Gateway fallback enabled</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-white">Gateway Latency Telemetry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencyHistory}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit="ms" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 15, 25, 0.9)', 
                      borderColor: 'rgba(139, 92, 246, 0.3)', 
                      borderRadius: '12px',
                      color: '#f8fafc',
                      backdropFilter: 'blur(8px)'
                    }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                    itemStyle={{ color: '#a78bfa', fontSize: '13px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="latency" 
                    stroke="#8b5cf6" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorLatency)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Architecture visual flow */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-white">Modernization Gateway</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl bg-slate-950/40 border border-white/5">
                <Database className="h-7 w-7 text-slate-400" />
                <span className="text-xs font-semibold tracking-wide text-slate-300">LEGACY SOURCE</span>
                <span className="text-[10px] text-muted-foreground font-mono">CSV / XML / EBCDIC</span>
              </div>
              
              <div className="flex justify-center relative h-6">
                <div className="absolute top-0 bottom-0 w-[1.5px] bg-slate-800"></div>
                <div className="absolute top-0 bottom-0 w-[1.5px] bg-primary animate-[flow_2s_linear_infinite]" style={{ strokeDasharray: '4 4' }}></div>
                <ArrowRight className="h-4 w-4 text-primary rotate-90 absolute top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                <Zap className="h-7 w-7 text-primary animate-pulse" />
                <span className="text-xs font-semibold tracking-wide text-primary">SLIME GATEWAY</span>
                <span className="text-[10px] text-primary/70">AI Auto-Mapping Engine</span>
              </div>

              <div className="flex justify-center relative h-6">
                <div className="absolute top-0 bottom-0 w-[1.5px] bg-slate-800"></div>
                <div className="absolute top-0 bottom-0 w-[1.5px] bg-emerald-500 animate-[flow_2s_linear_infinite]" style={{ strokeDasharray: '4 4' }}></div>
                <ArrowRight className="h-4 w-4 text-emerald-400 rotate-90 absolute top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl bg-slate-950/40 border border-white/5">
                <Server className="h-7 w-7 text-emerald-400" />
                <span className="text-xs font-semibold tracking-wide text-emerald-300">MODERN CONSUMER</span>
                <span className="text-[10px] text-muted-foreground font-mono">Restful API Endpoint</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
