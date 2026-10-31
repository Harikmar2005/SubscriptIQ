from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.core.security import hash_password, verify_password, create_access_token, get_current_user, CurrentUserContext
from app.database.session import get_db
from sqlalchemy.orm import Session
from app.models.subscription import User

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    tenant_id: str
    user_id: str
    email: str

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # Standard demo credentials handling
    if payload.email == "admin@subscriptiq.io" and payload.password in ["admin123", "password", "demo"]:
        token = create_access_token({
            "sub": "user-admin-1",
            "email": payload.email,
            "role": "admin",
            "tenant_id": "tenant-subscriptiq-india"
        })
        return TokenResponse(
            access_token=token,
            role="admin",
            tenant_id="tenant-subscriptiq-india",
            user_id="user-admin-1",
            email=payload.email
        )
    
    if payload.email == "sarah@technova.com" and payload.password in ["customer123", "password", "demo"]:
        token = create_access_token({
            "sub": "user-customer-1",
            "email": payload.email,
            "role": "customer",
            "tenant_id": "tenant-subscriptiq-india",
            "customer_id": "cust-1"
        })
        return TokenResponse(
            access_token=token,
            role="customer",
            tenant_id="tenant-subscriptiq-india",
            user_id="user-customer-1",
            email=payload.email
        )

    # Isolated secondary tenant
    if payload.email == "isolated.admin@zenithcorp.com" and payload.password in ["admin123", "password"]:
        token = create_access_token({
            "sub": "user-tenant2-admin",
            "email": payload.email,
            "role": "admin",
            "tenant_id": "tenant-isolated-enterprise"
        })
        return TokenResponse(
            access_token=token,
            role="admin",
            tenant_id="tenant-isolated-enterprise",
            user_id="user-tenant2-admin",
            email=payload.email
        )

    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email credentials."
        )

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "tenant_id": user.tenant_id,
        "customer_id": user.customer_id
    })
    return TokenResponse(
        access_token=token,
        role=user.role,
        tenant_id=user.tenant_id,
        user_id=user.id,
        email=user.email
    )

@router.get("/me")
def get_me(current_user: CurrentUserContext = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "role": current_user.role,
        "tenant_id": current_user.tenant_id,
        "customer_id": current_user.customer_id
    }
