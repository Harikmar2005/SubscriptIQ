from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class CustomerBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    company: str
    address: Optional[str] = None
    city: Optional[str] = None
    tax_id: Optional[str] = None
    status: str = "active"

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PlanBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    monthly_price: int
    annual_price: int
    trial_days: int = 14
    features: List[str]
    limits: Dict[str, Any]

class PlanCreate(PlanBase):
    pass

class PlanResponse(PlanBase):
    id: str
    is_archived: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SubscriptionCreate(BaseModel):
    customer_id: str
    plan_id: str
    billing_interval: str = "monthly"
    start_with_trial: bool = False
    auto_renew: bool = True

class SubscriptionUpgrade(BaseModel):
    new_plan_id: str
    billing_interval: Optional[str] = None

class SubscriptionResponse(BaseModel):
    id: str
    customer_id: str
    plan_id: str
    status: str
    billing_interval: str
    current_period_start: datetime
    current_period_end: datetime
    trial_end: Optional[datetime] = None
    auto_renew: bool
    cancellation_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PaymentProcessRequest(BaseModel):
    subscription_id: str
    customer_id: str
    amount: int
    payment_method: Dict[str, Any]
    force_failure: bool = False
    failure_reason: Optional[str] = None

class PaymentResponse(BaseModel):
    id: str
    subscription_id: str
    customer_id: str
    amount: int
    status: str
    transaction_id: str
    failure_reason: Optional[str] = None
    invoice_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
