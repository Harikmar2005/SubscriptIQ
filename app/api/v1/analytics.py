from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.database.session import get_db
from app.models.subscription import Customer, Subscription, Payment, Invoice
from app.api.v1.deps import get_current_tenant_id

router = APIRouter()

@router.get("/metrics")
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Calculates live SaaS financial metrics: Total Customers, Active Subs, MRR, ARR, ARPU."""
    customers_count = db.query(Customer).filter(Customer.tenant_id == tenant_id).count()
    active_subs = db.query(Subscription).filter(
        Subscription.tenant_id == tenant_id,
        Subscription.status == "active"
    ).all()

    mrr = 0
    for s in active_subs:
        if s.plan:
            if s.billing_interval == "annual":
                mrr += round(s.plan.annual_price / 12)
            else:
                mrr += s.plan.monthly_price

    arr = mrr * 12
    arpu = round(mrr / max(1, customers_count))

    paid_payments = db.query(Payment).filter(
        Payment.tenant_id == tenant_id,
        Payment.status == "success"
    ).count()

    total_payments = db.query(Payment).filter(Payment.tenant_id == tenant_id).count()
    payment_rate = round((paid_payments / max(1, total_payments)) * 100, 1)

    return {
        "total_customers": customers_count,
        "active_subscriptions": len(active_subs),
        "mrr": mrr,
        "arr": arr,
        "arpu": arpu,
        "payment_success_rate": payment_rate,
        "currency": "INR"
    }
