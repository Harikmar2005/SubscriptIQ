import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.subscription import Customer
from app.schemas.subscription import CustomerCreate, CustomerResponse
from app.core.security import get_current_user, CurrentUserContext, require_role

router = APIRouter()

@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
    current_user: CurrentUserContext = Depends(get_current_user)
):
    """Retrieve customers isolated to current user's tenant"""
    query = db.query(Customer).filter(Customer.tenant_id == current_user.tenant_id)
    if current_user.role == "customer" and current_user.customer_id:
        # Tenant customer can only view their own account
        query = query.filter(Customer.id == current_user.customer_id)
    return query.all()

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUserContext = Depends(require_role(["admin"]))
):
    """Create customer within caller's tenant boundary"""
    new_customer = Customer(
        id=f"cust-{uuid.uuid4().hex[:8]}",
        tenant_id=current_user.tenant_id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        company=payload.company,
        address=payload.address,
        city=payload.city,
        tax_id=payload.tax_id,
        status=payload.status or "active"
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer_by_id(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUserContext = Depends(get_current_user)
):
    query = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.tenant_id == current_user.tenant_id
    )
    if current_user.role == "customer" and current_user.customer_id != customer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden.")
    
    cust = query.first()
    if not cust:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return cust

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUserContext = Depends(require_role(["admin"]))
):
    cust = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.tenant_id == current_user.tenant_id
    ).first()
    if not cust:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    db.delete(cust)
    db.commit()
    return None
