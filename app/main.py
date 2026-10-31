from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.core.config import settings
from app.database.session import engine
from app.database.base import Base
from app.api.v1 import (
    auth_router,
    customers_router,
    plans_router,
    subscriptions_router,
    payments_router,
    invoices_router,
    analytics_router,
    ai_router,
    renewals_router,
    revenue_guard_router
)

# Initialize database schema tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logging.warning(f"Could not connect to database on startup: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="High-Throughput SaaS Subscription Management & RevenueGuard Assurance Platform",
    version=settings.VERSION,
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

# Global Safe Exception Handler: Prevents leaking database errors or stack traces to clients
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Internal server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    if settings.ENVIRONMENT == "production":
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal server error occurred. Please contact financial operations support."}
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)}
    )

# Register Version 1 REST Routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(revenue_guard_router, prefix=f"{settings.API_V1_STR}/revenue-guard", tags=["RevenueGuard Assurance"])
app.include_router(customers_router, prefix=f"{settings.API_V1_STR}/customers", tags=["Customers"])
app.include_router(plans_router, prefix=f"{settings.API_V1_STR}/plans", tags=["Subscription Plans"])
app.include_router(subscriptions_router, prefix=f"{settings.API_V1_STR}/subscriptions", tags=["Subscriptions"])
app.include_router(payments_router, prefix=f"{settings.API_V1_STR}/payments", tags=["Payments & Gateway"])
app.include_router(invoices_router, prefix=f"{settings.API_V1_STR}/invoices", tags=["Invoices"])
app.include_router(renewals_router, prefix=f"{settings.API_V1_STR}/renewals", tags=["Automated Renewals"])
app.include_router(ai_router, prefix=f"{settings.API_V1_STR}/ai", tags=["AI Churn Prediction"])
app.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Financial Analytics"])

@app.get("/healthz", status_code=status.HTTP_200_OK)
def health_check():
    return {
        "status": "healthy",
        "engine": "FastAPI + SQLAlchemy 2.0",
        "revenue_guard": "active",
        "version": settings.VERSION,
        "is_razorpay_test_mode": settings.IS_RAZORPAY_TEST_MODE
    }
