import enum

try:
    from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Enum, JSON, Text, Index
    from sqlalchemy.orm import relationship
    from sqlalchemy.sql import func
except ImportError:
    class DummyType:
        def __init__(self, *args, **kwargs):
            pass
    Column = DummyType
    String = DummyType
    Integer = DummyType
    Float = DummyType
    Boolean = DummyType
    DateTime = DummyType
    ForeignKey = DummyType
    Enum = DummyType
    JSON = DummyType
    Text = DummyType
    Index = DummyType
    relationship = lambda *args, **kwargs: None
    func = type('Func', (), {'now': lambda: None})

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
    tenant_id = Column(String(64), nullable=False, index=True) # Tenant isolation
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(32), default="admin", nullable=False) # admin or customer
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True) # Tenant isolation
    name = Column(String(255), nullable=False)
    email = Column(String(255), index=True, nullable=False)
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

    __table_args__ = (
        Index('idx_cust_tenant_email', 'tenant_id', 'email', unique=True),
    )

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    code = Column(String(64), nullable=False)
    description = Column(String(500), nullable=True)
    monthly_price = Column(Integer, nullable=False) # in paise or rupees
    annual_price = Column(Integer, nullable=False)
    currency = Column(String(8), default="INR")
    trial_days = Column(Integer, default=14)
    features = Column(JSON, nullable=False)
    limits = Column(JSON, nullable=False)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_plan_tenant_code', 'tenant_id', 'code', unique=True),
    )

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False, index=True)
    plan_id = Column(String(64), ForeignKey("subscription_plans.id"), nullable=False, index=True)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, nullable=False, index=True)
    billing_interval = Column(Enum(BillingInterval), default=BillingInterval.MONTHLY, nullable=False)
    current_period_start = Column(DateTime(timezone=True), nullable=False)
    current_period_end = Column(DateTime(timezone=True), nullable=False, index=True)
    trial_end = Column(DateTime(timezone=True), nullable=True)
    grace_period_end = Column(DateTime(timezone=True), nullable=True)
    failed_retry_count = Column(Integer, default=0)
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
    tenant_id = Column(String(64), nullable=False, index=True)
    subscription_id = Column(String(64), ForeignKey("subscriptions.id"), nullable=False, index=True)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False) # INR
    currency = Column(String(8), default="INR")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.SUCCESS, nullable=False, index=True)
    payment_method = Column(JSON, nullable=False) # card, upi, netbanking
    gateway = Column(String(64), default="razorpay_simulated")
    transaction_id = Column(String(128), unique=True, index=True, nullable=False)
    idempotency_key = Column(String(128), unique=True, index=True, nullable=True) # Duplicate protection
    failure_reason = Column(String(500), nullable=True)
    invoice_id = Column(String(64), ForeignKey("invoices.id"), nullable=True)
    reconciled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    customer = relationship("Customer", back_populates="payments")
    subscription = relationship("Subscription", back_populates="payments")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True)
    invoice_number = Column(String(64), unique=True, index=True, nullable=False)
    subscription_id = Column(String(64), ForeignKey("subscriptions.id"), nullable=False, index=True)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False, index=True)
    subtotal = Column(Integer, nullable=False)
    tax_amount = Column(Integer, nullable=False) # 18% GST
    cgst_amount = Column(Integer, default=0)
    sgst_amount = Column(Integer, default=0)
    igst_amount = Column(Integer, default=0)
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

class FinancialLedger(Base):
    """Double-entry balanced accounting ledger for strict financial audits"""
    __tablename__ = "financial_ledger"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True)
    transaction_id = Column(String(128), nullable=False, index=True)
    entry_type = Column(String(16), nullable=False) # debit or credit
    account_name = Column(String(128), nullable=False, index=True)
    amount = Column(Integer, nullable=False) # INR
    reference_id = Column(String(64), nullable=False)
    description = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SubscriptionHistory(Base):
    __tablename__ = "subscription_history"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True)
    subscription_id = Column(String(64), ForeignKey("subscriptions.id"), nullable=False, index=True)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False)
    event_type = Column(String(64), nullable=False)
    details = Column(Text, nullable=False)
    previous_plan_id = Column(String(64), nullable=True)
    new_plan_id = Column(String(64), nullable=True)
    user_email = Column(String(255), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    """Enterprise security and access audit trail"""
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(64), nullable=False, index=True)
    actor_email = Column(String(255), nullable=False, index=True)
    action = Column(String(64), nullable=False)
    resource = Column(String(128), nullable=False)
    resource_id = Column(String(64), nullable=True)
    ip_address = Column(String(64), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
