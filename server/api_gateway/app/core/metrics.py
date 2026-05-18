from prometheus_client import Counter, Histogram

# ─── Legacy System Failures ──────────────────────────────────────────────────
LEGACY_FAILURES = Counter(
    "legacy_system_failures_total",
    "Total count of downstream legacy system failures before falling back",
    ["adapter_type", "endpoint", "error_type"]
)

# ─── Cache Hits / Misses ─────────────────────────────────────────────────────
CACHE_REQUESTS = Counter(
    "gateway_cache_requests_total",
    "Total number of cache requests to the gateway",
    ["adapter_type", "endpoint", "status"]  # status can be: "hit", "miss", "stale"
)

# ─── Transformation Success / Failure ─────────────────────────────────────────
TRANSFORMATION_REQUESTS = Counter(
    "transformation_requests_total",
    "Total number of data transformations handled by adapters",
    ["adapter_type", "status"]  # status can be: "success", "failure"
)

# ─── Custom Transformation Latency ──────────────────────────────────────────
TRANSFORMATION_LATENCY = Histogram(
    "transformation_latency_seconds",
    "Duration of transformation operations in seconds",
    ["adapter_type"]
)
