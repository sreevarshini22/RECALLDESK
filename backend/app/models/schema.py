import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    environment = Column(JSON, default=dict)  # {"router": "X200", "firmware": "2.1", ...}
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    cases = relationship("SupportCase", back_populates="customer", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="customer", cascade="all, delete-orphan")
    preferences = relationship("CustomerPreference", back_populates="customer", cascade="all, delete-orphan")
    environment_snapshots = relationship("EnvironmentSnapshot", back_populates="customer", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="customer", cascade="all, delete-orphan")

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False, index=True)
    token = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="sessions")

class SupportCase(Base):
    __tablename__ = "support_cases"

    id = Column(String, primary_key=True, default=generate_uuid)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False, index=True)
    problem = Column(Text, nullable=False)
    conversation = Column(JSON, default=list)  # [{"role": "user", "content": "..."}, ...]
    resolution = Column(Text, nullable=True)
    status = Column(String(50), default="open")  # open, in_progress, resolved, closed
    created_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="cases")
    actions = relationship("Action", back_populates="case", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="source_case")
    environment_snapshots = relationship("EnvironmentSnapshot", back_populates="case")

class Memory(Base):
    __tablename__ = "memories"

    id = Column(String, primary_key=True, default=generate_uuid)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False, index=True)
    memory_type = Column(String(50), nullable=False, index=True)  # EPISODIC, SEMANTIC, PREFERENCE, OUTCOME, ENVIRONMENT
    content = Column(Text, nullable=False)
    importance = Column(Float, default=0.5)  # 0.0 to 1.0
    confidence = Column(Float, default=0.8)  # 0.0 to 1.0
    source_case_id = Column(String, ForeignKey("support_cases.id"), nullable=True)
    metadata_json = Column(JSON, default=dict)  # tags, environment, action_ref
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime, nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="memories")
    source_case = relationship("SupportCase", back_populates="memories")
    feedback = relationship("MemoryFeedback", back_populates="memory", cascade="all, delete-orphan")

class Action(Base):
    __tablename__ = "actions"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("support_cases.id"), nullable=False, index=True)
    action = Column(String(255), nullable=False)
    result = Column(String(50), nullable=False)  # SUCCESS, FAILED, PENDING, PARTIAL
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    case = relationship("SupportCase", back_populates="actions")

class CustomerPreference(Base):
    __tablename__ = "customer_preferences"

    id = Column(String, primary_key=True, default=generate_uuid)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False, index=True)
    preference = Column(Text, nullable=False)
    confidence = Column(Float, default=0.8)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="preferences")

class MemoryFeedback(Base):
    __tablename__ = "memory_feedback"

    id = Column(String, primary_key=True, default=generate_uuid)
    memory_id = Column(String, ForeignKey("memories.id"), nullable=False, index=True)
    was_useful = Column(Boolean, nullable=False)
    result = Column(String(100), default="HELPED_RESOLVE")  # HELPED_RESOLVE, PREVENTED_FAILURE, IRRELEVANT, OUTDATED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    memory = relationship("Memory", back_populates="feedback")

class EnvironmentSnapshot(Base):
    __tablename__ = "environment_snapshots"

    id = Column(String, primary_key=True, default=generate_uuid)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False, index=True)
    case_id = Column(String, ForeignKey("support_cases.id"), nullable=True)
    environment_data = Column(JSON, default=dict)  # {"router": "X200", "firmware": "2.1", ...}
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="environment_snapshots")
    case = relationship("SupportCase", back_populates="environment_snapshots")
