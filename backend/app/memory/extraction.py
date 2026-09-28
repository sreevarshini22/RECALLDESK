import re
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.schema import (
    Memory,
    Action,
    SupportCase,
    CustomerPreference,
    EnvironmentSnapshot,
    Customer
)
from app.schemas.api_models import MemoryType, ActionStatus
from app.config import settings

class MemoryExtractionEngine:
    """
    Extracts structured, high-signal memories from customer support interactions.
    Explicitly separates:
    - EPISODIC: Specific problem & resolution milestones
    - SEMANTIC: Domain-wide principles learned
    - PREFERENCE: Communication and instruction styles
    - OUTCOME: Verified successful actions vs failed actions
    - ENVIRONMENT: Device/hardware/network snapshots
    """

    @classmethod
    def extract_and_store_from_case(
        cls,
        db: Session,
        case: SupportCase,
        customer_env: Optional[Dict[str, Any]] = None
    ) -> List[Memory]:
        created_memories: List[Memory] = []
        customer_id = case.customer_id
        actions = case.actions or []
        conversation = case.conversation or []
        problem = case.problem or ""
        resolution = case.resolution or ""

        # 1. OUTCOME MEMORY: Group successful and failed actions
        successful_actions = [a for a in actions if a.result == ActionStatus.SUCCESS.value or a.result == "SUCCESS"]
        failed_actions = [a for a in actions if a.result == ActionStatus.FAILED.value or a.result == "FAILED"]

        if successful_actions or failed_actions:
            outcome_parts = []
            if successful_actions:
                succ_names = ", ".join([a.action for a in successful_actions])
                outcome_parts.append(f"SUCCESSFUL: {succ_names}")
            if failed_actions:
                fail_names = ", ".join([a.action for a in failed_actions])
                outcome_parts.append(f"FAILED / INEFFECTIVE: {fail_names}")

            outcome_text = f"Issue '{problem[:100]}': " + " | ".join(outcome_parts)
            
            outcome_mem = Memory(
                customer_id=customer_id,
                memory_type=MemoryType.OUTCOME.value,
                content=outcome_text,
                importance=0.95,
                confidence=0.90,
                source_case_id=case.id,
                metadata_json={
                    "successful_actions": [a.action for a in successful_actions],
                    "failed_actions": [a.action for a in failed_actions],
                    "environment": customer_env or {}
                }
            )
            db.add(outcome_mem)
            created_memories.append(outcome_mem)

        # 2. EPISODIC MEMORY: Specific problem and how it was resolved
        if resolution:
            episodic_text = f"Case #{case.id[:8]}: Customer reported '{problem}'. Resolved via: {resolution}"
            episodic_mem = Memory(
                customer_id=customer_id,
                memory_type=MemoryType.EPISODIC.value,
                content=episodic_text,
                importance=0.85,
                confidence=0.85,
                source_case_id=case.id,
                metadata_json={
                    "problem": problem,
                    "resolution": resolution,
                    "environment": customer_env or {}
                }
            )
            db.add(episodic_mem)
            created_memories.append(episodic_mem)

        # 3. PREFERENCE MEMORY: Detect customer communication tone & requirements
        pref_detected = cls._detect_preferences(conversation)
        for pref in pref_detected:
            # Check if preference already exists to avoid duplicates
            existing_pref = db.query(CustomerPreference).filter(
                CustomerPreference.customer_id == customer_id,
                CustomerPreference.preference.ilike(f"%{pref['preference'][:25]}%")
            ).first()

            if not existing_pref:
                pref_obj = CustomerPreference(
                    customer_id=customer_id,
                    preference=pref["preference"],
                    confidence=pref["confidence"]
                )
                db.add(pref_obj)

            pref_mem = Memory(
                customer_id=customer_id,
                memory_type=MemoryType.PREFERENCE.value,
                content=f"Customer Preference: {pref['preference']}",
                importance=0.75,
                confidence=pref["confidence"],
                source_case_id=case.id,
                metadata_json={"source": "conversation_analysis"}
            )
            db.add(pref_mem)
            created_memories.append(pref_mem)

        # 4. ENVIRONMENT MEMORY: Record device/hardware details
        if customer_env:
            env_summary_parts = [f"{k}: {v}" for k, v in customer_env.items() if v]
            if env_summary_parts:
                env_text = f"Environment Profile: {', '.join(env_summary_parts)}"
                
                # Check for existing environment memory with same content
                existing_env_mem = db.query(Memory).filter(
                    Memory.customer_id == customer_id,
                    Memory.memory_type == MemoryType.ENVIRONMENT.value,
                    Memory.content == env_text
                ).first()

                if not existing_env_mem:
                    env_mem = Memory(
                        customer_id=customer_id,
                        memory_type=MemoryType.ENVIRONMENT.value,
                        content=env_text,
                        importance=0.80,
                        confidence=0.95,
                        source_case_id=case.id,
                        metadata_json={"environment": customer_env}
                    )
                    db.add(env_mem)
                    created_memories.append(env_mem)

        # 5. SEMANTIC MEMORY: General pattern synthesis
        if successful_actions and any("channel" in a.action.lower() for a in successful_actions):
            sem_text = "Wi-Fi 2.4GHz evening congestion is frequently mitigated by channel switching (Channels 1, 6, 11) or migrating to 5GHz."
            existing_sem = db.query(Memory).filter(
                Memory.memory_type == MemoryType.SEMANTIC.value,
                Memory.content == sem_text
            ).first()
            if not existing_sem:
                sem_mem = Memory(
                    customer_id=customer_id,
                    memory_type=MemoryType.SEMANTIC.value,
                    content=sem_text,
                    importance=0.70,
                    confidence=0.90,
                    source_case_id=case.id,
                    metadata_json={"domain": "networking", "topic": "wifi_interference"}
                )
                db.add(sem_mem)
                created_memories.append(sem_mem)

        db.commit()
        for mem in created_memories:
            db.refresh(mem)
            
        return created_memories

    @classmethod
    def _detect_preferences(cls, conversation: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        preferences = []
        full_text = " ".join([turn.get("content", "") for turn in conversation if turn.get("role") == "user"]).lower()

        if any(keyword in full_text for keyword in ["short", "quick", "concise", "brief", "bullet points", "no jargon", "just tell me"]):
            preferences.append({
                "preference": "Customer prefers concise, step-by-step instructions without unnecessary technical jargon.",
                "confidence": 0.90
            })
        elif any(keyword in full_text for keyword in ["technical details", "logs", "command line", "explain why", "detailed"]):
            preferences.append({
                "preference": "Customer prefers detailed technical explanations and root-cause analysis.",
                "confidence": 0.85
            })

        return preferences
