from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.database.session import get_db
from app.models.subscription import Subscription, BillingException, AuditEvent
from app.schemas.subscription import ExceptionOverrideRequest
from app.services.revenue_guard_engine import RevenueGuardIntegrityEngine
from app.services.evidence_ledger import CryptographicEvidenceLedger
from app.api.v1.deps import get_current_tenant_id, get_admin_user, get_current_user

router = APIRouter()

@router.post("/validate")
def validate_subscriptions_batch(
    billing_period: str = "2026-10",
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Executes RevenueGuard 6-checkpoint pre-invoice validation against all active subscriptions."""
    engine = RevenueGuardIntegrityEngine(db, tenant_id=tenant_id)
    subs = db.query(Subscription).filter(
        Subscription.tenant_id == tenant_id,
        Subscription.status.in_(["active", "trial", "past_due"])
    ).all()

    results = []
    ready_count = 0
    warning_count = 0
    blocked_count = 0

    for sub in subs:
        res = engine.validate_subscription_for_billing(sub.id, billing_period)
        results.append(res)
        if res["status"] == "ready":
            ready_count += 1
        elif res["status"] == "warning":
            warning_count += 1
        else:
            blocked_count += 1

    return {
        "billing_period": billing_period,
        "total_evaluated": len(subs),
        "ready_count": ready_count,
        "warning_count": warning_count,
        "blocked_count": blocked_count,
        "details": results
    }

@router.get("/exceptions")
def list_billing_exceptions(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Retrieve all open and overridden billing exceptions."""
    exceptions = db.query(BillingException).filter(
        BillingException.tenant_id == tenant_id
    ).order_by(BillingException.created_at.desc()).all()

    return exceptions

@router.post("/exceptions/{exc_id}/override")
def override_exception(
    exc_id: str,
    payload: ExceptionOverrideRequest,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    admin_user = Depends(get_admin_user)
):
    """Override a billing exception with required audit authorization."""
    engine = RevenueGuardIntegrityEngine(db, tenant_id=tenant_id)
    try:
        exc = engine.override_exception(
            exception_id=exc_id,
            reason=payload.notes,
            authorized_by=payload.authorized_by or admin_user.name
        )
        return {"message": "Exception overridden successfully", "id": exc.id, "status": exc.resolution_status}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/ledger/verify")
def verify_audit_ledger(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Verify cryptographic SHA-256 hash chaining integrity of the financial evidence ledger."""
    ledger = CryptographicEvidenceLedger(db, tenant_id=tenant_id)
    return ledger.verify_chain_integrity()
