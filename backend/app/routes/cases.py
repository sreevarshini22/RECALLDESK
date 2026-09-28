from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import SupportCase, Action
from app.schemas.api_models import (
    SupportCaseCreate,
    SupportCaseResponse,
    ActionCreate,
    ActionResponse
)
from app.services.case_service import CaseService

router = APIRouter(prefix="/api/cases", tags=["cases"])

class ResolveCaseRequest(BaseModel):
    resolution: str

@router.get("", response_model=List[SupportCaseResponse])
def get_cases(limit: int = 50, db: Session = Depends(get_db)):
    return CaseService.get_all_cases(db, limit)

@router.post("", response_model=SupportCaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(case_in: SupportCaseCreate, db: Session = Depends(get_db)):
    return CaseService.create_case(db, case_in)

@router.get("/{case_id}", response_model=SupportCaseResponse)
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Support case not found")
    return case

@router.post("/{case_id}/actions", response_model=ActionResponse)
def add_case_action(case_id: str, action_in: ActionCreate, db: Session = Depends(get_db)):
    action = CaseService.add_action(db, case_id, action_in)
    if not action:
        raise HTTPException(status_code=404, detail="Support case not found")
    return action

@router.post("/{case_id}/resolve", response_model=SupportCaseResponse)
def resolve_case(case_id: str, req: ResolveCaseRequest, db: Session = Depends(get_db)):
    case = CaseService.resolve_case(db, case_id, req.resolution)
    if not case:
        raise HTTPException(status_code=404, detail="Support case not found")
    return case
