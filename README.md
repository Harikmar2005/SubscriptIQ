# SubscriptIQ Enterprise | SaaS Subscription Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688.svg)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Celery](https://img.shields.io/badge/Celery-5.3-green.svg)](https://docs.celeryq.dev/)

An enterprise-grade, full-stack **Subscription Management & Recurring Billing Platform** with AI customer retention intelligence, finite state machine (FSM) lifecycle automation, Razorpay payment gateway integration, GST-compliant tax invoicing (HSN 998313), cryptographic SHA-256 financial evidence ledgers, and a dedicated multi-tenant customer self-service portal.

---

## 🌟 Key Highlights & Differentiators

1. **Finite State Machine (FSM) Lifecycle Engine**:
   - Enforces valid subscription state transitions: `Trial` &rarr; `Active` &rarr; `Past Due` &rarr; `Paused` &rarr; `Cancelled`.
   - Rejects illegal state jumps (e.g. cancelled cannot jump directly to active without re-activation checkout).
   - Automated 14-day past due grace periods and renewal calculations for monthly & annual cycles with 18% GST integration.

2. **RevenueGuard Pre-Invoice Billing Assurance**:
   - 6-checkpoint validation pipeline: Customer status check, FSM state validity, duplicate billing check with idempotency keys, pricing rule check, statutory tax math check, and prorated discount validation.

3. **Cryptographic SHA-256 Evidence Ledger**:
   - Append-only, tamper-evident hash chaining linking Customer &rarr; Quotation &rarr; Subscription &rarr; Invoice &rarr; Payment &rarr; Reconciliation.

4. **AI Churn Prediction Engine**:
   - Supervised risk model evaluating payment friction velocity, login deficits, and API quota usage.
   - Explainable attribution factors and what-if sensitivity simulations.

5. **Multi-Tenant Customer Self-Service Portal**:
   - Strict tenant boundary isolation (`tenant_id`).
   - Self-serve plan upgrades and downgrades with prorated cycle calculations.
   - Print-ready GST-compliant tax invoices.

---

## 🏗️ Architecture

```
                                [ SubscriptIQ SaaS ]
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
          [ Super Admin ]                               [ Tenant Customer ]
     (Lifecycle & Analytics)                            (Self-Service Portal)
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          ▼
                             [ React 19 + TypeScript ]
                           (Vite, Tailwind, Recharts)
                                          │
                         REST APIs (/api/v1/*) / State Sync
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  ▼                       ▼                       ▼
        [ FastAPI Microservices ]   [ AI Churn Engine ]   [ Razorpay Gateway ]
         (Python 3.11, Pydantic)    (Gradient Model)         (Test Sandbox)
                  │                       │                       │
                  └───────────────────────┼───────────────────────┘
                                          ▼
                                [ PostgreSQL 16 ]
                            (Relational ACID Ledger)
                                          │
                           [ Redis + Celery Scheduler ]
                            (Daily Recurring Renewals)
```

---

## 🚀 Environment Configuration

Copy `.env.example` to `.env` and configure your credentials:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
|---|---|---|
| `ENVIRONMENT` | Deployment environment (`production` / `development`) | `production` |
| `SECRET_KEY` | JWT HS256 secret key (minimum 32 chars in production) | Generate via `openssl rand -hex 32` |
| `POSTGRES_USER` | PostgreSQL superuser username | `subflow_user` |
| `POSTGRES_PASSWORD` | PostgreSQL database password | Secure password |
| `POSTGRES_DB` | PostgreSQL database name | `subflow_enterprise` |
| `DATABASE_URL` | Full database connection string | `postgresql://user:pass@localhost:5432/subflow_enterprise` |
| `REDIS_URL` | Redis broker and backend connection URL | `redis://localhost:6379/0` |
| `RAZORPAY_KEY_ID` | Razorpay public key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret (server-side only) | `rzp_secret_...` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook verification secret | Webhook secret |
| `IS_RAZORPAY_TEST_MODE` | Toggle test mode simulator vs live charges | `true` |

---

## 💻 Local Development

### 1. Frontend Development (React + Vite)
```bash
npm install
npm run dev
```
Accessible at: `http://localhost:3000` (API proxy forwards `/api` requests to backend).

### 2. Backend Development (FastAPI + Python 3.11)
```bash
# Install dependencies
pip install -r requirements.txt

# Run Alembic database migrations
alembic upgrade head

# Run FastAPI backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API docs available at:
* Swagger UI: `http://localhost:8000/docs`
* ReDoc: `http://localhost:8000/redoc`

### 3. Celery Worker & Beat Scheduler
```bash
# In terminal 1: Celery Worker
celery -A app.core.celery_worker.celery_app worker -l info --concurrency=2

# In terminal 2: Celery Beat
celery -A app.core.celery_worker.celery_app beat -l info
```

---

## 🐳 Running with Docker & Docker Compose

### Production Orchestration
```bash
# Build and run containers in background with health checks
docker compose up -d --build

# Verify container status
docker compose ps

# View service logs
docker compose logs -f api celery_worker
```

### Development Orchestration (with Live Reloading & Volume Mounts)
```bash
docker compose -f docker-compose.dev.yml up --build
```

---

## 🧪 Automated Testing

Run the comprehensive unit and integration test suite:

```bash
# Run all 28 automated tests
python3 -m unittest discover tests

# Or run with pytest
pytest tests/ -v
```

Frontend Verification:
```bash
npm run lint
npm run build
```

---

## 🔒 Security & Statutory Compliance

* **Zero Plaintext Secrets**: Docker Compose and application configurations strictly use environment variables.
* **Server-Side Signature Validation**: All Razorpay payment and webhook signatures verified via HMAC-SHA256.
* **Payment Idempotency**: Payment charges require unique `idempotency_key`s, preventing double-billing.
* **Server-Authoritative Pricing**: Gross amounts computed server-side from catalog and statutory GST (never trusted from frontend).
* **Strict Multi-Tenant Isolation**: Query-level filtering on `tenant_id` blocks cross-tenant access.
* **Statutory GST (HSN 998313)**: Exact 18% GST split into 9% CGST and 9% SGST with decimal rounding.
* **Cryptographic Tamper-Evidence**: Financial ledger audit trail validated via SHA-256 hash chaining.
