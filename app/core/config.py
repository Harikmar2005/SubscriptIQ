import os
from typing import List, Optional, Dict, Any

try:
    from pydantic_settings import BaseSettings
    from pydantic import Field, field_validator, model_validator

    class Settings(BaseSettings):
        ENVIRONMENT: str = Field(default="production")
        
        # Security & JWT
        SECRET_KEY: str = Field(default="enterprise_production_jwt_secret_key_minimum_32_characters_long_2026")
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
        
        # PostgreSQL Configuration
        POSTGRES_USER: str = Field(default="subflow_user")
        POSTGRES_PASSWORD: str = Field(default="subflow_password")
        POSTGRES_DB: str = Field(default="subflow_enterprise")
        POSTGRES_HOST: str = Field(default="localhost")
        POSTGRES_PORT: int = Field(default=5432)
        DATABASE_URL: Optional[str] = Field(default=None)

        # Cache & Message Broker (Redis)
        REDIS_URL: str = Field(default="redis://localhost:6379/0")

        # Payment Gateway (Razorpay)
        RAZORPAY_KEY_ID: str = Field(default="rzp_test_simulated_key")
        RAZORPAY_KEY_SECRET: str = Field(default="rzp_test_simulated_secret")
        RAZORPAY_WEBHOOK_SECRET: str = Field(default="rzp_webhook_secret_key")
        IS_RAZORPAY_TEST_MODE: bool = Field(default=True)

        # Application Metadata & Routing
        PROJECT_NAME: str = "SubscriptIQ Enterprise"
        VERSION: str = "2.5.0"
        API_V1_STR: str = "/api/v1"
        CORS_ORIGINS: List[str] = [
            "http://localhost:3000",
            "http://0.0.0.0:3000",
            "http://127.0.0.1:3000",
            "*"
        ]

        # Statutory Tax Configuration (18% GST)
        DEFAULT_GST_RATE: float = 18.0
        CGST_RATE: float = 9.0
        SGST_RATE: float = 9.0
        HSN_SAC_CODE: str = "998313"

        @model_validator(mode="after")
        def validate_database_and_secrets(self) -> 'Settings':
            # Construct DATABASE_URL consistently from Postgres credentials if not explicitly provided
            if not self.DATABASE_URL:
                self.DATABASE_URL = f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            
            # Enforce strict secret key requirements in production
            if self.ENVIRONMENT == "production":
                if not self.SECRET_KEY or len(self.SECRET_KEY) < 32:
                    raise ValueError("SECRET_KEY must be at least 32 characters long in production environments")
            return self

        class Config:
            env_file = ".env"
            extra = "ignore"

    settings = Settings()

except Exception:
    # Graceful fallback using standard os.environ with dynamic DATABASE_URL construction
    class SettingsFallback:
        ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
        SECRET_KEY = os.getenv("SECRET_KEY", "enterprise_production_jwt_secret_key_minimum_32_characters_long_2026")
        ALGORITHM = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

        POSTGRES_USER = os.getenv("POSTGRES_USER", "subflow_user")
        POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "subflow_password")
        POSTGRES_DB = os.getenv("POSTGRES_DB", "subflow_enterprise")
        POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
        POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))

        DATABASE_URL = os.getenv("DATABASE_URL")
        if not DATABASE_URL:
            DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

        REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_simulated_key")
        RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "rzp_test_simulated_secret")
        RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "rzp_webhook_secret_key")
        IS_RAZORPAY_TEST_MODE = os.getenv("IS_RAZORPAY_TEST_MODE", "true").lower() in ("true", "1")

        PROJECT_NAME = "SubscriptIQ Enterprise"
        VERSION = "2.5.0"
        API_V1_STR = "/api/v1"
        CORS_ORIGINS = ["http://localhost:3000", "http://0.0.0.0:3000", "http://127.0.0.1:3000", "*"]

        DEFAULT_GST_RATE = 18.0
        CGST_RATE = 9.0
        SGST_RATE = 9.0
        HSN_SAC_CODE = "998313"

    settings = SettingsFallback()

def get_masked_settings() -> Dict[str, Any]:
    """Returns application configuration with sensitive credentials securely redacted for logs."""
    return {
        "ENVIRONMENT": settings.ENVIRONMENT,
        "SECRET_KEY": "***REDACTED***" if settings.SECRET_KEY else "MISSING",
        "POSTGRES_USER": settings.POSTGRES_USER,
        "POSTGRES_DB": settings.POSTGRES_DB,
        "DATABASE_URL": f"postgresql://{settings.POSTGRES_USER}:***@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}",
        "REDIS_URL": settings.REDIS_URL,
        "RAZORPAY_KEY_ID": settings.RAZORPAY_KEY_ID,
        "RAZORPAY_KEY_SECRET": "***REDACTED***",
        "RAZORPAY_WEBHOOK_SECRET": "***REDACTED***",
        "IS_RAZORPAY_TEST_MODE": settings.IS_RAZORPAY_TEST_MODE,
        "VERSION": settings.VERSION
    }
