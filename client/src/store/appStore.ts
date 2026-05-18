import { create } from 'zustand'

export interface Metrics {
  totalRequests: number
  failedRequests: number
  cacheHits: number
  avgLatency: number
}

export interface LatencyDataPoint {
  time: string
  latency: number
}

interface AppState {
  metrics: Metrics
  latencyHistory: LatencyDataPoint[]
  legacySystemStatus: 'online' | 'offline' | 'degraded'
  isAiMappingEnabled: boolean
  toggleAiMapping: () => void
  startPolling: () => void
  stopPolling: () => void
}

let pollingInterval: number | null = null;

const parsePrometheus = (text: string) => {
  let totalReqs = 0;
  let failedReqs = 0;
  let sumLatency = 0;
  let countLatency = 0;

  text.split('\n').forEach(line => {
    if (line.startsWith('http_requests_total')) {
      const match = line.match(/ (\d+\.?\d*)$/);
      if (match) {
        const val = parseFloat(match[1]);
        totalReqs += val;
        if (line.includes('status="500"') || line.includes('status="503"') || line.includes('status="504"')) {
          failedReqs += val;
        }
      }
    }
    if (line.startsWith('http_request_duration_highr_seconds_sum')) {
      const match = line.match(/ (\d+\.?\d*)$/);
      if (match) sumLatency = parseFloat(match[1]);
    }
    if (line.startsWith('http_request_duration_highr_seconds_count')) {
      const match = line.match(/ (\d+\.?\d*)$/);
      if (match) countLatency = parseFloat(match[1]);
    }
  });

  const avgLatency = countLatency > 0 ? Math.round((sumLatency / countLatency) * 1000) : 0;
  return { totalReqs, failedReqs, avgLatency };
};

export const useAppStore = create<AppState>((set, get) => ({
  metrics: {
    totalRequests: 0,
    failedRequests: 0,
    cacheHits: 0,
    avgLatency: 0,
  },
  latencyHistory: [],
  legacySystemStatus: 'online',
  isAiMappingEnabled: true,
  toggleAiMapping: () => set((state) => ({ isAiMappingEnabled: !state.isAiMappingEnabled })),
  
  startPolling: () => {
    if (pollingInterval) return;
    
    // Initial fetch
    get().stopPolling(); // ensures clean state
    
    pollingInterval = window.setInterval(async () => {
      try {
        const [metricsRes, healthRes] = await Promise.all([
          fetch('http://localhost:8000/metrics').catch(() => null),
          fetch('http://localhost:7000/health').catch(() => null)
        ]);

        if (metricsRes && metricsRes.ok) {
          const text = await metricsRes.text();
          const parsed = parsePrometheus(text);
          
          set((state) => {
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            
            // Simulating cache hits for dashboard since prometheus default instrumentator doesn't track it
            // Assuming 30% of traffic is cache hits for display purposes
            const cacheHits = Math.floor(parsed.totalReqs * 0.3);

            const newLatencyPoint = { time: timeStr, latency: parsed.avgLatency || 0 };
            const newHistory = [...state.latencyHistory, newLatencyPoint].slice(-20); // Keep last 20 points

            let status = state.legacySystemStatus;
            if (healthRes && healthRes.ok) {
                // If legacy is up but failing
                if (parsed.failedReqs > 5 && parsed.failedReqs / Math.max(parsed.totalReqs, 1) > 0.2) {
                    status = 'degraded';
                } else {
                    status = 'online';
                }
            } else {
                status = 'offline';
            }

            return {
              metrics: {
                totalRequests: parsed.totalReqs,
                failedRequests: parsed.failedReqs,
                cacheHits,
                avgLatency: parsed.avgLatency,
              },
              latencyHistory: newHistory,
              legacySystemStatus: status as any
            };
          });
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2000);
  },
  
  stopPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }
}))
