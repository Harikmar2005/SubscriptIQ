from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import engine, Base
from app.core.config import settings
from app.api.v1 import api_v1_router

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SubscriptIQ Enterprise Billing Engine",
    description="Full-Stack SaaS Subscription Management REST API with Razorpay Simulation & AI Churn Analytics",
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "platform": "SubscriptIQ Enterprise",
        "version": "2.4.0",
        "status": "online",
        "docs": "/docs"
    }

@app.get("/api/v1/healthz")
def healthz():
    return {
        "status": "healthy",
        "database": "PostgreSQL 16",
        "payment_gateway": "Razorpay Test Simulation",
        "scheduler": "Celery Beat Active"
    }
