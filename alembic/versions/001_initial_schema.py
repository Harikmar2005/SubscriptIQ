"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-31 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), nullable=False, index=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True, index=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.Column('customer_id', sa.String(length=64), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # Customers table
    op.create_table(
        'customers',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), nullable=False, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False, index=True),
        sa.Column('phone', sa.String(length=32), nullable=False),
        sa.Column('company', sa.String(length=255), nullable=False, index=True),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('tax_id', sa.String(length=64), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, default='active'),
        sa.Column('health_score', sa.Integer(), default=85),
        sa.Column('churn_risk', sa.String(length=32), default='low'),
        sa.Column('total_spent', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True)
    )

    # Subscription Plans table
    op.create_table(
        'subscription_plans',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), nullable=False, index=True),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('code', sa.String(length=64), nullable=False, index=True),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('monthly_price', sa.Integer(), nullable=False),
        sa.Column('annual_price', sa.Integer(), nullable=False),
        sa.Column('trial_days', sa.Integer(), default=14),
        sa.Column('features', sa.JSON(), nullable=True),
        sa.Column('limits', sa.JSON(), nullable=True),
        sa.Column('is_archived', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # Subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), nullable=False, index=True),
        sa.Column('customer_id', sa.String(length=64), sa.ForeignKey('customers.id'), nullable=False, index=True),
        sa.Column('plan_id', sa.String(length=64), sa.ForeignKey('subscription_plans.id'), nullable=False, index=True),
        sa.Column('status', sa.String(length=32), nullable=False, index=True),
        sa.Column('billing_interval', sa.String(length=32), nullable=False),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('grace_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trial_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('auto_renew', sa.Boolean(), default=True),
        sa.Column('cancel_at_period_end', sa.Boolean(), default=False),
        sa.Column('cancellation_reason', sa.String(length=500), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('paused_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('failed_retry_count', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True)
    )

    # Payments table
    op.create_table(
        'payments',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), nullable=False, index=True),
        sa.Column('subscription_id', sa.String(length=64), sa.ForeignKey('subscriptions.id'), nullable=False, index=True),
        sa.Column('customer_id', sa.String(length=64), sa.ForeignKey('customers.id'), nullable=False, index=True),
        sa.Column('invoice_id', sa.String(length=64), nullable=True, index=True),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(length=8), nullable=False, default='INR'),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('payment_method', sa.JSON(), nullable=True),
        sa.Column('gateway', sa.String(length=64), nullable=False),
        sa.Column('transaction_id', sa.String(length=128), unique=True, index=True, nullable=False),
        sa.Column('idempotency_key', sa.String(length=128), unique=True, index=True, nullable=True),
        sa.Column('failure_reason', sa.String(length=500), nullable=True),
        sa.Column('reconciled', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # Invoices table
    op.create_table(
        'invoices',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), nullable=False, index=True),
        sa.Column('invoice_number', sa.String(length=64), unique=True, index=True, nullable=False),
        sa.Column('subscription_id', sa.String(length=64), sa.ForeignKey('subscriptions.id'), nullable=False, index=True),
        sa.Column('customer_id', sa.String(length=64), sa.ForeignKey('customers.id'), nullable=False, index=True),
        sa.Column('payment_id', sa.String(length=64), nullable=True, index=True),
        sa.Column('subtotal', sa.Integer(), nullable=False),
        sa.Column('tax_amount', sa.Integer(), nullable=False),
        sa.Column('cgst_amount', sa.Integer(), nullable=False),
        sa.Column('sgst_amount', sa.Integer(), nullable=False),
        sa.Column('total_amount', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(length=8), nullable=False, default='INR'),
        sa.Column('status', sa.String(length=32), nullable=False, default='pending'),
        sa.Column('issue_date', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('hsn_sac_code', sa.String(length=32), nullable=False, default='998313'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # Billing exceptions table
    op.create_table(
        'billing_exceptions',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), nullable=False, index=True),
        sa.Column('category', sa.String(length=64), nullable=False),
        sa.Column('severity', sa.String(length=32), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('subscription_id', sa.String(length=64), nullable=True, index=True),
        sa.Column('expected_value', sa.String(length=255), nullable=True),
        sa.Column('actual_value', sa.String(length=255), nullable=True),
        sa.Column('financial_impact', sa.Integer(), default=0),
        sa.Column('resolution_status', sa.String(length=32), default='open'),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('resolved_by', sa.String(length=128), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # Audit events table
    op.create_table(
        'audit_events',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), nullable=False, index=True),
        sa.Column('event_type', sa.String(length=64), nullable=False, index=True),
        sa.Column('entity_id', sa.String(length=64), nullable=False, index=True),
        sa.Column('actor', sa.String(length=128), nullable=False),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('previous_hash', sa.String(length=128), nullable=False),
        sa.Column('audit_hash', sa.String(length=128), nullable=False, index=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # Financial ledger table
    op.create_table(
        'financial_ledger',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), nullable=False, index=True),
        sa.Column('transaction_id', sa.String(length=128), nullable=False, index=True),
        sa.Column('entry_type', sa.String(length=16), nullable=False),
        sa.Column('account_name', sa.String(length=128), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('reference_id', sa.String(length=64), nullable=True, index=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

def downgrade() -> None:
    op.drop_table('financial_ledger')
    op.drop_table('audit_events')
    op.drop_table('billing_exceptions')
    op.drop_table('invoices')
    op.drop_table('payments')
    op.drop_table('subscriptions')
    op.drop_table('subscription_plans')
    op.drop_table('customers')
    op.drop_table('users')
