from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from app.database.session import get_db
from app.models.subscription import Subscription, SubscriptionPlan, Customer
from app.services.payment_service import PaymentProcessingService
from app.api.v1.deps import get_current_tenant_id, get_admin_user

router = APIRouter()

@router.post("/batch-run")
def trigger_renewal_batch(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    admin_user = Depends(get_admin_user)
):
    """
    Automated batch renewals job.
    Evaluates subscriptions reaching current period end and triggers recurring charges.
    """
    now = datetime.now(timezone.utc)
    target_window = now + timedelta(days=7)

    subs = db.query(Subscription).filter(
        Subscription.tenant_id == tenant_id,
        Subscription.status.in_(["active", "past_due"]),
        Subscription.current_period_end <= target_window,
        Subscription.auto_renew == True
    ).all()

    payment_service = PaymentProcessingService(db, tenant_id=tenant_id)
    processed = 0
    succeeded = 0
    failed = 0
    details = []

    for sub in subs:
        plan = db.query(SubscriptionPlan).filter_by(id=sub.plan_id, tenant_id=tenant_id).first()
        if not plan:
            continue

        base_amount = plan.annual_price if sub.billing_interval == "annual" else plan.monthly_price
        # Total with 18% GST
        gross = round(base_amount * 1.18)

        # Idempotency key per renewal cycle
        cycle_key = f"renew_{sub.id}_{now.strftime('%Y-%m')}"

        result = payment_service.process_payment(
            subscription_id=sub.id,
            customer_id=sub.customer_id,
            amount=gross,
            payment_method={"type": "card", "last4": "4242", "brand": "Visa Auto-Renew"},
            idempotency_key=cycle_key,
            actor_email=admin_user.email
        )

        processed += 1
        if result["status"] == "success":
            succeeded += 1
            details.append(f"Renewed subscription {sub.id} for ₹{gross:,}")
        else:
            failed += 1
            details.append(f"Renewal failed for {sub.id}: {result.get('error')}")

    return {
        "processed_count": processed,
        "success_count": succeeded,
        "failed_count": failed,
        "executed_at": now.isoformat(),
        "details": details
    }
