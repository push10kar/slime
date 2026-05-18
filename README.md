# ⚡ Slime AI — Enterprise Legacy Modernization Gateway

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?style=flat&logo=FastAPI)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-blue.svg?style=flat&logo=React)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg?style=flat&logo=Docker)](https://www.docker.com)
[![Gemini](https://img.shields.io/badge/AI-Gemini%202.5-orange.svg?style=flat&logo=google-gemini)](https://deepmind.google/technologies/gemini/)

> An AI-powered, high-throughput modernization gateway designed to ingest chaotic legacy flat files, XML, and mainframe feeds, and transform them in real-time into clean, observable, secure, and production-ready REST APIs.

---

## 🏛️ Architecture Overview

```
                          ┌───────────────────────────┐
                          │    LEGACY DATA SOURCES    │
                          │   (CSV / XML / Mainframe) │
                          └─────────────┬─────────────┘
                                        │ (Pull/Push)
                                        ▼
┌────────────────────────────────── SLIME AI ──────────────────────────────────┐
│                                                                              │
│  ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────┐  │
│  │   Legacy Adapters    │──>│  Tenacity Retry L2   │──>│   Redis Cache    │  │
│  │   (Parser Engine)    │   │   (Degraded Shield)  │   │  (Read-Through)  │  │
│  └──────────────────────┘   └──────────────────────┘   └────────┬─────────┘  │
│                                                                 │ (Miss)     │
│                                                                 ▼            │
│  ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────┐  │
│  │  Pydantic Validation │<──│   Gemini Mapping     │<──│  RabbitMQ Queue  │  │
│  │   (Strict Schemas)   │   │   (LLM Normalizer)   │   │  (Rate Limiter)  │  │
│  └──────────┬───────────┘   └──────────────────────┘   └──────────────────┘  │
│             │                                                                │
│             ▼                                                                │
│  ┌──────────────────────┐   ┌──────────────────────┐                         │
│  │  PostgreSQL DB Store │   │  Prometheus Metrics  │                         │
│  │ (Async Audit Logs)   │   │  (/metrics Endpoint) │                         │
│  └──────────────────────┘   └──────────┬───────────┘                         │
└────────────────────────────────────────┼─────────────────────────────────────┘
                                         ▼
                             ┌──────────────────────┐
                             │  Grafana Dashboard   │
                             │ (Telemetry Insights) │
                             └──────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Component | Description |
|---|---|---|
| **API Gateway** | **FastAPI** (Python 3.11+) | Asynchronous, high-performance router running on **Uvicorn** |
| **Validation** | **Pydantic v2** | Enforces strict compile-time types & runtime structural validation |
| **Data Storage** | **PostgreSQL 16** | Robust relational persistence utilizing **SQLAlchemy** asynchronous sessions |
| **Caching Layer** | **Redis 7** | Extremely fast read-through caching for high-speed mitigation |
| **Message Queue** | **RabbitMQ 3.13** | Regulates rate limits and background pipeline execution workloads |
| **AI Mapper** | **Gemini 2.5 Flash** | Deepmind-powered LLM engine for smart schema & field normalization |
| **Observability** | **Prometheus + Grafana** | Complete metrics scraping suite for live dashboard monitoring |
| **Dashboard UI** | **React 18 + Vite 5** | High-fidelity dark-mode interface designed with **glassmorphism** styling |

---

## 📦 Project Structure

```
slime/
├── server/
│   ├── api_gateway/        # FastAPI Application
│   │   ├── app/
│   │   │   ├── core/       # Database, Redis, and configuration systems
│   │   │   ├── routes/     # Health, Auth, Adapters, Transform, and Observability endpoints
│   │   │   └── models.py   # SQLAlchemy model schemas (data_sources, transformed_records)
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── legacy_simulator/   # Messy core simulator displaying degraded/failing legacy behavior
│       ├── main.py
│       ├── requirements.txt
│       └── Dockerfile
├── client/                 # Premium React + Vite dashboard UI
│   ├── src/
│   │   ├── components/     # UI components (cards, button, badges)
│   │   ├── pages/          # Dashboard, Adapters, Transform Pipeline pages
│   │   ├── store/          # Zustand global store (`appStore.ts` with polling)
│   │   ├── App.tsx         # Main layout & side navigation panel
│   │   └── index.css       # Custom scrollbars, glassmorphism theme configurations
│   ├── package.json
│   └── vite.config.ts
├── demo_data/              # Rich test datasets (messy CSV, XML, Fixed-Width) for presentation
│   ├── demo_customers_legacy.csv
│   ├── demo_transactions_legacy.xml
│   ├── demo_mainframe_fixed_width.txt
│   └── README.md           # Instructions on demonstrating each file
├── docker/
│   ├── prometheus/         # prometheus.yml scrape configs
│   ├── grafana/            # Predefined Grafana data-sources and auto-provisioning
│   └── postgres/           # init.sql pre-provisioning schemas
├── docker-compose.yml
├── .env.example
└── pyproject.toml
```

---

## 🚀 Quick Start (Demo Ready)

### Option A — Full Containers (Recommended for Demo)
Runs the entire system (FastAPI backend, React frontend, PostgreSQL, Redis, RabbitMQ, Prometheus, and Grafana) inside isolated Docker containers with a single command.

```bash
# 1. Enter Workspace Root
cd /home/pushkar/Documents/Projects/MasterProjects/slime

# 2. Configure Environment variables
cp .env.example .env
# (Optional) Insert your Gemini API Key to enable AI schema mapping:
# GEMINI_API_KEY=AIzaSy...

# 3. Spin up all containers
docker compose up --build
```

### Option B — Hybrid Local Dev (Best for live modifications)
Runs the infrastructure inside containers, but lets you run the frontend with hot-reload and the FastAPI backend locally.

#### 1. In Terminal 1: Spin up standard infrastructure
```bash
docker compose up postgres redis rabbitmq prometheus grafana legacy_simulator api_gateway
```

#### 2. In Terminal 2: Spin up React Frontend locally
```bash
cd client
npm install
npm run dev
```
> Dashboard will launch at: **http://localhost:5173**

---

## 🔗 Port & Service Directory

| Service | Access URL | Credentials |
|---|---|---|
| **Vite Dashboard** | http://localhost:5173 | — |
| **Docker Dashboard** | http://localhost:3000 | — |
| **API Gateway Swagger** | http://localhost:8000/docs | `admin` / `admin` |
| **Legacy Simulator** | http://localhost:7000/legacy/csv/customers | — |
| **Grafana Metrics Dashboard** | http://localhost:3001 | `admin` / `admin` |
| **Prometheus Interface** | http://localhost:9090 | — |
| **RabbitMQ Management** | http://localhost:15672 | `slime` / `slime_secret` |

---

## 📊 Telemetry & Observability
Slime AI is fully instrumented for live health auditing. The FastAPI gateway exposes a `/metrics` route scraped by Prometheus every 5s.

### Metric Indicators Captured:
* `http_requests_total`: API request counts segmented by route, status, and method.
* `http_request_duration_seconds`: Live latency graphs.
* `legacy_system_failures_total`: Counts occurrences of simulator faults before retry policies intercept them.
* `cache_hits_total`: Monitors Redis cache hit-to-miss ratios.
* `transformation_success_total` & `transformation_failures_total`: Validates model conversions.

---

## 🔐 Authentication
The API utilizes secure JSON Web Tokens (JWT). You can generate a token via the terminal:

```bash
curl -X POST http://localhost:8000/auth/token \
  -d "username=admin&password=admin"
```
Pass the returned key as `Authorization: Bearer <token>` in your request headers.

---

## ⚡ Interactive Demo Flow
To wow your audience during the presentation:
1. **Show Legacies (Adapters Tab)**: Add a new XML Ingestion source using `demo_data/demo_transactions_legacy.xml` and choose **AI Handles It**.
2. **Transform Live (Pipeline Tab)**: Upload `demo_data/demo_customers_legacy.csv`. Turn **AI Schema Mapping ON** and watch raw space-padded, cryptic headers auto-convert into normalized camelCased JSON in real-time.
3. **Observability (Observability Tab)**: Load the Grafana tab to show off active rate spikes, cached latency drops, and resilience retry thresholds!
