from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime, timezone
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

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    CUSTOMER = "customer"

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True, default="tenant-primary")
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(32), default=UserRole.ADMIN.value, nullable=False)
    customer_id = Column(String(64), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True, default="tenant-primary")
    name = Column(String(255), nullable=False)
    email = Column(String(255), index=True, nullable=False)
    phone = Column(String(32), nullable=False)
    company = Column(String(255), nullable=False, index=True)
    address = Column(String(500), nullable=True)
    tax_id = Column(String(64), nullable=True)  # GSTIN
    status = Column(String(32), default="active", nullable=False)
    health_score = Column(Integer, default=85)
    churn_risk = Column(String(32), default="low")
    total_spent = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    subscriptions = relationship("Subscription", back_populates="customer", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="customer")
    invoices = relationship("Invoice", back_populates="customer")

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True, default="tenant-primary")
    name = Column(String(128), nullable=False)
    code = Column(String(64), index=True, nullable=False)  # starter, growth, enterprise
    description = Column(String(500), nullable=True)
    monthly_price = Column(Integer, nullable=False)  # in INR
    annual_price = Column(Integer, nullable=False)   # in INR
    trial_days = Column(Integer, default=14)
    features = Column(JSON, nullable=True)
    limits = Column(JSON, nullable=True)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True, default="tenant-primary")
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False, index=True)
    plan_id = Column(String(64), ForeignKey("subscription_plans.id"), nullable=False, index=True)
    status = Column(String(32), default=SubscriptionStatus.ACTIVE.value, nullable=False, index=True)
    billing_interval = Column(String(32), default=BillingInterval.MONTHLY.value, nullable=False)
    current_period_start = Column(DateTime(timezone=True), nullable=False)
    current_period_end = Column(DateTime(timezone=True), nullable=False, index=True)
    grace_period_end = Column(DateTime(timezone=True), nullable=True)
    trial_end = Column(DateTime(timezone=True), nullable=True)
    auto_renew = Column(Boolean, default=True)
    cancel_at_period_end = Column(Boolean, default=False)
    cancellation_reason = Column(String(500), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    paused_at = Column(DateTime(timezone=True), nullable=True)
    failed_retry_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    customer = relationship("Customer", back_populates="subscriptions")
    plan = relationship("SubscriptionPlan")
    payments = relationship("Payment", back_populates="subscription")
    invoices = relationship("Invoice", back_populates="subscription")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True, default="tenant-primary")
    subscription_id = Column(String(64), ForeignKey("subscriptions.id"), nullable=False, index=True)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False, index=True)
    invoice_id = Column(String(64), nullable=True, index=True)
    amount = Column(Integer, nullable=False)  # INR
    currency = Column(String(8), default="INR", nullable=False)
    status = Column(String(32), default="success", nullable=False)  # success, failed, refunded
    payment_method = Column(JSON, nullable=True)
    gateway = Column(String(64), default="razorpay", nullable=False)
    transaction_id = Column(String(128), unique=True, index=True, nullable=False)
    idempotency_key = Column(String(128), unique=True, index=True, nullable=True)
    failure_reason = Column(String(500), nullable=True)
    reconciled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subscription = relationship("Subscription", back_populates="payments")
    customer = relationship("Customer", back_populates="payments")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True, default="tenant-primary")
    invoice_number = Column(String(64), unique=True, index=True, nullable=False)
    subscription_id = Column(String(64), ForeignKey("subscriptions.id"), nullable=False, index=True)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False, index=True)
    payment_id = Column(String(64), nullable=True, index=True)
    subtotal = Column(Integer, nullable=False)
    tax_amount = Column(Integer, nullable=False)  # 18% Total GST
    cgst_amount = Column(Integer, nullable=False) # 9% CGST
    sgst_amount = Column(Integer, nullable=False) # 9% SGST
    total_amount = Column(Integer, nullable=False)
    currency = Column(String(8), default="INR", nullable=False)
    status = Column(String(32), default="pending", nullable=False) # paid, pending, void, refunded
    issue_date = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=False)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    hsn_sac_code = Column(String(32), default="998313", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subscription = relationship("Subscription", back_populates="invoices")
    customer = relationship("Customer", back_populates="invoices")

class BillingException(Base):
    __tablename__ = "billing_exceptions"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True, default="tenant-primary")
    category = Column(String(64), nullable=False) # subscription, duplicate_billing, tax_discrepancy
    severity = Column(String(32), nullable=False) # critical, medium, low
    title = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    subscription_id = Column(String(64), nullable=True, index=True)
    expected_value = Column(String(255), nullable=True)
    actual_value = Column(String(255), nullable=True)
    financial_impact = Column(Integer, default=0)
    resolution_status = Column(String(32), default="open") # open, resolved, overridden
    resolution_notes = Column(Text, nullable=True)
    resolved_by = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True, default="tenant-primary")
    event_type = Column(String(64), nullable=False, index=True)
    entity_id = Column(String(64), nullable=False, index=True)
    actor = Column(String(128), nullable=False)
    payload = Column(JSON, nullable=False)
    previous_hash = Column(String(128), nullable=False)
    audit_hash = Column(String(128), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class FinancialLedgerEntry(Base):
    __tablename__ = "financial_ledger"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True, default="tenant-primary")
    transaction_id = Column(String(128), nullable=False, index=True)
    entry_type = Column(String(16), nullable=False) # debit, credit
    account_name = Column(String(128), nullable=False) # Cash/Gateway, Subscription Revenue, GST Output Liability
    amount = Column(Integer, nullable=False)
    reference_id = Column(String(64), nullable=True, index=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
