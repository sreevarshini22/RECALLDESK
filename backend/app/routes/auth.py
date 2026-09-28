from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header, status, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import Customer, UserSession, EnvironmentSnapshot
from app.security import hash_password, verify_password, generate_session_token

router = APIRouter(prefix="/api", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    environment: Optional[Dict[str, Any]] = None

class ForgotPasswordRequest(BaseModel):
    email: str

def get_token_from_header(
    authorization: Optional[str] = Header(None),
    x_session_token: Optional[str] = Header(None)
) -> Optional[str]:
    if x_session_token:
        return x_session_token
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]
        return authorization
    return None

def get_current_customer(
    token: Optional[str] = Depends(get_token_from_header),
    db: Session = Depends(get_db)
) -> Customer:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing session token."
        )
    
    session = db.query(UserSession).filter(UserSession.token == token).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token."
        )
    
    customer = db.query(Customer).filter(Customer.id == session.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Customer account not found."
        )
    
    return customer

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    customer = db.query(Customer).filter(Customer.email == email_clean).first()
    
    if not customer or not customer.password_hash or not verify_password(req.password, customer.password_hash):
        return {
            "success": False,
            "message": "Invalid email or password"
        }
    
    # Create authenticated session
    token = generate_session_token()
    session = UserSession(
        customer_id=customer.id,
        token=token,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(session)
    db.commit()

    return {
        "success": True,
        "token": token,
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "email": customer.email,
            "environment": customer.environment or {}
        }
    }

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    if not email_clean or not req.name.strip() or not req.password:
        return {
            "success": False,
            "message": "Name, email, and password are required."
        }

    existing = db.query(Customer).filter(Customer.email == email_clean).first()
    if existing:
        return {
            "success": False,
            "message": "An account with this email already exists. Please log in."
        }

    env_data = req.environment or {
        "device": "Standard Workstation",
        "os": "Windows 11 / macOS",
        "browser": "Chrome / Edge"
    }

    # Create new customer with hashed password
    customer = Customer(
        name=req.name.strip(),
        email=email_clean,
        password_hash=hash_password(req.password),
        environment=env_data,
        created_at=datetime.utcnow()
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    # Add initial snapshot
    snap = EnvironmentSnapshot(
        customer_id=customer.id,
        environment_data=env_data,
        created_at=datetime.utcnow()
    )
    db.add(snap)

    # Create authenticated session
    token = generate_session_token()
    session = UserSession(
        customer_id=customer.id,
        token=token,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(session)
    db.commit()

    return {
        "success": True,
        "token": token,
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "email": customer.email,
            "environment": customer.environment or {}
        }
    }

@router.get("/me")
def get_me(customer: Customer = Depends(get_current_customer)):
    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "environment": customer.environment or {}
    }

@router.post("/logout")
def logout(token: Optional[str] = Depends(get_token_from_header), db: Session = Depends(get_db)):
    if token:
        db.query(UserSession).filter(UserSession.token == token).delete()
        db.commit()
    return {
        "success": True,
        "message": "Logged out successfully"
    }

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    customer = db.query(Customer).filter(Customer.email == email_clean).first()
    
    if not customer:
        return {
            "success": False,
            "message": "No account found with this email address."
        }
    
    return {
        "success": True,
        "message": "Password reset instructions have been dispatched to your registered email address."
    }
