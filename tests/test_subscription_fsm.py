import unittest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.base import Base
from app.models.subscription import Customer, Subscription, SubscriptionPlan, SubscriptionStatus
from app.services.subscription_service import SubscriptionLifecycleEngine

class TestSubscriptionLifecycleFSM(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        self.plan_basic = SubscriptionPlan(
            id="plan-basic",
            tenant_id="tenant-primary",
            name="Basic Plan",
            code="basic",
            monthly_price=799,
            annual_price=7990,
            trial_days=14
        )
        self.plan_pro = SubscriptionPlan(
            id="plan-pro",
            tenant_id="tenant-primary",
            name="Pro Plan",
            code="pro",
            monthly_price=2499,
            annual_price=24990,
            trial_days=14
        )
        self.customer = Customer(
            id="cust-1",
            tenant_id="tenant-primary",
            name="John Doe",
            company="Acme Inc",
            email="john@acme.com",
            phone="9876543210"
        )
        self.db.add_all([self.plan_basic, self.plan_pro, self.customer])
        self.db.commit()

        self.fsm = SubscriptionLifecycleEngine(self.db, tenant_id="tenant-primary")

    def tearDown(self):
        self.db.close()

    def test_trial_to_active_transition(self):
        class Payload:
            customer_id = "cust-1"
            plan_id = "plan-basic"
            billing_interval = "monthly"
            start_with_trial = True
            auto_renew = True

        sub = self.fsm.create(Payload())
        self.assertEqual(sub.status, SubscriptionStatus.TRIAL.value)

        # Transition TRIAL -> ACTIVE
        updated = self.fsm.transition_status(sub.id, SubscriptionStatus.ACTIVE.value)
        self.assertEqual(updated.status, SubscriptionStatus.ACTIVE.value)

    def test_active_to_past_due_activates_grace_period(self):
        class Payload:
            customer_id = "cust-1"
            plan_id = "plan-basic"
            billing_interval = "monthly"
            start_with_trial = False
            auto_renew = True

        sub = self.fsm.create(Payload())
        self.assertEqual(sub.status, SubscriptionStatus.ACTIVE.value)
        self.assertIsNone(sub.grace_period_end)

        # Transition ACTIVE -> PAST_DUE
        updated = self.fsm.transition_status(sub.id, SubscriptionStatus.PAST_DUE.value, reason="Card declined")
        self.assertEqual(updated.status, SubscriptionStatus.PAST_DUE.value)
        self.assertIsNotNone(updated.grace_period_end)
        # Check grace period is approximately 14 days in future
        now = datetime.now(timezone.utc)
        diff = updated.grace_period_end.replace(tzinfo=timezone.utc) - now
        self.assertGreaterEqual(diff.days, 13)

    def test_terminal_cancelled_state_rejects_resumption(self):
        class Payload:
            customer_id = "cust-1"
            plan_id = "plan-basic"
            billing_interval = "monthly"
            start_with_trial = False
            auto_renew = True

        sub = self.fsm.create(Payload())
        # Cancel subscription
        cancelled = self.fsm.transition_status(sub.id, SubscriptionStatus.CANCELLED.value, reason="Customer churned")
        self.assertEqual(cancelled.status, SubscriptionStatus.CANCELLED.value)

        # CANCELLED -> ACTIVE must be REJECTED by FSM
        with self.assertRaises(ValueError):
            self.fsm.transition_status(sub.id, SubscriptionStatus.ACTIVE.value)

    def test_illegal_trial_to_past_due_rejected(self):
        class Payload:
            customer_id = "cust-1"
            plan_id = "plan-basic"
            billing_interval = "monthly"
            start_with_trial = True
            auto_renew = True

        sub = self.fsm.create(Payload())
        # TRIAL -> PAST_DUE is invalid (trials cannot be past due)
        with self.assertRaises(ValueError):
            self.fsm.transition_status(sub.id, SubscriptionStatus.PAST_DUE.value)

if __name__ == '__main__':
    unittest.main()
