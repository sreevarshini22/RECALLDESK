from datetime import datetime
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# --- Enums ---
class MemoryType(str, Enum):
    EPISODIC = "EPISODIC"          # Specific previous customer interactions
    SEMANTIC = "SEMANTIC"          # General patterns learned
    PREFERENCE = "PREFERENCE"      # Customer communication preferences
    OUTCOME = "OUTCOME"            # What worked and what failed
    ENVIRONMENT = "ENVIRONMENT"    # Device/OS/Router/Network details

class ActionStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"

class CaseStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

# --- Customer Schemas ---
class CustomerBase(BaseModel):
    name: str
    email: str
    environment: Dict[str, Any] = Field(default_factory=dict)

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Environment Schemas ---
class EnvironmentSnapshotCreate(BaseModel):
    customer_id: str
    case_id: Optional[str] = None
    environment_data: Dict[str, Any]

class EnvironmentSnapshotResponse(BaseModel):
    id: str
    customer_id: str
    case_id: Optional[str] = None
    environment_data: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class EnvironmentDiff(BaseModel):
    changed: bool
    differences: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict,
        description="Key -> { 'previous': val, 'current': val }"
    )
    previous_snapshot: Dict[str, Any] = Field(default_factory=dict)
    current_snapshot: Dict[str, Any] = Field(default_factory=dict)
    reasoning_implication: str = ""

# --- Action Schemas ---
class ActionCreate(BaseModel):
    action: str
    result: ActionStatus
    notes: Optional[str] = None

class ActionResponse(BaseModel):
    id: str
    case_id: str
    action: str
    result: ActionStatus
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Memory Schemas ---
class MemoryCreate(BaseModel):
    customer_id: str
    memory_type: MemoryType
    content: str
    importance: float = Field(default=0.5, ge=0.0, le=1.0)
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    source_case_id: Optional[str] = None
    metadata_json: Dict[str, Any] = Field(default_factory=dict)

class MemoryResponse(BaseModel):
    id: str
    customer_id: str
    memory_type: MemoryType
    content: str
    importance: float
    confidence: float
    source_case_id: Optional[str] = None
    metadata_json: Dict[str, Any]
    created_at: datetime
    last_used: Optional[datetime] = None

    class Config:
        from_attributes = True

class MemoryWithRelevance(MemoryResponse):
    relevance_score: float = 0.0
    reason: str = ""
    is_applicable: bool = True
    environment_impact_warning: Optional[str] = None

class MemoryFeedbackCreate(BaseModel):
    was_useful: bool
    result: str = "HELPED_RESOLVE"
    notes: Optional[str] = None

class MemoryFeedbackResponse(BaseModel):
    id: str
    memory_id: str
    was_useful: bool
    result: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerPreferenceResponse(BaseModel):
    id: str
    customer_id: str
    preference: str
    confidence: float
    created_at: datetime

    class Config:
        from_attributes = True

# --- Case Schemas ---
class ChatMessage(BaseModel):
    role: str  # user, assistant, system, tool
    content: str
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

class SupportCaseCreate(BaseModel):
    customer_id: str
    problem: str
    conversation: List[ChatMessage] = Field(default_factory=list)
    environment: Optional[Dict[str, Any]] = None

class SupportCaseResponse(BaseModel):
    id: str
    customer_id: str
    problem: str
    conversation: List[Dict[str, Any]]
    resolution: Optional[str] = None
    status: CaseStatus
    created_at: datetime
    closed_at: Optional[datetime] = None
    actions: List[ActionResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

# --- Chat Request / Response with Hindsight Engine ---
class ChatRequest(BaseModel):
    customer_id: str
    case_id: Optional[str] = None
    message: str
    environment: Optional[Dict[str, Any]] = None
    auto_execute_diagnostics: bool = True

class DiagnosticResult(BaseModel):
    tool_name: str
    status: str
    output: Dict[str, Any]
    recommendation: str

class HindsightContext(BaseModel):
    retrieved_memories: List[MemoryWithRelevance] = Field(default_factory=list)
    previous_successful_solutions: List[str] = Field(default_factory=list)
    previous_failed_actions: List[str] = Field(default_factory=list)
    customer_preferences: List[str] = Field(default_factory=list)
    environment_diff: EnvironmentDiff
    reasoning_summary: str = ""
    agent_guidance: str = ""

class ChatResponse(BaseModel):
    response: str
    case_id: str
    customer_id: str
    hindsight_context: HindsightContext
    diagnostics_run: List[DiagnosticResult] = Field(default_factory=list)
    extracted_memories: List[MemoryResponse] = Field(default_factory=list)
    actions_attempted: List[ActionResponse] = Field(default_factory=list)
    case_status: CaseStatus
    is_demo_mode: bool = False

# --- Analytics Schemas ---
class AnalyticsMetric(BaseModel):
    total_customers: int
    total_support_cases: int
    memories_created: int
    memories_retrieved: int
    useful_memories: int
    successful_memory_reuse: int
    failed_action_avoidance: int
    avg_resolution_time_minutes: float
    memory_type_distribution: Dict[str, int]
    comparison_with_vs_without: Dict[str, Any]

# --- Demo Flow Schemas ---
class DemoStep(BaseModel):
    step_number: int
    title: str
    description: str
    phase: str
    details: Dict[str, Any]
    timeline_active_node: str
