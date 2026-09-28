from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.schema import Customer, SupportCase, Memory, CustomerPreference, EnvironmentSnapshot
from app.schemas.api_models import CustomerCreate

class CustomerService:

    @staticmethod
    def get_all_customers(db: Session) -> List[Customer]:
        return db.query(Customer).order_by(Customer.created_at.desc()).all()

    @staticmethod
    def get_customer_by_id(db: Session, customer_id: str) -> Optional[Customer]:
        return db.query(Customer).filter(Customer.id == customer_id).first()

    @staticmethod
    def get_customer_by_email(db: Session, email: str) -> Optional[Customer]:
        return db.query(Customer).filter(Customer.email == email).first()

    @staticmethod
    def create_customer(db: Session, customer_in: CustomerCreate) -> Customer:
        existing = db.query(Customer).filter(Customer.email == customer_in.email).first()
        if existing:
            return existing

        customer = Customer(
            name=customer_in.name,
            email=customer_in.email,
            environment=customer_in.environment or {}
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

        if customer_in.environment:
            snapshot = EnvironmentSnapshot(
                customer_id=customer.id,
                environment_data=customer_in.environment
            )
            db.add(snapshot)
            db.commit()

        return customer

    @staticmethod
    def update_environment(db: Session, customer_id: str, new_env: Dict[str, Any]) -> Optional[Customer]:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return None

        customer.environment = new_env
        snapshot = EnvironmentSnapshot(
            customer_id=customer.id,
            environment_data=new_env
        )
        db.add(snapshot)
        db.commit()
        db.refresh(customer)
        return customer

    @staticmethod
    def get_customer_history(db: Session, customer_id: str) -> Dict[str, Any]:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return {}

        cases = db.query(SupportCase).filter(SupportCase.customer_id == customer_id).order_by(SupportCase.created_at.desc()).all()
        memories = db.query(Memory).filter(Memory.customer_id == customer_id).order_by(Memory.created_at.desc()).all()
        preferences = db.query(CustomerPreference).filter(CustomerPreference.customer_id == customer_id).all()
        snapshots = db.query(EnvironmentSnapshot).filter(EnvironmentSnapshot.customer_id == customer_id).order_by(EnvironmentSnapshot.created_at.desc()).all()

        return {
            "customer": customer,
            "cases_count": len(cases),
            "memories_count": len(memories),
            "cases": cases,
            "memories": memories,
            "preferences": preferences,
            "environment_snapshots": snapshots
        }
