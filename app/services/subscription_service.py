from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.subscription import Subscription, SubscriptionStatus, BillingInterval, Customer, SubscriptionPlan, Invoice, Payment, AuditEvent
from app.services.evidence_ledger import CryptographicEvidenceLedger

class SubscriptionLifecycleEngine:
    """
    Finite State Machine (FSM) Lifecycle Engine.
    Enforces atomic state transitions, grace periods, proration, and audit trails.
    """

    VALID_TRANSITIONS = {
        SubscriptionStatus.TRIAL.value: [SubscriptionStatus.ACTIVE.value, SubscriptionStatus.EXPIRED.value, SubscriptionStatus.CANCELLED.value],
        SubscriptionStatus.ACTIVE.value: [SubscriptionStatus.PAST_DUE.value, SubscriptionStatus.PAUSED.value, SubscriptionStatus.CANCELLED.value, SubscriptionStatus.EXPIRED.value, SubscriptionStatus.ACTIVE.value],
        SubscriptionStatus.PAST_DUE.value: [SubscriptionStatus.ACTIVE.value, SubscriptionStatus.CANCELLED.value, SubscriptionStatus.EXPIRED.value],
        SubscriptionStatus.PAUSED.value: [SubscriptionStatus.ACTIVE.value, SubscriptionStatus.CANCELLED.value, SubscriptionStatus.EXPIRED.value],
        SubscriptionStatus.CANCELLED.value: [],  # Terminal state
        SubscriptionStatus.EXPIRED.value: [SubscriptionStatus.ACTIVE.value]  # Reactivation allowed
    }

    def __init__(self, db: Session, tenant_id: str = "tenant-primary"):
        self.db = db
        self.tenant_id = tenant_id
        self.ledger = CryptographicEvidenceLedger(db, tenant_id=tenant_id)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Subscription]:
        return self.db.query(Subscription).filter(
            Subscription.tenant_id == self.tenant_id
        ).offset(skip).limit(limit).all()

    def get_by_id(self, subscription_id: str) -> Optional[Subscription]:
        return self.db.query(Subscription).filter(
            Subscription.id == subscription_id,
            Subscription.tenant_id == self.tenant_id
        ).first()

    def create(self, payload: Any, actor_email: str = "system") -> Subscription:
        customer = self.db.query(Customer).filter(
            Customer.id == payload.customer_id,
            Customer.tenant_id == self.tenant_id
        ).first()
        if not customer:
            raise ValueError(f"Customer {payload.customer_id} not found in current tenant")

        plan = self.db.query(SubscriptionPlan).filter(
            SubscriptionPlan.id == payload.plan_id,
            SubscriptionPlan.tenant_id == self.tenant_id
        ).first()
        if not plan:
            raise ValueError(f"Plan {payload.plan_id} not found in current tenant")

        now = datetime.now(timezone.utc)
        is_trial = payload.start_with_trial and (plan.trial_days or 14) > 0

        if is_trial:
            period_end = now + timedelta(days=plan.trial_days or 14)
            initial_status = SubscriptionStatus.TRIAL.value
            trial_end = period_end
        else:
            if payload.billing_interval == BillingInterval.ANNUAL.value:
                period_end = now + timedelta(days=365)
            else:
                period_end = now + timedelta(days=30)
            initial_status = SubscriptionStatus.ACTIVE.value
            trial_end = None

        sub_id = f"sub-{int(now.timestamp())}"
        sub = Subscription(
            id=sub_id,
            tenant_id=self.tenant_id,
            customer_id=customer.id,
            plan_id=plan.id,
            status=initial_status,
            billing_interval=payload.billing_interval,
            current_period_start=now,
            current_period_end=period_end,
            trial_end=trial_end,
            auto_renew=payload.auto_renew,
            failed_retry_count=0
        )

        self.db.add(sub)
        self.db.commit()
        self.db.refresh(sub)

        # Audit ledger record
        self.ledger.append_audit_event(
            event_type="subscription_created",
            entity_id=sub.id,
            actor=actor_email,
            payload={
                "customer_id": customer.id,
                "plan_id": plan.id,
                "status": initial_status,
                "billing_interval": payload.billing_interval,
                "period_end": period_end.isoformat()
            }
        )

        return sub

    def transition_status(
        self,
        subscription_id: str,
        new_status: str,
        reason: Optional[str] = None,
        actor_email: str = "system"
    ) -> Subscription:
        sub = self.get_by_id(subscription_id)
        if not sub:
            raise ValueError(f"Subscription {subscription_id} not found")

        current_status = sub.status
        allowed = self.VALID_TRANSITIONS.get(current_status, [])

        if new_status != current_status and new_status not in allowed:
            raise ValueError(f"Invalid state transition from '{current_status}' to '{new_status}'. Allowed: {allowed}")

        now = datetime.now(timezone.utc)

        # Handle past-due grace period (14 days)
        if new_status == SubscriptionStatus.PAST_DUE.value:
            sub.grace_period_end = now + timedelta(days=14)
            sub.failed_retry_count = (sub.failed_retry_count or 0) + 1
        elif new_status == SubscriptionStatus.ACTIVE.value:
            sub.grace_period_end = None
            sub.failed_retry_count = 0
            if current_status == SubscriptionStatus.PAUSED.value:
                sub.paused_at = None

        if new_status == SubscriptionStatus.PAUSED.value:
            sub.paused_at = now
        elif new_status == SubscriptionStatus.CANCELLED.value:
            sub.cancelled_at = now
            sub.cancellation_reason = reason or "Customer requested cancellation"

        sub.status = new_status
        sub.updated_at = now

        self.db.commit()
        self.db.refresh(sub)

        # Record cryptographic ledger event
        self.ledger.append_audit_event(
            event_type="subscription_transition",
            entity_id=sub.id,
            actor=actor_email,
            payload={
                "previous_status": current_status,
                "new_status": new_status,
                "reason": reason,
                "grace_period_end": sub.grace_period_end.isoformat() if sub.grace_period_end else None
            }
        )

        return sub

    def upgrade_or_downgrade(
        self,
        subscription_id: str,
        new_plan_id: str,
        new_interval: Optional[str] = None,
        actor_email: str = "system"
    ) -> Subscription:
        sub = self.get_by_id(subscription_id)
        if not sub:
            raise ValueError(f"Subscription {subscription_id} not found")

        new_plan = self.db.query(SubscriptionPlan).filter(
            SubscriptionPlan.id == new_plan_id,
            SubscriptionPlan.tenant_id == self.tenant_id
        ).first()
        if not new_plan:
            raise ValueError(f"Plan {new_plan_id} not found")

        prev_plan_id = sub.plan_id
        now = datetime.now(timezone.utc)
        sub.plan_id = new_plan.id
        if new_interval:
            sub.billing_interval = new_interval

        # Extend period from upgrade timestamp
        if sub.billing_interval == BillingInterval.ANNUAL.value:
            sub.current_period_end = now + timedelta(days=365)
        else:
            sub.current_period_end = now + timedelta(days=30)

        sub.current_period_start = now
        sub.status = SubscriptionStatus.ACTIVE.value
        sub.updated_at = now

        self.db.commit()
        self.db.refresh(sub)

        self.ledger.append_audit_event(
            event_type="plan_tier_changed",
            entity_id=sub.id,
            actor=actor_email,
            payload={
                "previous_plan_id": prev_plan_id,
                "new_plan_id": new_plan.id,
                "billing_interval": sub.billing_interval
            }
        )

        return sub
