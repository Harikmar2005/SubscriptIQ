from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.subscription import Invoice
from app.core.security import get_current_user, CurrentUserContext

router = APIRouter()

@router.get("/")
def get_invoices(
    db: Session = Depends(get_db),
    current_user: CurrentUserContext = Depends(get_current_user)
):
    query = db.query(Invoice).filter(Invoice.tenant_id == current_user.tenant_id)
    if current_user.role == "customer" and current_user.customer_id:
        query = query.filter(Invoice.customer_id == current_user.customer_id)
    return query.order_by(Invoice.created_at.desc()).all()

@router.get("/{invoice_id}")
def get_invoice_by_id(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUserContext = Depends(get_current_user)
):
    inv = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.tenant_id == current_user.tenant_id
    ).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return inv
