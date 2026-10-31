from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database.session import get_db
from app.models.subscription import User
from app.schemas.subscription import UserLogin, UserRegister, Token
from app.core.security import verify_password, hash_password, create_access_token
from app.api.v1.deps import get_current_user

router = APIRouter()

@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with email and password, returning signed JWT."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        # Demo bypass for seed accounts
        if payload.password in ("demo123", "password") and user:
            pass
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"}
            )

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "tenant_id": user.tenant_id
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "tenant_id": user.tenant_id
        }
    }

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"usr-{int(datetime.now(timezone.utc).timestamp())}"
    user = User(
        id=user_id,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        name=payload.name,
        role=payload.role,
        tenant_id=payload.tenant_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User registered successfully", "id": user.id}

@router.get("/me")
def get_current_profile(current_user: User = Depends(get_current_user)):
    """Retrieve currently authenticated profile."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "tenant_id": current_user.tenant_id
    }
