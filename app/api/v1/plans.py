from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.database.session import get_db
from app.models.subscription import SubscriptionPlan
from app.api.v1.deps import get_current_tenant_id

router = APIRouter()

@router.get("/")
def list_plans(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Retrieve catalog plans for current tenant."""
    plans = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.tenant_id == tenant_id,
        SubscriptionPlan.is_archived == False
    ).all()

    if not plans:
        # Seed default plans if table empty for tenant
        default_plans = [
            SubscriptionPlan(
                id="plan-basic",
                tenant_id=tenant_id,
                code="starter",
                name="Starter Plan",
                description="Essential recurring billing and client management",
                monthly_price=799,
                annual_price=7990,
                trial_days=14,
                features=["Up to 50 active subscriptions", "Automated email dunning", "Razorpay integration"],
                limits={"sub_limit": 50}
            ),
            SubscriptionPlan(
                id="plan-pro",
                tenant_id=tenant_id,
                code="growth",
                name="Growth Pro",
                description="Comprehensive billing automation with predictive retention",
                monthly_price=2499,
                annual_price=24990,
                trial_days=14,
                features=["Up to 500 subscriptions", "RevenueGuard 6-checkpoint scanner", "AI Churn Predictor"],
                limits={"sub_limit": 500}
            ),
            SubscriptionPlan(
                id="plan-enterprise",
                tenant_id=tenant_id,
                code="enterprise",
                name="Enterprise Scale",
                description="Unlimited scale, multi-entity dunning, and cryptographic audit ledger",
                monthly_price=7999,
                annual_price=79990,
                trial_days=30,
                features=["Unlimited subscriptions", "Dedicated account engineer", "Cryptographic ledger export"],
                limits={"sub_limit": -1}
            ),
        ]
        db.add_all(default_plans)
        db.commit()
        plans = default_plans

    return [
        {
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "description": p.description,
            "monthly_price": p.monthly_price,
            "annual_price": p.annual_price,
            "trial_days": p.trial_days,
            "features": p.features,
            "limits": p.limits
        }
        for p in plans
    ]
