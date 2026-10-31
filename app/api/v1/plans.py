import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.subscription import SubscriptionPlan
from app.schemas.subscription import PlanCreate, PlanResponse
from app.core.security import get_current_user, CurrentUserContext, require_role

router = APIRouter()

@router.get("/", response_model=List[PlanResponse])
def get_plans(
    db: Session = Depends(get_db),
    current_user: CurrentUserContext = Depends(get_current_user)
):
    return db.query(SubscriptionPlan).filter(
        SubscriptionPlan.tenant_id == current_user.tenant_id,
        SubscriptionPlan.is_archived == False
    ).all()

@router.post("/", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    payload: PlanCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUserContext = Depends(require_role(["admin"]))
):
    plan = SubscriptionPlan(
        id=f"plan-{uuid.uuid4().hex[:6]}",
        tenant_id=current_user.tenant_id,
        name=payload.name,
        code=payload.code,
        description=payload.description,
        monthly_price=payload.monthly_price,
        annual_price=payload.annual_price,
        trial_days=payload.trial_days,
        features=payload.features,
        limits=payload.limits,
        is_archived=False
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan
