from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    tenant_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    role: str = "admin"
    tenant_id: str = "tenant-primary"

class CustomerBase(BaseModel):
    name: str
    company: str
    email: EmailStr
    phone: str
    address: Optional[str] = None
    tax_id: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    status: Optional[str] = None

class SubscriptionCreate(BaseModel):
    customer_id: str
    plan_id: str
    billing_interval: str = "monthly"  # monthly or annual
    start_with_trial: bool = True
    auto_renew: bool = True

class SubscriptionUpgrade(BaseModel):
    new_plan_id: str
    billing_interval: Optional[str] = None

class SubscriptionStatusTransition(BaseModel):
    status: str
    reason: Optional[str] = None

class PaymentProcessRequest(BaseModel):
    subscription_id: str
    customer_id: str
    amount: int
    payment_method: Dict[str, Any] = Field(default_factory=lambda: {"type": "card", "last4": "4242", "brand": "Visa"})
    idempotency_key: Optional[str] = None
    force_failure: bool = False
    failure_reason: Optional[str] = None

class RazorpayVerifyRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id_or_sub_id: str
    razorpay_signature: str

class ExceptionOverrideRequest(BaseModel):
    notes: str
    authorized_by: Optional[str] = None

class WhatIfSimulationRequest(BaseModel):
    price_change_pct: float = 0.0
    churn_mitigation_spend: float = 0.0
    discount_campaign_pct: float = 0.0
