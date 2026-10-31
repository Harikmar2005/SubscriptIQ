import pytest
from app.ml.churn_model import ChurnPredictionEngine

def test_churn_prediction_high_risk():
    engine = ChurnPredictionEngine()
    customer_sample = {
        "customer_id": "cust-test-1",
        "failed_payments_last_90d": 2,
        "monthly_logins": 2,
        "api_usage_pct": 5.0,
        "status": "past_due",
        "billing_interval": "monthly"
    }
    prediction = engine.predict_churn_risk(customer_sample)
    assert prediction["churn_risk"] == "high"
    assert prediction["risk_score"] >= 65.0
    assert len(prediction["key_factors"]) >= 3

def test_churn_prediction_healthy():
    engine = ChurnPredictionEngine()
    customer_sample = {
        "customer_id": "cust-test-2",
        "failed_payments_last_90d": 0,
        "monthly_logins": 120,
        "api_usage_pct": 85.0,
        "status": "active",
        "billing_interval": "annual"
    }
    prediction = engine.predict_churn_risk(customer_sample)
    assert prediction["churn_risk"] == "low"
    assert prediction["health_score"] >= 80.0
