from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional
from app.database.session import get_db
from app.models.subscription import Customer
from app.schemas.subscription import CustomerCreate, CustomerUpdate
from app.api.v1.deps import get_current_tenant_id

router = APIRouter()

@router.get("/")
def list_customers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """List all customers in current tenant."""
    customers = db.query(Customer).filter(
        Customer.tenant_id == tenant_id
    ).offset(skip).limit(limit).all()

    return [
        {
            "id": c.id,
            "name": c.name,
            "company": c.company,
            "email": c.email,
            "phone": c.phone,
            "address": c.address,
            "tax_id": c.tax_id,
            "status": c.status,
            "health_score": c.health_score,
            "churn_risk": c.churn_risk,
            "total_spent": c.total_spent
        }
        for c in customers
    ]

@router.get("/{customer_id}")
def get_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Retrieve customer by ID strictly within authenticated tenant boundary."""
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.tenant_id == tenant_id
    ).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer {customer_id} not found in current tenant"
        )
    return {
        "id": customer.id,
        "name": customer.name,
        "company": customer.company,
        "email": customer.email,
        "phone": customer.phone,
        "address": customer.address,
        "tax_id": customer.tax_id,
        "status": customer.status,
        "health_score": customer.health_score,
        "churn_risk": customer.churn_risk,
        "total_spent": customer.total_spent
    }

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Register a new customer with multi-tenant isolation."""
    customer_id = f"cust-{int(datetime.now(timezone.utc).timestamp())}"
    customer = Customer(
        id=customer_id,
        tenant_id=tenant_id,
        name=payload.name,
        company=payload.company,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
        tax_id=payload.tax_id,
        status="active",
        health_score=85,
        churn_risk="low",
        total_spent=0
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.put("/{customer_id}")
def update_customer(
    customer_id: str,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Update customer details with tenant validation."""
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.tenant_id == tenant_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found in current tenant")

    if payload.name is not None:
        customer.name = payload.name
    if payload.company is not None:
        customer.company = payload.company
    if payload.email is not None:
        customer.email = payload.email
    if payload.phone is not None:
        customer.phone = payload.phone
    if payload.address is not None:
        customer.address = payload.address
    if payload.tax_id is not None:
        customer.tax_id = payload.tax_id
    if payload.status is not None:
        customer.status = payload.status

    customer.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Delete customer and cascade delete subscriptions in tenant."""
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.tenant_id == tenant_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found in current tenant")

    db.delete(customer)
    db.commit()
    return None
