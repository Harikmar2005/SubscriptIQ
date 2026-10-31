from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from app.database.session import get_db
from app.schemas.subscription import PaymentProcessRequest, RazorpayVerifyRequest
from app.services.payment_service import PaymentProcessingService
from app.core.security import verify_razorpay_signature, verify_webhook_signature
from app.core.config import settings
from app.api.v1.deps import get_current_user, get_current_tenant_id
from app.models.subscription import User, Payment

router = APIRouter()

@router.get("/")
def list_payments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """List all payment records strictly isolated to the authenticated tenant."""
    payments = db.query(Payment).filter(
        Payment.tenant_id == tenant_id
    ).order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id": p.id,
            "subscription_id": p.subscription_id,
            "customer_id": p.customer_id,
            "invoice_id": p.invoice_id,
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status,
            "gateway": p.gateway,
            "transaction_id": p.transaction_id,
            "idempotency_key": p.idempotency_key,
            "failure_reason": p.failure_reason,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in payments
    ]

@router.post("/create-order")
def create_payment_order(
    subscription_id: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """
    Creates an authoritative payment order on the backend.
    Calculates correct gross price from catalog + 18% statutory GST.
    Never exposes Razorpay secret keys to the client.
    """
    service = PaymentProcessingService(db, tenant_id=tenant_id)
    try:
        return service.create_order(subscription_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/process")
def process_payment(
    payload: PaymentProcessRequest,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user)
):
    """Process an idempotent payment with automatic invoice and balanced ledger."""
    service = PaymentProcessingService(db, tenant_id=tenant_id)
    try:
        result = service.process_payment(
            subscription_id=payload.subscription_id,
            customer_id=payload.customer_id,
            amount=payload.amount,
            payment_method=payload.payment_method,
            idempotency_key=payload.idempotency_key,
            force_failure=payload.force_failure,
            failure_reason=payload.failure_reason,
            actor_email=current_user.email
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    payment = result["payment"]
    invoice = result.get("invoice")

    return {
        "status": result["status"],
        "is_idempotent_replay": result["is_idempotent_replay"],
        "payment": {
            "id": payment.id,
            "amount": payment.amount,
            "status": payment.status,
            "transaction_id": payment.transaction_id,
            "invoice_id": payment.invoice_id
        },
        "invoice": {
            "id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "subtotal": invoice.subtotal,
            "tax_amount": invoice.tax_amount,
            "cgst_amount": invoice.cgst_amount,
            "sgst_amount": invoice.sgst_amount,
            "total_amount": invoice.total_amount
        } if invoice else None,
        "error": result.get("error")
    }

@router.post("/verify-signature")
def verify_signature(payload: RazorpayVerifyRequest):
    """Server-side verification of Razorpay HMAC-SHA256 signature."""
    is_valid = verify_razorpay_signature(
        payment_id=payload.razorpay_payment_id,
        order_id_or_sub_id=payload.razorpay_order_id_or_sub_id,
        signature=payload.razorpay_signature
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid Razorpay cryptographic signature")
    return {"verified": True, "message": "Signature verified successfully"}

@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    db: Session = Depends(get_db)
):
    """Receives and verifies Razorpay incoming webhooks using configured webhook secret."""
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header")

    body = await request.body()
    is_valid = verify_webhook_signature(body, x_razorpay_signature, settings.RAZORPAY_WEBHOOK_SECRET)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    # Payload verified
    return {"status": "received", "verified": True}
