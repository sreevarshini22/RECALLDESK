from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import Customer, Memory, CustomerPreference, SupportCase
from app.schemas.api_models import (
    CustomerCreate,
    CustomerResponse,
    MemoryResponse,
    CustomerPreferenceResponse,
    SupportCaseResponse,
    EnvironmentSnapshotResponse
)
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/api/customers", tags=["customers"])

@router.get("", response_model=List[CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    return CustomerService.get_all_customers(db)

@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer_in: CustomerCreate, db: Session = Depends(get_db)):
    return CustomerService.create_customer(db, customer_in)

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    customer = CustomerService.get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.get("/{customer_id}/cases", response_model=List[SupportCaseResponse])
def get_customer_cases(customer_id: str, db: Session = Depends(get_db)):
    customer = CustomerService.get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db.query(SupportCase).filter(SupportCase.customer_id == customer_id).order_by(SupportCase.created_at.desc()).all()

@router.get("/{customer_id}/memories", response_model=List[MemoryResponse])
def get_customer_memories(customer_id: str, db: Session = Depends(get_db)):
    customer = CustomerService.get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Strict isolation: Only memories belonging to this customer
    memories = db.query(Memory).filter(
        Memory.customer_id == customer_id
    ).order_by(Memory.importance.desc(), Memory.created_at.desc()).all()
    
    return memories

@router.get("/{customer_id}/preferences", response_model=List[CustomerPreferenceResponse])
def get_customer_preferences(customer_id: str, db: Session = Depends(get_db)):
    customer = CustomerService.get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return db.query(CustomerPreference).filter(CustomerPreference.customer_id == customer_id).all()

@router.get("/{customer_id}/history")
def get_customer_history(customer_id: str, db: Session = Depends(get_db)):
    history = CustomerService.get_customer_history(db, customer_id)
    if not history:
        raise HTTPException(status_code=404, detail="Customer not found")
    return history

@router.put("/{customer_id}/environment", response_model=CustomerResponse)
def update_customer_environment(customer_id: str, env_data: Dict[str, Any], db: Session = Depends(get_db)):
    customer = CustomerService.update_environment(db, customer_id, env_data)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer
