from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.database.session import get_db
from app.schemas.subscription import SubscriptionCreate, SubscriptionUpgrade, SubscriptionStatusTransition
from app.services.subscription_service import SubscriptionLifecycleEngine
from app.api.v1.deps import get_current_user, get_current_tenant_id
from app.models.subscription import User

router = APIRouter()

@router.get("/")
def list_subscriptions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Retrieve all subscriptions in current tenant."""
    engine = SubscriptionLifecycleEngine(db, tenant_id=tenant_id)
    subs = engine.get_all(skip=skip, limit=limit)
    return [
        {
            "id": s.id,
            "tenant_id": s.tenant_id,
            "customer_id": s.customer_id,
            "plan_id": s.plan_id,
            "status": s.status,
            "billing_interval": s.billing_interval,
            "current_period_start": s.current_period_start.isoformat(),
            "current_period_end": s.current_period_end.isoformat(),
            "grace_period_end": s.grace_period_end.isoformat() if s.grace_period_end else None,
            "auto_renew": s.auto_renew,
            "failed_retry_count": s.failed_retry_count
        }
        for s in subs
    ]

@router.get("/{sub_id}")
def get_subscription(
    sub_id: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Retrieve single subscription strictly within authenticated tenant boundary."""
    engine = SubscriptionLifecycleEngine(db, tenant_id=tenant_id)
    sub = engine.get_by_id(sub_id)
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription {sub_id} not found in current tenant"
        )
    return {
        "id": sub.id,
        "tenant_id": sub.tenant_id,
        "customer_id": sub.customer_id,
        "plan_id": sub.plan_id,
        "status": sub.status,
        "billing_interval": sub.billing_interval,
        "current_period_start": sub.current_period_start.isoformat(),
        "current_period_end": sub.current_period_end.isoformat(),
        "grace_period_end": sub.grace_period_end.isoformat() if sub.grace_period_end else None,
        "auto_renew": sub.auto_renew,
        "failed_retry_count": sub.failed_retry_count
    }

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_subscription(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user)
):
    """Create a new subscription."""
    engine = SubscriptionLifecycleEngine(db, tenant_id=tenant_id)
    try:
        sub = engine.create(payload, actor_email=current_user.email)
        return {
            "id": sub.id,
            "customer_id": sub.customer_id,
            "plan_id": sub.plan_id,
            "status": sub.status,
            "billing_interval": sub.billing_interval,
            "current_period_end": sub.current_period_end.isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{sub_id}/upgrade")
def upgrade_subscription(
    sub_id: str,
    payload: SubscriptionUpgrade,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user)
):
    """Upgrade or downgrade plan tier."""
    engine = SubscriptionLifecycleEngine(db, tenant_id=tenant_id)
    try:
        sub = engine.upgrade_or_downgrade(
            sub_id,
            payload.new_plan_id,
            payload.billing_interval,
            actor_email=current_user.email
        )
        return {"message": "Plan updated successfully", "id": sub.id, "plan_id": sub.plan_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{sub_id}/pause")
def pause_subscription(
    sub_id: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user)
):
    """Pause an active subscription."""
    engine = SubscriptionLifecycleEngine(db, tenant_id=tenant_id)
    try:
        sub = engine.transition_status(sub_id, "paused", reason="Customer hiatus", actor_email=current_user.email)
        return {"message": "Subscription paused", "id": sub.id, "status": sub.status}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{sub_id}/resume")
def resume_subscription(
    sub_id: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user)
):
    """Resume a paused subscription."""
    engine = SubscriptionLifecycleEngine(db, tenant_id=tenant_id)
    try:
        sub = engine.transition_status(sub_id, "active", reason="Customer resumed", actor_email=current_user.email)
        return {"message": "Subscription resumed", "id": sub.id, "status": sub.status}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{sub_id}/cancel")
def cancel_subscription(
    sub_id: str,
    reason: str = "Requested by customer",
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user)
):
    """Cancel subscription and log churn reason."""
    engine = SubscriptionLifecycleEngine(db, tenant_id=tenant_id)
    try:
        sub = engine.transition_status(sub_id, "cancelled", reason=reason, actor_email=current_user.email)
        return {"message": "Subscription cancelled", "id": sub.id, "status": sub.status}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
