# ⚡ LegacyBridge AI — Enterprise Legacy Modernization Gateway

> **AI-powered gateway that converts unstable legacy systems into resilient, observable, production-ready REST APIs.**

---

## Tech Stack

| Layer | Technology |
|---|---|
| API Gateway | FastAPI (Python 3.11+) + Uvicorn |
| Validation | Pydantic v2 |
| Database | PostgreSQL 16 + SQLAlchemy (async) |
| Cache | Redis 7 |
| Message Queue | RabbitMQ 3.13 |
| AI Mapping | OpenAI API (gpt-4o-mini) |
| Observability | Prometheus + Grafana |
| Auth | JWT (python-jose + passlib) |
| Frontend | React 18 + Vite 5 + Recharts |
| Containerization | Docker + Docker Compose |
| Testing | Pytest + pytest-asyncio |

---

## Project Structure

```
slime/
├── server/
│   ├── api_gateway/        # FastAPI application
│   │   ├── app/
│   │   │   ├── core/       # config, database, redis
│   │   │   ├── routes/     # health, auth, adapters, transform, metrics
│   │   │   └── middleware/
│   │   │       ├── adapters/      # CSV, XML, SOAP, FixedWidth
│   │   │       ├── transformers/  # Field normalizer
│   │   │       ├── ai_mapper/     # OpenAI field mapper
│   │   │       ├── retry_engine/  # Tenacity retry logic
│   │   │       └── cache/         # Redis read-through cache
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── legacy_simulator/   # Intentionally ugly/broken legacy service
│       ├── main.py
│       ├── requirements.txt
│       └── Dockerfile
├── client/                 # React + Vite dashboard
│   ├── src/
│   │   ├── pages/          # Dashboard, Adapters, Transform
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── docker/
│   ├── prometheus/prometheus.yml
│   ├── grafana/provisioning/datasources/
│   └── postgres/init.sql
├── tests/
│   ├── test_normalizer.py
│   └── test_api.py
├── docker-compose.yml
├── .env.example
└── pyproject.toml
```

---

## 🚀 Quick Start

### Option A — Full Stack (Docker)

```bash
# 1. Copy environment config
cp .env.example .env

# 2. (Optional) Add your OpenAI key to .env for AI field mapping
# OPENAI_API_KEY=sk-...

# 3. Start everything
docker compose up --build
```

| Service | URL |
|---|---|
| **API Gateway** (Swagger) | http://localhost:8000/docs |
| **Dashboard** (React) | http://localhost:3000 |
| **Legacy Simulator** | http://localhost:7000/docs |
| **RabbitMQ** Management | http://localhost:15672 |
| **Prometheus** | http://localhost:9090 |
| **Grafana** | http://localhost:3001 (admin/admin) |

---

### Option B — Run Services Locally (Dev)

#### 1. Start infrastructure (Postgres + Redis + RabbitMQ)
```bash
docker compose up postgres redis rabbitmq -d
```

#### 2. Legacy Simulator
```bash
cd server/legacy_simulator
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 7000 --reload
```
> Runs at **http://localhost:7000** — set `FAILURE_RATE=0.0` to disable random failures.

#### 3. API Gateway
```bash
cd server/api_gateway
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```
> Swagger UI at **http://localhost:8000/docs**

#### 4. React Dashboard
```bash
cd client
npm install
npm run dev
```
> Dashboard at **http://localhost:5173**

---

## 🧪 Running Tests

```bash
# From project root
pip install pytest pytest-asyncio httpx
pytest tests/ -v
```

---

## 🔐 Authentication

The API uses JWT. Get a token first:

```bash
curl -X POST http://localhost:8000/auth/token \
  -d "username=admin&password=admin"
```

Use the returned `access_token` as `Authorization: Bearer <token>` on all protected endpoints.

---

## Demo Flow

1. Open **http://localhost:7000/legacy/csv/customers** — ugly CSV with inconsistent headers
2. Call `GET /adapters/csv/fetch` → clean JSON out
3. Post raw data to `POST /transform/normalize?use_ai=true` → AI-renamed fields
4. Kill the legacy simulator → cached responses still served
5. Open Grafana → watch latency/retry metrics
6. Open Swagger → judges love interactive docs

---

## Environment Variables

See `.env.example` for all configurable values.
