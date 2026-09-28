from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.schema import SupportCase, Action, Customer
from app.schemas.api_models import SupportCaseCreate, CaseStatus, ActionCreate, ActionStatus

class CaseService:

    @staticmethod
    def get_all_cases(db: Session, limit: int = 50) -> List[SupportCase]:
        return db.query(SupportCase).order_by(SupportCase.created_at.desc()).limit(limit).all()

    @staticmethod
    def get_case_by_id(db: Session, case_id: str) -> Optional[SupportCase]:
        return db.query(SupportCase).filter(SupportCase.id == case_id).first()

    @staticmethod
    def create_case(db: Session, case_in: SupportCaseCreate) -> SupportCase:
        case = SupportCase(
            customer_id=case_in.customer_id,
            problem=case_in.problem,
            conversation=[m.model_dump() for m in case_in.conversation] if case_in.conversation else [],
            status=CaseStatus.OPEN.value,
            created_at=datetime.utcnow()
        )
        db.add(case)
        db.commit()
        db.refresh(case)
        return case

    @staticmethod
    def add_action(db: Session, case_id: str, action_in: ActionCreate) -> Optional[Action]:
        case = db.query(SupportCase).filter(SupportCase.id == case_id).first()
        if not case:
            return None

        action = Action(
            case_id=case_id,
            action=action_in.action,
            result=action_in.result.value if hasattr(action_in.result, "value") else str(action_in.result),
            notes=action_in.notes
        )
        db.add(action)
        db.commit()
        db.refresh(action)
        return action

    @staticmethod
    def resolve_case(db: Session, case_id: str, resolution: str) -> Optional[SupportCase]:
        case = db.query(SupportCase).filter(SupportCase.id == case_id).first()
        if not case:
            return None

        case.resolution = resolution
        case.status = CaseStatus.RESOLVED.value
        case.closed_at = datetime.utcnow()
        db.commit()
        db.refresh(case)
        return case
