from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.subscription import Payment
from app.schemas.subscription import PaymentProcessRequest, PaymentResponse
from app.services.subscription_service import SubscriptionLifecycleEngine
from app.core.security import get_current_user, CurrentUserContext

router = APIRouter()

@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    db: Session = Depends(get_db),
    current_user: CurrentUserContext = Depends(get_current_user)
):
    query = db.query(Payment).filter(Payment.tenant_id == current_user.tenant_id)
    if current_user.role == "customer" and current_user.customer_id:
        query = query.filter(Payment.customer_id == current_user.customer_id)
    return query.order_by(Payment.created_at.desc()).all()

@router.post("/process")
def process_payment(
    payload: PaymentProcessRequest,
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
    db: Session = Depends(get_db),
    current_user: CurrentUserContext = Depends(get_current_user)
):
    """
    Process payment with idempotency protection and double-entry ledger update
    """
    engine = SubscriptionLifecycleEngine(db, current_user.tenant_id)
    result = engine.process_payment(
        subscription_id=payload.subscription_id,
        customer_id=payload.customer_id,
        amount=payload.amount,
        payment_method=payload.payment_method,
        idempotency_key=x_idempotency_key,
        force_failure=payload.force_failure,
        failure_reason=payload.failure_reason
    )
    return {
        "payment_id": result["payment"].id,
        "status": result["payment"].status.value,
        "transaction_id": result["payment"].transaction_id,
        "amount": result["payment"].amount,
        "invoice_number": result["invoice"].invoice_number if result["invoice"] else None,
        "is_idempotent_replay": result["is_idempotent_replay"]
    }
