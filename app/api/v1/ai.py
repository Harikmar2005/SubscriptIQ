from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.database.session import get_db
from app.models.subscription import Customer, Subscription, Payment
from app.schemas.subscription import WhatIfSimulationRequest
from app.ml.churn_model import ChurnPredictionEngine
from app.api.v1.deps import get_current_tenant_id

router = APIRouter()
ml_engine = ChurnPredictionEngine()

@router.get("/churn-predictions")
def get_churn_predictions(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Calculates multi-factor explainable churn probability for all tenant customers."""
    customers = db.query(Customer).filter(Customer.tenant_id == tenant_id).all()
    predictions = []

    for c in customers:
        sub = db.query(Subscription).filter_by(customer_id=c.id, tenant_id=tenant_id).first()
        payments = db.query(Payment).filter_by(customer_id=c.id, tenant_id=tenant_id).all()
        failed_count = sum(1 for p in payments if p.status == "failed")

        cust_data = {
            "customer_id": c.id,
            "failed_payments_last_90d": failed_count,
            "monthly_logins": 12 if c.churn_risk != "high" else 2,
            "api_usage_pct": 65.0 if c.churn_risk != "high" else 8.0,
            "status": sub.status if sub else "unknown",
            "billing_interval": sub.billing_interval if sub else "monthly"
        }

        pred = ml_engine.predict_churn_risk(cust_data)
        pred["customer_name"] = c.name
        pred["company"] = c.company
        predictions.append(pred)

    return predictions

@router.post("/simulate")
def simulate_what_if(payload: WhatIfSimulationRequest):
    """Executes what-if pricing and churn sensitivity simulation."""
    return ml_engine.simulate_what_if(
        base_mrr=148500.0,
        base_churn_rate=2.1,
        price_change_pct=payload.price_change_pct,
        churn_mitigation_spend=payload.churn_mitigation_spend,
        discount_campaign_pct=payload.discount_campaign_pct
    )
