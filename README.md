# SubFlow Enterprise | SaaS Subscription Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688.svg)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)

An enterprise-grade, full-stack **Subscription Management & Recurring Billing Platform** with AI-powered customer retention intelligence, finite state machine (FSM) lifecycle automation, simulated Razorpay payment gateway, GST-compliant tax invoicing, and a dedicated multi-tenant customer self-service portal.

---

## 🌟 Key Highlights & Differentiators

1. **Finite State Machine (FSM) Lifecycle Engine**:
   - Enforces valid subscription state transitions: `Trial` &rarr; `Active` &rarr; `Past Due` &rarr; `Paused` &rarr; `Cancelled`.
   - Rejects illegal state jumps (e.g. cancelled cannot jump directly to active without re-activation checkout).
   - Automated renewal calculations for monthly & annual cycles with GST (18%) integration.

2. **AI-Powered Churn Prediction & Health Scoring**:
   - Real-time multi-signal behavioral risk model:
     - Payment failure velocity (35% weight)
     - Login and seat engagement deficit (25% weight)
     - API quota underutilization (15% weight)
     - Past due dunning penalty (15% weight)
     - Annual commitment discount (-10% weight)
   - Actionable retention recommendations per high-risk customer.

3. **Realistic Razorpay Test Gateway Simulation**:
   - Live interactive modal simulating Credit/Debit card charges, UPI QR, and Corporate Net Banking.
   - Built-in test card selection:
     - Success Card (`4242 4242 4242 4242`)
     - Card Declined (`4000 0000 0000 0002`)
     - 3DS Timeout / Gateway Failure (`4000 0000 0000 0003`)
   - Auto-triggers state transitions, invoice generation, and revenue updates.

4. **Multi-Tenant Customer Self-Service Portal**:
   - Isolated customer view (`Sarah Jenkins - TechNova Solutions`).
   - Self-serve plan upgrades and downgrades with prorated cycle calculations.
   - Download official GST-compliant tax invoices as print-ready documents.
   - Update company billing address, phone, and GSTIN.

5. **Financial Analytics & SaaS Unit Economics**:
   - Real-time calculated metrics: MRR, ARR, ARPU, Customer Lifetime Value (CLV), Churn Rate, and Gateway Collection Efficiency.
   - Predictive 6-month revenue forecasting (Baseline 8% MoM vs Conservative vs Aggressive models).
   - CSV ledger export.

6. **15-Step Automated Hackathon Demonstration Workflow**:
   - Built-in top bar with 1-click execution or step-by-step navigation through the entire user journey.

---

## 🏗️ Architecture

```
                                  [ SubFlow SaaS ]
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

## 🚀 Quick Start

### Frontend & Live Interactive Applet
The application is pre-configured and runs automatically:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Python FastAPI Backend (Docker)
To run the containerized backend with PostgreSQL and Redis:
```bash
docker-compose up --build
```
API Documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Run Backend Unit Tests
```bash
pytest tests/
```

---

## 📋 15-Step Hackathon Workflow Demonstration

1. **Admin Login**: Authenticate as Alexander Vance (Super Administrator).
2. **Dashboard Overview**: Inspect real-time MRR, ARR, Active Subscriptions, and Collection Health.
3. **Customer Management**: Register a new enterprise client (`QuantumScale AI Corp`).
4. **Subscription Plans**: Inspect Basic Starter (₹299/mo), Professional Scale (₹799/mo), and Enterprise Apex (₹1,999/mo).
5. **Assign Subscription**: Assign the Professional Scale plan to the newly created entity.
6. **Subscription Created**: Verify new record in Trial/Pending state.
7. **Simulate Payment**: Launch Razorpay simulator using Test Card `4242 4242 4242 4242`.
8. **Subscription Activated**: State machine transitions status from Trial &rarr; Active.
9. **Invoice Generated**: Automatic generation of Tax Invoice `INV-2026-XXXX` with 18% GST.
10. **Revenue Metrics Update**: Dashboard ARR and MRR velocity dynamically refresh.
11. **Renewals Queue**: Subscription appears in the upcoming scheduled renewals window.
12. **Trigger Scheduled Renewal**: Execute batch renewal run via background engine.
13. **Payment Processed**: Successful automated cycle advancement.
14. **Audit Trail**: Review complete timestamped audit ledger for all lifecycle events.
15. **AI Churn Prediction**: Model flags accounts with payment friction or low logins and recommends retention offers.

---

## 🔒 Security & Compliance
- **Zero Real Card Storage**: Test-mode PCI-DSS compliant sandbox.
- **GST Compliance**: Automated Indian 18% Integrated GST calculation.
- **Role-Based Access Control (RBAC)**: Strict segregation between Admin and Tenant views.
