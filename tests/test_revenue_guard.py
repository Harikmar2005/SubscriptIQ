import unittest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.base import Base
from app.models.subscription import Customer, Subscription, SubscriptionPlan, Invoice, AuditEvent
from app.services.revenue_guard_engine import RevenueGuardIntegrityEngine
from app.services.evidence_ledger import CryptographicEvidenceLedger

class TestRevenueGuardAndCryptographicLedger(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        self.plan = SubscriptionPlan(
            id="plan-guard",
            tenant_id="tenant-primary",
            name="Shield Enterprise",
            code="shield",
            monthly_price=5000,
            annual_price=50000
        )
        self.active_customer = Customer(
            id="cust-act",
            tenant_id="tenant-primary",
            name="Active Corp",
            company="Active Corp Ltd",
            email="act@corp.com",
            phone="1122334455",
            status="active"
        )
        self.suspended_customer = Customer(
            id="cust-susp",
            tenant_id="tenant-primary",
            name="Suspended Corp",
            company="Suspended Ltd",
            email="susp@corp.com",
            phone="9988776655",
            status="suspended"
        )
        self.db.add_all([self.plan, self.active_customer, self.suspended_customer])
        self.db.commit()

        self.rg = RevenueGuardIntegrityEngine(self.db, tenant_id="tenant-primary")
        self.ledger = CryptographicEvidenceLedger(self.db, tenant_id="tenant-primary")

    def tearDown(self):
        self.db.close()

    def test_suspended_customer_invoice_generation_blocked(self):
        now = datetime.now(timezone.utc)
        sub = Subscription(
            id="sub-blocked-1",
            tenant_id="tenant-primary",
            customer_id="cust-susp",
            plan_id="plan-guard",
            status="active",
            billing_interval="monthly",
            current_period_start=now,
            current_period_end=now + timedelta(days=30)
        )
        self.db.add(sub)
        self.db.commit()

        validation = self.rg.validate_subscription_for_billing(sub.id, "2026-10")
        self.assertEqual(validation["status"], "blocked")
        self.assertFalse(validation["ready"])
        self.assertGreaterEqual(len(validation["exceptions"]), 1)

    def test_cryptographic_evidence_chain_integrity(self):
        # Append 3 sequential audit events
        e1 = self.ledger.append_audit_event("quote_created", "q-1", "sales_rep", {"price": 5000})
        e2 = self.ledger.append_audit_event("subscription_activated", "s-1", "customer", {"plan": "shield"})
        e3 = self.ledger.append_audit_event("payment_settled", "p-1", "gateway", {"amount": 5900})

        # Integrity check should pass
        res = self.ledger.verify_chain_integrity()
        self.assertTrue(res["valid"])
        self.assertEqual(res["count"], 3)

        # Intentionally tamper with event 2
        e2.previous_hash = "tampered_fake_previous_hash_00000000"
        self.db.commit()

        # Integrity check MUST detect the hash break
        res_tampered = self.ledger.verify_chain_integrity()
        self.assertFalse(res_tampered["valid"])
        self.assertEqual(res_tampered["tampered_id"], e2.id)

if __name__ == '__main__':
    unittest.main()
