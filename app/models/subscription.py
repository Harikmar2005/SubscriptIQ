from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Enum, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database.base import Base

class SubscriptionStatus(str, enum.Enum):
    TRIAL = "trial"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class BillingInterval(str, enum.Enum):
    MONTHLY = "monthly"
    ANNUAL = "annual"

class PaymentStatus(str, enum.Enum):
    SUCCESS = "success"
    FAILED = "failed"
    PENDING = "pending"
    REFUNDED = "refunded"

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(32), default="admin", nullable=False) # admin or customer
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(32), nullable=False)
    company = Column(String(255), nullable=False, index=True)
    address = Column(String(500), nullable=True)
    city = Column(String(128), nullable=True)
    country = Column(String(64), default="India")
    tax_id = Column(String(64), nullable=True) # GSTIN
    status = Column(String(32), default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    subscriptions = relationship("Subscription", back_populates="customer", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="customer")
    invoices = relationship("Invoice", back_populates="customer")

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    code = Column(String(64), unique=True, index=True, nullable=False)
    description = Column(String(500), nullable=True)
    monthly_price = Column(Integer, nullable=False) # INR
    annual_price = Column(Integer, nullable=False)  # INR
    currency = Column(String(8), default="INR")
    trial_days = Column(Integer, default=14)
    features = Column(JSON, nullable=False)
    limits = Column(JSON, nullable=False)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(64), primary_key=True, index=True)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False, index=True)
    plan_id = Column(String(64), ForeignKey("subscription_plans.id"), nullable=False, index=True)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, nullable=False, index=True)
    billing_interval = Column(Enum(BillingInterval), default=BillingInterval.MONTHLY, nullable=False)
    current_period_start = Column(DateTime(timezone=True), nullable=False)
    current_period_end = Column(DateTime(timezone=True), nullable=False, index=True)
    trial_end = Column(DateTime(timezone=True), nullable=True)
    auto_renew = Column(Boolean, default=True)
    cancellation_reason = Column(String(500), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    paused_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    customer = relationship("Customer", back_populates="subscriptions")
    plan = relationship("SubscriptionPlan")
    payments = relationship("Payment", back_populates="subscription")
    invoices = relationship("Invoice", back_populates="subscription")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(64), primary_key=True, index=True)
    subscription_id = Column(String(64), ForeignKey("subscriptions.id"), nullable=False)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False)
    amount = Column(Integer, nullable=False) # INR
    currency = Column(String(8), default="INR")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.SUCCESS, nullable=False)
    payment_method = Column(JSON, nullable=False) # card, upi, netbanking
    gateway = Column(String(64), default="razorpay_simulated")
    transaction_id = Column(String(128), unique=True, index=True, nullable=False)
    failure_reason = Column(String(500), nullable=True)
    invoice_id = Column(String(64), ForeignKey("invoices.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="payments")
    subscription = relationship("Subscription", back_populates="payments")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(64), primary_key=True, index=True)
    invoice_number = Column(String(64), unique=True, index=True, nullable=False)
    subscription_id = Column(String(64), ForeignKey("subscriptions.id"), nullable=False)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False)
    subtotal = Column(Integer, nullable=False)
    tax_amount = Column(Integer, nullable=False) # 18% GST
    total_amount = Column(Integer, nullable=False)
    currency = Column(String(8), default="INR")
    status = Column(String(32), default="paid", nullable=False)
    issue_date = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=False)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    billing_period_start = Column(DateTime(timezone=True), nullable=False)
    billing_period_end = Column(DateTime(timezone=True), nullable=False)
    items = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="invoices")
    subscription = relationship("Subscription", back_populates="invoices")

class SubscriptionHistory(Base):
    __tablename__ = "subscription_history"

    id = Column(String(64), primary_key=True, index=True)
    subscription_id = Column(String(64), ForeignKey("subscriptions.id"), nullable=False)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False)
    event_type = Column(String(64), nullable=False)
    details = Column(Text, nullable=False)
    previous_plan_id = Column(String(64), nullable=True)
    new_plan_id = Column(String(64), nullable=True)
    user_email = Column(String(255), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
