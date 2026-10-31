from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.subscription import Customer, Subscription, Payment, SubscriptionStatus, PaymentStatus, FinancialLedger
from app.core.security import get_current_user, CurrentUserContext

router = APIRouter()

@router.get("/overview")
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: CurrentUserContext = Depends(get_current_user)
):
    tenant_id = current_user.tenant_id
    total_customers = db.query(Customer).filter(Customer.tenant_id == tenant_id).count()
    active_subs = db.query(Subscription).filter(
        Subscription.tenant_id == tenant_id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).count()

    payments = db.query(Payment).filter(Payment.tenant_id == tenant_id).all()
    successful = [p for p in payments if p.status == PaymentStatus.SUCCESS]
    success_rate = round((len(successful) / len(payments) * 100), 1) if payments else 100.0

    ledger_entries = db.query(FinancialLedger).filter(FinancialLedger.tenant_id == tenant_id).all()

    return {
        "tenant_id": tenant_id,
        "total_customers": total_customers,
        "active_subscriptions": active_subs,
        "payment_success_rate": success_rate,
        "total_transactions": len(payments),
        "ledger_entries_count": len(ledger_entries)
    }
