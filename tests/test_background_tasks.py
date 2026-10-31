import unittest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.base import Base
from app.models.subscription import Customer, Subscription, SubscriptionPlan, Invoice, Payment
from app.core.celery_worker import (
    run_automated_renewals,
    run_revenue_guard_scanner,
    execute_renewal_batch_job,
    acquire_task_lock,
    release_task_lock
)

class TestCeleryBackgroundTasks(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        # Seed plan and customer
        self.plan = SubscriptionPlan(
            id="plan-auto-renew",
            tenant_id="tenant-primary",
            name="Cloud Standard",
            code="standard",
            monthly_price=1500,
            annual_price=15000
        )
        self.cust = Customer(
            id="cust-auto-1",
            tenant_id="tenant-primary",
            name="Charlie Auto",
            company="Automate LLC",
            email="charlie@automate.com",
            phone="1122334455"
        )
        self.db.add_all([self.plan, self.cust])
        self.db.commit()

        # Seed subscription expiring in 2 days (within 7-day renewal window)
        now = datetime.now(timezone.utc)
        self.expiring_sub = Subscription(
            id="sub-expiring-1",
            tenant_id="tenant-primary",
            customer_id="cust-auto-1",
            plan_id="plan-auto-renew",
            status="active",
            billing_interval="monthly",
            current_period_start=now - timedelta(days=28),
            current_period_end=now + timedelta(days=2),
            auto_renew=True
        )
        self.db.add(self.expiring_sub)
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_renewal_batch_task_executes_real_renewal(self):
        """Verifies scheduled renewal actually charges expiring subscription, generates invoice, and advances cycle."""
        initial_end = self.expiring_sub.current_period_end
        result = execute_renewal_batch_job(tenant_id="tenant-primary", db_session=self.db)

        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["processed"], 1)
        self.assertEqual(result["success"], 1)
        self.assertEqual(result["failed"], 0)

        # Refresh subscription and verify renewal advanced end date
        self.db.refresh(self.expiring_sub)
        self.assertTrue(self.expiring_sub.current_period_end > initial_end)

        # Verify payment record and invoice were created in DB
        payment = self.db.query(Payment).filter_by(subscription_id=self.expiring_sub.id).first()
        self.assertIsNotNone(payment)
        self.assertEqual(payment.status, "success")

        invoice = self.db.query(Invoice).filter_by(id=payment.invoice_id).first()
        self.assertIsNotNone(invoice)
        self.assertEqual(invoice.status, "paid")

    def test_duplicate_task_execution_prevention(self):
        """Ensures task lock prevents simultaneous duplicate runs of the renewal batch."""
        lock_name = "test_lock_unique_abc"
        self.assertTrue(acquire_task_lock(lock_name))
        # Second acquire must fail
        self.assertFalse(acquire_task_lock(lock_name))
        release_task_lock(lock_name)
        # After release, acquire succeeds again
        self.assertTrue(acquire_task_lock(lock_name))
        release_task_lock(lock_name)

    def test_run_revenue_guard_scanner_execution(self):
        result = run_revenue_guard_scanner()
        self.assertIsInstance(result, dict)
        self.assertEqual(result["status"], "completed")

if __name__ == '__main__':
    unittest.main()
