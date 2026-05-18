import { create } from 'zustand'

export interface Metrics {
  totalRequests: number
  failedRequests: number
  cacheHits: number
  avgLatency: number
}

interface AppState {
  metrics: Metrics
  setMetrics: (metrics: Metrics) => void
  legacySystemStatus: 'online' | 'offline' | 'degraded'
  setLegacySystemStatus: (status: 'online' | 'offline' | 'degraded') => void
  isAiMappingEnabled: boolean
  toggleAiMapping: () => void
}

export const useAppStore = create<AppState>((set) => ({
  metrics: {
    totalRequests: 12450,
    failedRequests: 23,
    cacheHits: 4120,
    avgLatency: 145,
  },
  setMetrics: (metrics) => set({ metrics }),
  legacySystemStatus: 'online',
  setLegacySystemStatus: (status) => set({ legacySystemStatus: status }),
  isAiMappingEnabled: true,
  toggleAiMapping: () => set((state) => ({ isAiMappingEnabled: !state.isAiMappingEnabled })),
}))
