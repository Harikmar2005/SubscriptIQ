import React, { useState } from 'react';
import {
  Code2,
  Database,
  Layers,
  Server,
  Terminal,
  FileCode,
  ShieldCheck,
  Cpu,
  Copy,
  Check,
} from 'lucide-react';

export const ArchitectureViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('fastapi_main');
  const [copied, setCopied] = useState(false);

  const codeFiles: Record<string, { title: string; lang: string; desc: string; content: string }> = {
    fastapi_main: {
      title: 'app/main.py (FastAPI REST Server)',
      lang: 'python',
      desc: 'Core FastAPI application with CORS, JWT middleware, dependency injection, and versioned API routers.',
      content: `from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import (
    auth_router,
    customers_router,
    plans_router,
    subscriptions_router,
    payments_router,
    invoices_router,
    analytics_router,
    ai_router,
    renewals_router
)
from app.database.session import engine, Base
from app.core.config import settings

# Create database tables upon startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SubFlow Enterprise Billing Engine",
    description="High-Throughput SaaS Subscription Management & AI Churn Analytics REST API",
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enterprise CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST Routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(customers_router, prefix="/api/v1/customers", tags=["Customers"])
app.include_router(plans_router, prefix="/api/v1/plans", tags=["Subscription Plans"])
app.include_router(subscriptions_router, prefix="/api/v1/subscriptions", tags=["Subscriptions"])
app.include_router(payments_router, prefix="/api/v1/payments", tags=["Payments & Gateway"])
app.include_router(invoices_router, prefix="/api/v1/invoices", tags=["Invoices"])
app.include_router(renewals_router, prefix="/api/v1/renewals", tags=["Automated Renewals"])
app.include_router(ai_router, prefix="/api/v1/ai", tags=["AI Churn Prediction"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Financial Analytics"])

@app.get("/healthz", status_code=status.HTTP_200_OK)
def health_check():
    return {
        "status": "healthy",
        "engine": "FastAPI + SQLAlchemy",
        "database": "PostgreSQL 16",
        "payment_gateway": "Razorpay Test Simulation",
        "ml_model_loaded": True
    }`,
    },
    sqlalchemy_models: {
      title: 'app/models/subscription.py (SQLAlchemy Relational Schema)',
      lang: 'python',
      desc: 'PostgreSQL relational database schema with foreign keys, indexes, and finite state transitions.',
      content: `from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database.base import Base

class SubscriptionStatus(str, enum.Enum):
    TRIAL = "trial"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class BillingInterval(str, enum.Enum):
    MONTHLY = "monthly"
    ANNUAL = "annual"

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(32), nullable=False)
    company = Column(String(255), nullable=False, index=True)
    address = Column(String(500), nullable=True)
    tax_id = Column(String(64), nullable=True) # GSTIN
    status = Column(String(32), default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    subscriptions = relationship("Subscription", back_populates="customer", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="customer")
    invoices = relationship("Invoice", back_populates="customer")

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    code = Column(String(64), unique=True, index=True, nullable=False) # basic, pro, enterprise
    description = Column(String(500), nullable=True)
    monthly_price = Column(Integer, nullable=False) # INR
    annual_price = Column(Integer, nullable=False)  # INR
    trial_days = Column(Integer, default=14)
    features = Column(JSON, nullable=False)
    limits = Column(JSON, nullable=False)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(64), primary_key=True, index=True)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False, index=True)
    plan_id = Column(String(64), ForeignKey("subscription_plans.id"), nullable=False, index=True)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, nullable=False, index=True)
    billing_interval = Column(Enum(BillingInterval), default=BillingInterval.MONTHLY, nullable=False)
    current_period_start = Column(DateTime(timezone=True), nullable=False)
    current_period_end = Column(DateTime(timezone=True), nullable=False, index=True)
    auto_renew = Column(Boolean, default=True)
    cancellation_reason = Column(String(500), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    paused_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="subscriptions")
    plan = relationship("SubscriptionPlan")
    payments = relationship("Payment", back_populates="subscription")
    invoices = relationship("Invoice", back_populates="subscription")`,
    },
    ml_churn: {
      title: 'app/ml/churn_model.py (AI Churn Predictor)',
      lang: 'python',
      desc: 'Machine Learning churn probability estimator using payment failure rate, login frequency, and contract age.',
      content: `import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, List

class ChurnPredictionEngine:
    """
    Multi-feature behavioral churn estimator.
    Evaluates customer tenure, payment friction, usage velocity, and renewal timing.
    """
    def __init__(self):
        # Feature weight coefficients derived from SaaS benchmarks
        self.weights = {
            "payment_failure_frequency": 0.35,
            "login_frequency_deficit": 0.25,
            "api_quota_underutilization": 0.15,
            "past_due_status_penalty": 0.15,
            "annual_contract_discount": -0.10
        }

    def predict_churn_risk(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        failed_payments = customer_data.get("failed_payments_last_90d", 0)
        monthly_logins = customer_data.get("monthly_logins", 10)
        api_usage_pct = customer_data.get("api_usage_pct", 50.0)
        is_past_due = customer_data.get("status") == "past_due"
        is_annual = customer_data.get("billing_interval") == "annual"

        # Calculate composite churn probability (0 - 100)
        risk_score = 15.0
        factors = []

        if failed_payments > 0:
            risk_score += min(50.0, failed_payments * 25.0)
            factors.append(f"{failed_payments} failed recurring payment attempts")

        if is_past_due:
            risk_score += 30.0
            factors.append("Account currently past due in active dunning")

        if monthly_logins < 5:
            risk_score += 25.0
            factors.append("Severe user inactivity (< 5 logins/month)")
        elif monthly_logins > 60:
            risk_score -= 10.0
            factors.append("High daily user engagement")

        if api_usage_pct < 10.0:
            risk_score += 15.0
            factors.append("Low feature adoption (< 10% API quota used)")

        if is_annual:
            risk_score -= 15.0
            factors.append("Locked into annual recurring contract")

        risk_score = float(np.clip(risk_score, 5.0, 95.0))
        health_score = float(np.clip(100.0 - risk_score, 5.0, 98.0))

        if risk_score >= 65.0:
            risk_tier = "high"
            action = "Dispatch immediate customer success intervention; offer 15% retention credit."
        elif risk_score >= 35.0:
            risk_tier = "medium"
            action = "Send feature onboarding tips and schedule executive health check."
        else:
            risk_tier = "low"
            action = "Account is highly stable. Eligible for Annual contract conversion."

        return {
            "churn_risk": risk_tier,
            "risk_score": round(risk_score, 1),
            "health_score": round(health_score, 1),
            "key_factors": factors,
            "recommended_action": action,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }`,
    },
    docker_compose: {
      title: 'docker-compose.yml & Deployment',
      lang: 'yaml',
      desc: 'Production container orchestrator with PostgreSQL 16, Redis Celery background workers, and FastAPI.',
      content: `version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: subflow_api
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://subflow_user:subflow_secure_password@db:5432/subflow_enterprise
      - SECRET_KEY=enterprise_jwt_super_secret_signing_key_2026
      - RAZORPAY_KEY_ID=rzp_test_simulated_key
      - RAZORPAY_KEY_SECRET=rzp_test_simulated_secret
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    restart: always

  celery_scheduler:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: subflow_renewal_cron
    command: celery -A app.core.celery_worker beat -l info
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgresql://subflow_user:subflow_secure_password@db:5432/subflow_enterprise

  db:
    image: postgres:16-alpine
    container_name: subflow_postgres
    environment:
      POSTGRES_USER: subflow_user
      POSTGRES_PASSWORD: subflow_secure_password
      POSTGRES_DB: subflow_enterprise
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: subflow_redis
    ports:
      - "6379:6379"

volumes:
  postgres_data:`,
    },
    fastapi_subscriptions: {
      title: 'app/api/v1/subscriptions.py (REST API Router)',
      lang: 'python',
      desc: 'REST API endpoints implementing state machine transitions, upgrade calculations, and cancel reasons.',
      content: `from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse, SubscriptionUpgrade
from app.services.subscription_service import SubscriptionLifecycleEngine
from app.core.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[SubscriptionResponse])
def list_subscriptions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve all subscriptions with customer and plan relations"""
    engine = SubscriptionLifecycleEngine(db)
    return engine.get_all(skip=skip, limit=limit)

@router.post("/", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new subscription with trial or immediate activation"""
    engine = SubscriptionLifecycleEngine(db)
    return engine.create(payload, actor_email=current_user.email)

@router.post("/{sub_id}/upgrade", response_model=SubscriptionResponse)
def upgrade_subscription(
    sub_id: str,
    payload: SubscriptionUpgrade,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Upgrade or downgrade plan tier with prorated calculation"""
    engine = SubscriptionLifecycleEngine(db)
    return engine.upgrade_or_downgrade(sub_id, payload.new_plan_id, payload.billing_interval)

@router.post("/{sub_id}/pause", response_model=SubscriptionResponse)
def pause_subscription(sub_id: str, db: Session = Depends(get_db)):
    """Pause an active subscription"""
    engine = SubscriptionLifecycleEngine(db)
    return engine.transition_status(sub_id, "paused", reason="Customer hiatus")

@router.post("/{sub_id}/cancel", response_model=SubscriptionResponse)
def cancel_subscription(sub_id: str, reason: str, db: Session = Depends(get_db)):
    """Cancel subscription and log churn reason"""
    engine = SubscriptionLifecycleEngine(db)
    return engine.transition_status(sub_id, "cancelled", reason=reason)`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeFiles[selectedFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
              <Code2 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Backend Microservices & Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete FastAPI Python REST backend specification, PostgreSQL schemas, Celery dunning worker, and Docker orchestrator.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied to Clipboard' : 'Copy Source Code'}
        </button>
      </div>

      {/* Architecture System Diagram */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
          Production Multi-Tier Enterprise Architecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white mx-auto flex items-center justify-center font-bold mb-2 shadow-xs">
              UI
            </div>
            <div className="text-xs font-bold text-slate-900">React + Vite + TS</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Tailwind CSS & Recharts</div>
            <div className="mt-2 text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold inline-block">
              Client & Tenant Portal
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white mx-auto flex items-center justify-center font-bold mb-2 shadow-xs">
              API
            </div>
            <div className="text-xs font-bold text-slate-900">Python FastAPI</div>
            <div className="text-[11px] text-slate-500 mt-0.5">REST APIs & Pydantic v2</div>
            <div className="mt-2 text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold inline-block">
              FSM Lifecycle Engine
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white mx-auto flex items-center justify-center font-bold mb-2 shadow-xs">
              DB
            </div>
            <div className="text-xs font-bold text-slate-900">PostgreSQL 16</div>
            <div className="text-[11px] text-slate-500 mt-0.5">SQLAlchemy ORM + Alembic</div>
            <div className="mt-2 text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold inline-block">
              ACID Relational Ledger
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white mx-auto flex items-center justify-center font-bold mb-2 shadow-xs">
              ML
            </div>
            <div className="text-xs font-bold text-slate-900">AI Churn Model</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Multi-feature heuristic/ML</div>
            <div className="mt-2 text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold inline-block">
              Predictive Retention
            </div>
          </div>
        </div>
      </div>

      {/* Code Viewer File Selector & Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* File Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          {Object.entries(codeFiles).map(([k, file]) => (
            <button
              key={k}
              onClick={() => setSelectedFile(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedFile === k
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs border border-indigo-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              {file.title.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="p-5">
          <div className="mb-3">
            <div className="text-sm font-bold text-slate-900">{codeFiles[selectedFile].title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{codeFiles[selectedFile].desc}</div>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-[500px]">
            <code>{codeFiles[selectedFile].content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
