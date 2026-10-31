import unittest
from app.ml.churn_model import ChurnPredictionEngine

class TestAIChurnEngine(unittest.TestCase):
    def setUp(self):
        self.engine = ChurnPredictionEngine()

    def test_churn_score_bounds_and_risk_tiers(self):
        # Extreme high-risk profile: multiple payment failures, inactive, past due
        high_risk_data = {
            "customer_id": "cust-risk-1",
            "failed_payments_last_90d": 3,
            "monthly_logins": 1,
            "api_usage_pct": 2.0,
            "status": "past_due",
            "billing_interval": "monthly"
        }
        res_high = self.engine.predict_churn_risk(high_risk_data)
        self.assertGreaterEqual(res_high["risk_score"], 65.0)
        self.assertEqual(res_high["churn_risk"], "high")
        self.assertLessEqual(res_high["risk_score"], 95.0)  # Bound check
        self.assertGreaterEqual(len(res_high["key_factors"]), 2)

        # Stable enterprise profile: zero failures, high engagement, annual contract
        low_risk_data = {
            "customer_id": "cust-stable-1",
            "failed_payments_last_90d": 0,
            "monthly_logins": 85,
            "api_usage_pct": 78.0,
            "status": "active",
            "billing_interval": "annual"
        }
        res_low = self.engine.predict_churn_risk(low_risk_data)
        self.assertLess(res_low["risk_score"], 35.0)
        self.assertEqual(res_low["churn_risk"], "low")
        self.assertGreaterEqual(res_low["risk_score"], 5.0)  # Lower bound check

    def test_what_if_simulation_elasticity(self):
        sim = self.engine.simulate_what_if(
            base_mrr=100000.0,
            base_churn_rate=3.0,
            price_change_pct=10.0,
            churn_mitigation_spend=50000.0,
            discount_campaign_pct=5.0
        )
        self.assertIn("projected_mrr", sim)
        self.assertIn("projected_churn_rate", sim)
        self.assertIsInstance(sim["net_mrr_impact"], float)

if __name__ == '__main__':
    unittest.main()
