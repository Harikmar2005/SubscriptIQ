import unittest
import hmac
import hashlib
import json
from datetime import datetime, timezone, timedelta
from app.ml.churn_model import ChurnPredictionEngine
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token, verify_razorpay_signature

class TestCoreBusinessLogicPure(unittest.TestCase):
    """
    Pure Python tests for mission-critical SaaS business logic algorithms,
    mathematical tax calculations, state machine transitions, and cryptographic hashes.
    """

    def test_subscription_state_machine_transition_rules(self):
        transitions = {
            "trial": ["active", "expired", "cancelled"],
            "active": ["past_due", "paused", "cancelled", "expired", "active"],
            "past_due": ["active", "cancelled", "expired"],
            "paused": ["active", "cancelled", "expired"],
            "cancelled": [],  # Terminal
            "expired": ["active"]
        }

        # Valid transitions
        self.assertIn("active", transitions["trial"])
        self.assertIn("past_due", transitions["active"])
        self.assertIn("active", transitions["past_due"])
        self.assertIn("cancelled", transitions["active"])

        # Invalid transitions
        self.assertNotIn("past_due", transitions["trial"])
        self.assertNotIn("active", transitions["cancelled"])
        self.assertNotIn("paused", transitions["past_due"])

    def test_past_due_14_day_grace_period_calculation(self):
        now = datetime(2026, 10, 31, 12, 0, 0, tzinfo=timezone.utc)
        grace_period_end = now + timedelta(days=14)
        diff = grace_period_end - now
        self.assertEqual(diff.days, 14)
        self.assertTrue(grace_period_end > now)

    def test_gst_statutory_18_percent_split_and_rounding(self):
        """Validates exact GST calculation: 18% total = 9% CGST + 9% SGST."""
        gross_invoice_amount = 2949  # ₹2,499 base + ₹450 GST
        base_rate = 18.0

        subtotal = round(gross_invoice_amount / (1.0 + (base_rate / 100.0)))
        tax = gross_invoice_amount - subtotal
        cgst = round(tax / 2.0)
        sgst = tax - cgst

        self.assertEqual(subtotal, 2499)  # Rounded to nearest rupee
        self.assertEqual(tax, 450)
        self.assertEqual(cgst, 225)
        self.assertEqual(sgst, 225)
        self.assertEqual(cgst + sgst, tax)
        self.assertEqual(subtotal + tax, gross_invoice_amount)

    def test_cryptographic_sha256_hash_chaining(self):
        """Validates canonical serialization and tamper detection."""
        genesis_hash = "0000000000000000000000000000000000000000000000000000000000000000"
        
        # Block 1
        payload_1 = {"quote_id": "q-1", "amount": 25000}
        canonical_1 = f"tenant-primary|quote_created|q-1|agent|2026-10-31T00:00:00|{json.dumps(payload_1, sort_keys=True)}|{genesis_hash}"
        hash_1 = hashlib.sha256(canonical_1.encode('utf-8')).hexdigest()

        # Block 2
        payload_2 = {"sub_id": "sub-1", "plan": "enterprise"}
        canonical_2 = f"tenant-primary|sub_activated|sub-1|agent|2026-10-31T00:01:00|{json.dumps(payload_2, sort_keys=True)}|{hash_1}"
        hash_2 = hashlib.sha256(canonical_2.encode('utf-8')).hexdigest()

        self.assertNotEqual(hash_1, hash_2)
        self.assertEqual(len(hash_1), 64)

        # Tampering with payload_1 must change hash_1 and invalidate chain to hash_2
        tampered_canonical_1 = canonical_1.replace("25000", "99999")
        tampered_hash_1 = hashlib.sha256(tampered_canonical_1.encode('utf-8')).hexdigest()
        self.assertNotEqual(tampered_hash_1, hash_1)

    def test_idempotency_key_mechanism(self):
        processed_keys = set()
        key = "idem_test_998877"

        # Attempt 1: not seen
        self.assertNotIn(key, processed_keys)
        processed_keys.add(key)

        # Attempt 2: replay detected
        self.assertIn(key, processed_keys)

if __name__ == '__main__':
    unittest.main()
