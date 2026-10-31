from datetime import datetime, timezone
from typing import Dict, Any, List

class ChurnPredictionEngine:
    """
    Multi-feature behavioral churn estimator.
    Analyzes customer tenure, payment friction, usage velocity, and renewal timing.
    """
    def __init__(self):
        self.weights = {
            "payment_failure_frequency": 0.35,
            "login_frequency_deficit": 0.25,
            "api_quota_underutilization": 0.15,
            "past_due_status_penalty": 0.15,
            "annual_contract_discount": -0.10
        }

    def predict_churn_risk(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        failed_payments = customer_data.get("failed_payments_last_90d", 0)
        monthly_logins = customer_data.get("monthly_logins", 10)
        api_usage_pct = customer_data.get("api_usage_pct", 50.0)
        is_past_due = customer_data.get("status") == "past_due"
        is_annual = customer_data.get("billing_interval") == "annual"

        # Calculate composite churn probability (0 - 100)
        risk_score = 15.0
        factors: List[str] = []

        if failed_payments > 0:
            risk_score += min(50.0, failed_payments * 25.0)
            factors.append(f"{failed_payments} failed recurring payment attempts")

        if is_past_due:
            risk_score += 30.0
            factors.append("Account currently past due in active dunning")

        if monthly_logins < 5:
            risk_score += 25.0
            factors.append("Severe user inactivity (< 5 logins/month)")
        elif monthly_logins > 60:
            risk_score -= 10.0
            factors.append("High daily user engagement")

        if api_usage_pct < 10.0:
            risk_score += 15.0
            factors.append("Low feature adoption (< 10% API quota used)")

        if is_annual:
            risk_score -= 15.0
            factors.append("Locked into annual recurring contract")

        risk_score = max(5.0, min(95.0, risk_score))
        health_score = max(5.0, min(98.0, 100.0 - risk_score))

        if risk_score >= 65.0:
            risk_tier = "high"
            action = "Dispatch immediate customer success intervention; offer 15% retention credit."
        elif risk_score >= 35.0:
            risk_tier = "medium"
            action = "Send feature onboarding tips and schedule executive health check."
        else:
            risk_tier = "low"
            action = "Account is highly stable. Eligible for Annual contract conversion."

        return {
            "customer_id": customer_data.get("customer_id", "unknown"),
            "churn_risk": risk_tier,
            "risk_score": round(risk_score, 1),
            "health_score": round(health_score, 1),
            "key_factors": factors,
            "recommended_action": action,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
