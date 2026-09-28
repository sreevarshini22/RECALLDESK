from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.schema import Memory, MemoryFeedback
from app.schemas.api_models import MemoryFeedbackCreate

class OutcomeEvaluator:
    """
    Evaluates memory effectiveness and manages the continuous learning feedback loop.
    Adjusts memory confidence based on real-world resolution utility.
    """

    @classmethod
    def record_feedback(
        cls,
        db: Session,
        memory_id: str,
        was_useful: bool,
        result: str = "HELPED_RESOLVE",
        notes: Optional[str] = None
    ) -> Optional[MemoryFeedback]:
        memory = db.query(Memory).filter(Memory.id == memory_id).first()
        if not memory:
            return None

        feedback = MemoryFeedback(
            memory_id=memory_id,
            was_useful=was_useful,
            result=result,
            notes=notes,
            created_at=datetime.utcnow()
        )
        db.add(feedback)

        # Dynamic confidence recalibration
        if was_useful:
            # Reward successful memory utility
            memory.confidence = min(1.0, memory.confidence + 0.05)
            memory.importance = min(1.0, memory.importance + 0.03)
        else:
            # Dampen ineffective or outdated memory
            if result == "OUTDATED":
                memory.confidence = max(0.1, memory.confidence - 0.20)
                memory.importance = max(0.1, memory.importance - 0.15)
            else:
                memory.confidence = max(0.2, memory.confidence - 0.10)

        memory.last_used = datetime.utcnow()
        db.commit()
        db.refresh(feedback)
        db.refresh(memory)
        return feedback

    @classmethod
    def mark_memories_used(cls, db: Session, memory_ids: List[str]):
        if not memory_ids:
            return
        
        now = datetime.utcnow()
        db.query(Memory).filter(Memory.id.in_(memory_ids)).update(
            {"last_used": now},
            synchronize_session=False
        )
        db.commit()
