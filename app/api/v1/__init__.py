from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.customers import router as customers_router
from app.api.v1.plans import router as plans_router
from app.api.v1.subscriptions import router as subscriptions_router
from app.api.v1.payments import router as payments_router
from app.api.v1.invoices import router as invoices_router
from app.api.v1.ai import router as ai_router
from app.api.v1.analytics import router as analytics_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_v1_router.include_router(customers_router, prefix="/customers", tags=["Customers"])
api_v1_router.include_router(plans_router, prefix="/plans", tags=["Plans"])
api_v1_router.include_router(subscriptions_router, prefix="/subscriptions", tags=["Subscriptions"])
api_v1_router.include_router(payments_router, prefix="/payments", tags=["Payments"])
api_v1_router.include_router(invoices_router, prefix="/invoices", tags=["Invoices"])
api_v1_router.include_router(ai_router, prefix="/ai", tags=["AI Churn Engine"])
api_v1_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
