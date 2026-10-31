import uuid
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.subscription import Subscription, SubscriptionPlan, Customer, SubscriptionStatus, BillingInterval, SubscriptionHistory
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse, SubscriptionUpgrade
from app.services.subscription_service import SubscriptionLifecycleEngine
from app.core.security import get_current_user, CurrentUserContext

router = APIRouter()

@router.get("/", response_model=List[SubscriptionResponse])
def get_subscriptions(
    db: Session = Depends(get_db),
    current_user: CurrentUserContext = Depends(get_current_user)
):
    query = db.query(Subscription).filter(Subscription.tenant_id == current_user.tenant_id)
    if current_user.role == "customer" and current_user.customer_id:
        query = query.filter(Subscription.customer_id == current_user.customer_id)
    return query.all()

@router.post("/", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(
    payload: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUserContext = Depends(get_current_user)
):
    plan = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.id == payload.plan_id,
        SubscriptionPlan.tenant_id == current_user.tenant_id
    ).first()
    customer = db.query(Customer).filter(
        Customer.id == payload.customer_id,
        Customer.tenant_id == current_user.tenant_id
    ).first()

    if not plan or not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan or Customer not found")

    now = datetime.now(timezone.utc)
    interval = BillingInterval.ANNUAL if payload.billing_interval == "annual" else BillingInterval.MONTHLY
    is_trial = payload.start_with_trial and plan.trial_days > 0

    end_date = now + timedelta(days=plan.trial_days) if is_trial else (now + (timedelta(days=365) if interval == BillingInterval.ANNUAL else timedelta(days=30)))

    new_sub = Subscription(
        id=f"sub-{uuid.uuid4().hex[:8]}",
        tenant_id=current_user.tenant_id,
        customer_id=customer.id,
        plan_id=plan.id,
        status=SubscriptionStatus.TRIAL if is_trial else SubscriptionStatus.ACTIVE,
        billing_interval=interval,
        current_period_start=now,
        current_period_end=end_date,
        trial_end=end_date if is_trial else None,
        auto_renew=payload.auto_renew,
        failed_retry_count=0
    )
    db.add(new_sub)

    db.add(SubscriptionHistory(
        id=f"hist-{uuid.uuid4().hex[:8]}",
        tenant_id=current_user.tenant_id,
        subscription_id=new_sub.id,
        customer_id=customer.id,
        event_type="created",
        details=f"Subscription created on {plan.name} ({interval.value}).",
        new_plan_id=plan.id,
        user_email=current_user.email
    ))

    db.commit()
    db.refresh(new_sub)
    return new_sub

@router.post("/{sub_id}/upgrade", response_model=SubscriptionResponse)
def upgrade_subscription(
    sub_id: str,
    payload: SubscriptionUpgrade,
    db: Session = Depends(get_db),
    current_user: CurrentUserContext = Depends(get_current_user)
):
    sub = db.query(Subscription).filter(
        Subscription.id == sub_id,
        Subscription.tenant_id == current_user.tenant_id
    ).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

    new_plan = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.id == payload.new_plan_id,
        SubscriptionPlan.tenant_id == current_user.tenant_id
    ).first()
    if not new_plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target Plan not found")

    old_plan_id = sub.plan_id
    sub.plan_id = new_plan.id
    if payload.billing_interval:
        sub.billing_interval = BillingInterval.ANNUAL if payload.billing_interval == "annual" else BillingInterval.MONTHLY
    
    sub.status = SubscriptionStatus.ACTIVE
    now = datetime.now(timezone.utc)
    sub.current_period_start = now
    sub.current_period_end = now + (timedelta(days=365) if sub.billing_interval == BillingInterval.ANNUAL else timedelta(days=30))

    db.add(SubscriptionHistory(
        id=f"hist-{uuid.uuid4().hex[:8]}",
        tenant_id=current_user.tenant_id,
        subscription_id=sub.id,
        customer_id=sub.customer_id,
        event_type="upgraded",
        details=f"Tier changed to {new_plan.name}.",
        previous_plan_id=old_plan_id,
        new_plan_id=new_plan.id,
        user_email=current_user.email
    ))

    db.commit()
    db.refresh(sub)
    return sub

@router.post("/{sub_id}/cancel", response_model=SubscriptionResponse)
def cancel_subscription(
    sub_id: str,
    reason: str = "Customer request",
    db: Session = Depends(get_db),
    current_user: CurrentUserContext = Depends(get_current_user)
):
    sub = db.query(Subscription).filter(
        Subscription.id == sub_id,
        Subscription.tenant_id == current_user.tenant_id
    ).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

    engine = SubscriptionLifecycleEngine(db, current_user.tenant_id)
    engine.validate_transition(sub.status, SubscriptionStatus.CANCELLED)

    sub.status = SubscriptionStatus.CANCELLED
    sub.cancellation_reason = reason
    sub.cancelled_at = datetime.now(timezone.utc)
    sub.auto_renew = False

    db.add(SubscriptionHistory(
        id=f"hist-{uuid.uuid4().hex[:8]}",
        tenant_id=current_user.tenant_id,
        subscription_id=sub.id,
        customer_id=sub.customer_id,
        event_type="cancelled",
        details=f"Subscription cancelled: {reason}",
        user_email=current_user.email
    ))

    db.commit()
    db.refresh(sub)
    return sub
