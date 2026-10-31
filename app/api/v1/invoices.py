from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.models.subscription import Invoice
from app.api.v1.deps import get_current_tenant_id

router = APIRouter()

@router.get("/")
def list_invoices(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Retrieve all invoices in current tenant."""
    invoices = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id
    ).order_by(Invoice.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id": i.id,
            "invoice_number": i.invoice_number,
            "subscription_id": i.subscription_id,
            "customer_id": i.customer_id,
            "payment_id": i.payment_id,
            "subtotal": i.subtotal,
            "tax_amount": i.tax_amount,
            "cgst_amount": i.cgst_amount,
            "sgst_amount": i.sgst_amount,
            "total_amount": i.total_amount,
            "currency": i.currency,
            "status": i.status,
            "hsn_sac_code": i.hsn_sac_code,
            "issue_date": i.issue_date.isoformat() if i.issue_date else None,
            "due_date": i.due_date.isoformat() if i.due_date else None
        }
        for i in invoices
    ]

@router.get("/{invoice_id}")
def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """Retrieve invoice details with customer and subscription."""
    inv = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.tenant_id == tenant_id
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv
