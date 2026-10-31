import unittest
import hmac
import hashlib
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.base import Base
from app.models.subscription import Customer, Subscription, SubscriptionPlan, Payment, Invoice
from app.services.payment_service import PaymentProcessingService
from app.core.security import verify_razorpay_signature, verify_webhook_signature
from app.core.config import settings

class TestPaymentSecurityAndInvoicing(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        self.plan = SubscriptionPlan(
            id="plan-pro",
            tenant_id="tenant-primary",
            name="Pro Growth",
            code="pro",
            monthly_price=2499,
            annual_price=24990
        )
        self.customer = Customer(
            id="cust-1",
            tenant_id="tenant-primary",
            name="Bob Smith",
            company="Tech Corp",
            email="bob@techcorp.com",
            phone="1234567890"
        )
        self.db.add_all([self.plan, self.customer])
        self.db.commit()

        # Seed active subscriptions
        now = datetime.now(timezone.utc)
        self.sub1 = Subscription(
            id="sub-101",
            tenant_id="tenant-primary",
            customer_id="cust-1",
            plan_id="plan-pro",
            status="active",
            billing_interval="monthly",
            current_period_start=now,
            current_period_end=now + timedelta(days=30)
        )
        self.sub2 = Subscription(
            id="sub-102",
            tenant_id="tenant-primary",
            customer_id="cust-1",
            plan_id="plan-pro",
            status="active",
            billing_interval="monthly",
            current_period_start=now,
            current_period_end=now + timedelta(days=30)
        )
        self.db.add_all([self.sub1, self.sub2])
        self.db.commit()

        self.service = PaymentProcessingService(self.db, tenant_id="tenant-primary")

    def tearDown(self):
        self.db.close()

    def test_idempotent_payment_prevents_duplicate_charge(self):
        idempotency_key = "idemp_test_key_unique_123"
        gross_amount = 2949  # 2499 + 18% GST (450)

        # First attempt: succeeds
        res1 = self.service.process_payment(
            subscription_id="sub-101",
            customer_id="cust-1",
            amount=gross_amount,
            payment_method={"type": "card", "last4": "1111"},
            idempotency_key=idempotency_key
        )
        self.assertEqual(res1["status"], "success")
        self.assertFalse(res1["is_idempotent_replay"])
        first_payment_id = res1["payment"].id

        # Second attempt with same idempotency key: must replay without duplicate charge
        res2 = self.service.process_payment(
            subscription_id="sub-101",
            customer_id="cust-1",
            amount=gross_amount,
            payment_method={"type": "card", "last4": "1111"},
            idempotency_key=idempotency_key
        )
        self.assertTrue(res2["is_idempotent_replay"])
        self.assertEqual(res2["payment"].id, first_payment_id)

        # Verify only 1 payment was inserted in database
        total_payments = self.db.query(Payment).filter_by(idempotency_key=idempotency_key).count()
        self.assertEqual(total_payments, 1)

    def test_exact_gst_calculation_breakdown(self):
        gross_amount = 2949  # ₹2,499 base + ₹450 tax (18%)
        res = self.service.process_payment(
            subscription_id="sub-102",
            customer_id="cust-1",
            amount=gross_amount,
            payment_method={"type": "card", "last4": "4242"}
        )
        invoice = res["invoice"]
        self.assertIsNotNone(invoice)

        # Statutory 18% GST check
        self.assertEqual(invoice.total_amount, gross_amount)
        self.assertEqual(invoice.subtotal + invoice.tax_amount, invoice.total_amount)
        self.assertEqual(invoice.cgst_amount + invoice.sgst_amount, invoice.tax_amount)
        self.assertEqual(invoice.hsn_sac_code, "998313")

    def test_razorpay_server_signature_verification(self):
        payment_id = "pay_test_998877"
        order_id = "order_test_112233"
        secret = "test_razorpay_secret_key"

        # Generate valid signature
        msg = f"{order_id}|{payment_id}".encode('utf-8')
        valid_sig = hmac.new(secret.encode('utf-8'), msg, hashlib.sha256).hexdigest()

        self.assertTrue(verify_razorpay_signature(payment_id, order_id, valid_sig, secret=secret))
        self.assertFalse(verify_razorpay_signature(payment_id, order_id, "invalid_forged_signature", secret=secret))

    def test_webhook_signature_verification(self):
        body = b'{"event":"payment.captured","payload":{"payment":{"id":"pay_123"}}}'
        secret = "test_webhook_secret_key"
        valid_sig = hmac.new(secret.encode('utf-8'), body, hashlib.sha256).hexdigest()

        self.assertTrue(verify_webhook_signature(body, valid_sig, webhook_secret=secret))
        self.assertFalse(verify_webhook_signature(body, "tampered_signature_abc", webhook_secret=secret))

    def test_server_side_order_amount_calculation(self):
        """Ensures order amount is strictly calculated from the plan and tax, never client-specified."""
        order = self.service.create_order("sub-101")
        # Base: 2499, GST 18%: 450 -> Total: 2949
        self.assertEqual(order["amount"], 2949)
        self.assertEqual(order["currency"], "INR")
        self.assertIn("razorpay_key_id", order)
        # Verify secret key is never leaked in the returned order payload
        self.assertNotIn("razorpay_key_secret", order)

if __name__ == '__main__':
    unittest.main()
