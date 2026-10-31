import os
from pydantic import BaseModel
from typing import List

class Settings(BaseModel):
    PROJECT_NAME: str = "SubFlow Enterprise Subscription Engine"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "subflow_enterprise_jwt_secret_key_2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://subflow_user:subflow_password@localhost:5432/subflow_enterprise"
    )
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_simulated_key")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "rzp_test_simulated_secret")
    CORS_ORIGINS: List[str] = ["*"]
    DEFAULT_GST_RATE: float = 0.18 # 18% Integrated GST

settings = Settings()
