from app.api.v1.auth import router as auth_router
from app.api.v1.customers import router as customers_router
from app.api.v1.plans import router as plans_router
from app.api.v1.subscriptions import router as subscriptions_router
from app.api.v1.payments import router as payments_router
from app.api.v1.invoices import router as invoices_router
from app.api.v1.renewals import router as renewals_router
from app.api.v1.revenue_guard import router as revenue_guard_router
from app.api.v1.ai import router as ai_router
from app.api.v1.analytics import router as analytics_router

__all__ = [
    "auth_router",
    "customers_router",
    "plans_router",
    "subscriptions_router",
    "payments_router",
    "invoices_router",
    "renewals_router",
    "revenue_guard_router",
    "ai_router",
    "analytics_router",
]
