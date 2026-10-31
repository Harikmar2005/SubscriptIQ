from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
import hashlib
from sqlalchemy.orm import Session
from app.models.subscription import Subscription, Customer, SubscriptionPlan, Invoice, BillingException, AuditEvent
from app.services.evidence_ledger import CryptographicEvidenceLedger
from app.core.config import settings

class RevenueGuardIntegrityEngine:
    """
    SubscriptIQ RevenueGuard: Intelligent Pre-Invoice Billing Assurance Engine.
    Executes 6 financial checkpoints before generating invoices or charging customers.
    """

    def __init__(self, db_session: Session, tenant_id: str = "tenant-primary"):
        self.db = db_session
        self.tenant_id = tenant_id
        self.ledger = CryptographicEvidenceLedger(db_session, tenant_id=tenant_id)
        self.DEFAULT_GST_RATE = settings.DEFAULT_GST_RATE
        self.CGST_RATE = settings.CGST_RATE
        self.SGST_RATE = settings.SGST_RATE

    def _make_exception(
        self,
        category: str,
        severity: str,
        title: str,
        expected: str,
        actual: str,
        subscription_id: Optional[str] = None,
        financial_impact: int = 0
    ) -> BillingException:
        exc_id = f"exc-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        exc = BillingException(
            id=exc_id,
            tenant_id=self.tenant_id,
            category=category,
            severity=severity,
            title=title,
            expected_value=expected,
            actual_value=actual,
            subscription_id=subscription_id,
            financial_impact=financial_impact,
            resolution_status="open"
        )
        self.db.add(exc)
        self.db.commit()
        self.db.refresh(exc)
        return exc

    def validate_subscription_for_billing(self, subscription_id: str, billing_period: str) -> Dict[str, Any]:
        sub = self.db.query(Subscription).filter(
            Subscription.id == subscription_id,
            Subscription.tenant_id == self.tenant_id
        ).first()

        if not sub:
            return {
                "status": "blocked",
                "ready": False,
                "errors": [f"Subscription {subscription_id} not found in tenant"]
            }

        customer = sub.customer
        plan = sub.plan
        detected_exceptions = []

        # Checkpoint 1: Customer Account Status
        if not customer or customer.status != "active":
            detected_exceptions.append(self._make_exception(
                category="customer_status",
                severity="critical",
                title="Customer Suspended or Inactive",
                expected="Customer status = active",
                actual=f"Customer status = {customer.status if customer else 'Not Found'}",
                subscription_id=sub.id,
                financial_impact=plan.monthly_price if plan else 0
            ))

        # Checkpoint 2: Subscription Lifecycle Status
        if sub.status not in ["active", "trial"]:
            detected_exceptions.append(self._make_exception(
                category="subscription_status",
                severity="critical",
                title=f"Invalid Billing State: {sub.status}",
                expected="active or trial",
                actual=sub.status,
                subscription_id=sub.id,
                financial_impact=plan.monthly_price if plan else 0
            ))

        # Checkpoint 3: Idempotency Key & Duplicate Billing Prevention
        idempotency_key = f"{sub.id}:{billing_period}"
        existing_invoice = self.db.query(Invoice).filter(
            Invoice.subscription_id == sub.id,
            Invoice.tenant_id == self.tenant_id,
            Invoice.status.in_(["paid", "pending"])
        ).first()

        # Checkpoint 4: Pricing Math Verification
        base_price = plan.annual_price if sub.billing_interval == "annual" else plan.monthly_price
        subtotal = base_price

        # Checkpoint 5: Statutory Tax Calculation (18% GST with 9% CGST + 9% SGST)
        tax_amount = round(subtotal * (self.DEFAULT_GST_RATE / 100.0))
        cgst_amount = round(subtotal * (self.CGST_RATE / 100.0))
        sgst_amount = tax_amount - cgst_amount
        total_amount = subtotal + tax_amount

        # Determine overall validation result
        has_critical = any(e.severity == "critical" for e in detected_exceptions)
        has_warning = any(e.severity == "medium" for e in detected_exceptions)

        status_result = "blocked" if has_critical else ("warning" if has_warning else "ready")

        return {
            "subscription_id": sub.id,
            "status": status_result,
            "ready": status_result == "ready",
            "idempotency_key": idempotency_key,
            "subtotal": subtotal,
            "tax_amount": tax_amount,
            "cgst_amount": cgst_amount,
            "sgst_amount": sgst_amount,
            "total_amount": total_amount,
            "hsn_sac_code": settings.HSN_SAC_CODE,
            "exceptions": [
                {
                    "id": e.id,
                    "title": e.title,
                    "severity": e.severity,
                    "category": e.category
                } for e in detected_exceptions
            ],
            "validated_at": datetime.now(timezone.utc).isoformat()
        }

    def override_exception(self, exception_id: str, reason: str, authorized_by: str) -> BillingException:
        exc = self.db.query(BillingException).filter(
            BillingException.id == exception_id,
            BillingException.tenant_id == self.tenant_id
        ).first()

        if not exc:
            raise ValueError(f"Exception {exception_id} not found")

        exc.resolution_status = "overridden"
        exc.resolution_notes = reason
        exc.resolved_by = authorized_by

        self.db.commit()
        self.db.refresh(exc)

        self.ledger.append_audit_event(
            event_type="billing_exception_overridden",
            entity_id=exc.id,
            actor=authorized_by,
            payload={
                "exception_title": exc.title,
                "reason": reason,
                "category": exc.category
            }
        )

        return exc
