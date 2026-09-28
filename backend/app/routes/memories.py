from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import Memory
from app.schemas.api_models import (
    MemoryCreate,
    MemoryResponse,
    MemoryFeedbackCreate,
    MemoryFeedbackResponse
)
from app.memory.outcome_evaluator import OutcomeEvaluator

router = APIRouter(prefix="/api/memories", tags=["memories"])

@router.get("", response_model=List[MemoryResponse])
def list_memories(
    customer_id: Optional[str] = None,
    memory_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Memory)
    if customer_id:
        query = query.filter(Memory.customer_id == customer_id)
    if memory_type:
        query = query.filter(Memory.memory_type == memory_type)
    return query.order_by(Memory.importance.desc(), Memory.created_at.desc()).all()

@router.post("", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
def create_memory(memory_in: MemoryCreate, db: Session = Depends(get_db)):
    mem = Memory(
        customer_id=memory_in.customer_id,
        memory_type=memory_in.memory_type.value if hasattr(memory_in.memory_type, "value") else str(memory_in.memory_type),
        content=memory_in.content,
        importance=memory_in.importance,
        confidence=memory_in.confidence,
        source_case_id=memory_in.source_case_id,
        metadata_json=memory_in.metadata_json
    )
    db.add(mem)
    db.commit()
    db.refresh(mem)
    return mem

@router.post("/{memory_id}/feedback", response_model=MemoryFeedbackResponse)
def submit_feedback(memory_id: str, feedback_in: MemoryFeedbackCreate, db: Session = Depends(get_db)):
    fb = OutcomeEvaluator.record_feedback(
        db=db,
        memory_id=memory_id,
        was_useful=feedback_in.was_useful,
        result=feedback_in.result,
        notes=feedback_in.notes
    )
    if not fb:
        raise HTTPException(status_code=404, detail="Memory not found")
    return fb

@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(memory_id: str, db: Session = Depends(get_db)):
    mem = db.query(Memory).filter(Memory.id == memory_id).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")
    db.delete(mem)
    db.commit()
    return None
