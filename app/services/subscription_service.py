import uuid
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional

try:
    from sqlalchemy.orm import Session
except ImportError:
    Session = Any

try:
    from fastapi import HTTPException, status
except ImportError:
    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail
    status = type('Status', (), {'HTTP_400_BAD_REQUEST': 400, 'HTTP_404_NOT_FOUND': 404})

from app.models.subscription import (
    Customer,
    SubscriptionPlan,
    Subscription,
    SubscriptionStatus,
    BillingInterval,
    Payment,
    PaymentStatus,
    Invoice,
    FinancialLedger,
    SubscriptionHistory,
    AuditLog
)

class SubscriptionLifecycleEngine:
    VALID_TRANSITIONS = {
        "trial": ["active", "expired", "cancelled"],
        "active": ["past_due", "paused", "cancelled", "expired", "active"],
        "past_due": ["active", "cancelled", "expired"],
        "paused": ["active", "cancelled", "expired"],
        "cancelled": [], # Terminal state
        "expired": ["active"],
    }

    def __init__(self, db: Optional[Session] = None, tenant_id: str = "tenant-subscriptiq-india"):
        self.db = db
        self.tenant_id = tenant_id

    @staticmethod
    def calculate_gst_breakdown(gross_amount: Decimal) -> Dict[str, Decimal]:
        """
        Calculates statutory 18% GST with exact decimal arithmetic.
        SAC 998313 Information Technology Software Subscription Services.
        """
        # subtotal = gross / 1.18
        divisor = Decimal("1.18")
        subtotal = (gross_amount / divisor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_tax = gross_amount - subtotal
        cgst = (total_tax / Decimal("2")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        sgst = total_tax - cgst

        return {
            "gross_amount": gross_amount,
            "subtotal": subtotal,
            "total_tax": total_tax,
            "cgst": cgst,
            "sgst": sgst,
            "tax_rate_pct": Decimal("18.00"),
            "sac_code": "998313",
        }

    # 1. State Machine Transitions
    def validate_transition(self, current_status: SubscriptionStatus, new_status: SubscriptionStatus):
        valid = self.VALID_TRANSITIONS.get(current_status.value if hasattr(current_status, 'value') else current_status, [])
        target = new_status.value if hasattr(new_status, 'value') else new_status
        if current_status != new_status and target not in valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Illegal subscription state machine transition from '{current_status}' to '{new_status}'."
            )

    # 2. Idempotent Payment Processing & Double-Entry Ledger
    def process_payment(
        self,
        subscription_id: str,
        customer_id: str,
        amount: int,
        payment_method: Dict[str, Any],
        idempotency_key: Optional[str] = None,
        force_failure: bool = False,
        failure_reason: Optional[str] = None
    ) -> Dict[str, Any]:
        # Idempotency Check
        if idempotency_key:
            existing = self.db.query(Payment).filter(
                Payment.tenant_id == self.tenant_id,
                Payment.idempotency_key == idempotency_key
            ).first()
            if existing:
                # Return previously processed transaction without re-charging
                invoice = self.db.query(Invoice).filter(Invoice.id == existing.invoice_id).first() if existing.invoice_id else None
                return {
                    "payment": existing,
                    "invoice": invoice,
                    "is_idempotent_replay": True
                }

        sub = self.db.query(Subscription).filter(
            Subscription.tenant_id == self.tenant_id,
            Subscription.id == subscription_id
        ).first()
        customer = self.db.query(Customer).filter(
            Customer.tenant_id == self.tenant_id,
            Customer.id == customer_id
        ).first()

        if not sub or not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription or Customer not found")

        plan = self.db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
        now = datetime.now(timezone.utc)
        tx_id = f"pay_rzp_sim_{uuid.uuid4().hex[:12]}"
        is_success = not force_failure

        payment = Payment(
            id=f"pay-{uuid.uuid4().hex[:8]}",
            tenant_id=self.tenant_id,
            subscription_id=subscription_id,
            customer_id=customer_id,
            amount=amount,
            currency="INR",
            status=PaymentStatus.SUCCESS if is_success else PaymentStatus.FAILED,
            payment_method=payment_method,
            gateway="razorpay_simulated",
            transaction_id=tx_id,
            idempotency_key=idempotency_key,
            failure_reason=None if is_success else (failure_reason or "Card issuer declined: Insufficient funds."),
            reconciled=is_success
        )
        self.db.add(payment)

        invoice = None
        if is_success:
            # 18% Integrated GST calculation
            subtotal = int(amount / 1.18)
            tax_amount = amount - subtotal
            cgst = tax_amount // 2
            sgst = tax_amount - cgst

            inv_number = f"INV-2026-{uuid.uuid4().hex[:5].upper()}"
            invoice = Invoice(
                id=f"inv-{uuid.uuid4().hex[:8]}",
                tenant_id=self.tenant_id,
                invoice_number=inv_number,
                subscription_id=subscription_id,
                customer_id=customer_id,
                payment_id=payment.id,
                subtotal=subtotal,
                tax_amount=tax_amount,
                cgst_amount=cgst,
                sgst_amount=sgst,
                total_amount=amount,
                currency="INR",
                status="paid",
                issue_date=now,
                due_date=now,
                paid_at=now,
                billing_period_start=now,
                billing_period_end=now + (timedelta(days=365) if sub.billing_interval == BillingInterval.ANNUAL else timedelta(days=30)),
                items=[{
                    "id": f"item-{uuid.uuid4().hex[:6]}",
                    "description": f"{plan.name if plan else 'Subscription'} ({sub.billing_interval.value})",
                    "quantity": 1,
                    "unit_price": subtotal,
                    "total": subtotal,
                    "hsn_sac": "998313"
                }]
            )
            self.db.add(invoice)
            payment.invoice_id = invoice.id

            # Advance billing cycle
            sub.status = SubscriptionStatus.ACTIVE
            sub.current_period_start = now
            sub.current_period_end = now + (timedelta(days=365) if sub.billing_interval == BillingInterval.ANNUAL else timedelta(days=30))
            sub.failed_retry_count = 0
            sub.grace_period_end = None

            # Double-Entry Balanced Ledger Entries
            # 1. Debit Cash/Gateway Asset
            self.db.add(FinancialLedger(
                id=f"led-{uuid.uuid4().hex[:8]}",
                tenant_id=self.tenant_id,
                transaction_id=tx_id,
                entry_type="debit",
                account_name="Cash/Razorpay Gateway",
                amount=amount,
                reference_id=invoice.id,
                description=f"Payment settlement for {customer.company}"
            ))
            # 2. Credit Subscription Revenue
            self.db.add(FinancialLedger(
                id=f"led-{uuid.uuid4().hex[:8]}",
                tenant_id=self.tenant_id,
                transaction_id=tx_id,
                entry_type="credit",
                account_name="Subscription Revenue",
                amount=subtotal,
                reference_id=invoice.id,
                description=f"Net SaaS subscription revenue recognized"
            ))
            # 3. Credit GST Output Liability
            self.db.add(FinancialLedger(
                id=f"led-{uuid.uuid4().hex[:8]}",
                tenant_id=self.tenant_id,
                transaction_id=tx_id,
                entry_type="credit",
                account_name="GST Output Liability",
                amount=tax_amount,
                reference_id=invoice.id,
                description=f"18% GST collected for statutory remittance"
            ))

            # Audit History
            self.db.add(SubscriptionHistory(
                id=f"hist-{uuid.uuid4().hex[:8]}",
                tenant_id=self.tenant_id,
                subscription_id=sub.id,
                customer_id=customer.id,
                event_type="payment_succeeded",
                details=f"Payment of ₹{amount} succeeded. Invoice {invoice.invoice_number} generated."
            ))
        else:
            # Payment Failure & Grace Period Handling
            sub.status = SubscriptionStatus.PAST_DUE
            sub.failed_retry_count = (sub.failed_retry_count or 0) + 1
            # 14-day grace period
            sub.grace_period_end = now + timedelta(days=14)

            self.db.add(SubscriptionHistory(
                id=f"hist-{uuid.uuid4().hex[:8]}",
                tenant_id=self.tenant_id,
                subscription_id=sub.id,
                customer_id=customer.id,
                event_type="payment_failed",
                details=f"Payment attempt failed: {payment.failure_reason}. Grace period active until {sub.grace_period_end.strftime('%Y-%m-%d')}."
            ))

        self.db.commit()
        return {"payment": payment, "invoice": invoice, "is_idempotent_replay": False}
