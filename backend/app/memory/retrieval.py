from datetime import datetime, timezone
import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.schema import Memory, Customer, SupportCase, EnvironmentSnapshot
from app.schemas.api_models import MemoryWithRelevance, MemoryType, EnvironmentDiff
from app.memory.types import MEMORY_TYPE_WEIGHTS
from app.ai.embeddings import embedding_engine
from app.config import settings

class MemoryRetrievalEngine:
    """
    Ranks and retrieves memories based on:
    1. Semantic similarity to current problem / utterance
    2. Memory importance & confidence
    3. Time recency decay
    4. Type-specific priority (OUTCOME > ENVIRONMENT > PREFERENCE > EPISODIC > SEMANTIC)
    5. Environment applicability cross-check
    """

    @staticmethod
    def calculate_recency_decay(created_at: datetime, half_life_days: int = 30) -> float:
        if not created_at:
            return 0.8
        
        # Ensure UTC/naive comparison
        now = datetime.utcnow()
        if created_at.tzinfo is not None:
            created_at = created_at.replace(tzinfo=None)
            
        age_days = max(0.0, (now - created_at).total_seconds() / 86400.0)
        # Exponential decay: 2^(-age / half_life)
        decay = math.pow(0.5, age_days / float(half_life_days))
        return max(0.2, min(1.0, decay))

    @classmethod
    def retrieve_and_rank(
        cls,
        db: Session,
        customer_id: str,
        current_query: str,
        current_env: Optional[Dict[str, Any]] = None,
        env_diff: Optional[EnvironmentDiff] = None,
        limit: int = 5
    ) -> List[MemoryWithRelevance]:
        # Fetch strictly memories belonging to this customer
        memories = db.query(Memory).filter(
            Memory.customer_id == customer_id
        ).all()

        if not memories:
            return []

        doc_texts = [f"{m.memory_type}: {m.content}" for m in memories]
        similarities = embedding_engine.compute_similarity(current_query, doc_texts)

        ranked_memories: List[MemoryWithRelevance] = []

        for mem, sim in zip(memories, similarities):
            type_enum = MemoryType(mem.memory_type) if mem.memory_type in MemoryType._value2member_map_ else MemoryType.EPISODIC
            type_weight = MEMORY_TYPE_WEIGHTS.get(type_enum, 1.0)
            recency_weight = cls.calculate_recency_decay(mem.created_at, settings.MEMORY_DECAY_HALF_LIFE_DAYS)
            
            # Hybrid relevance calculation
            # Base = 45% semantic similarity + 20% importance + 20% confidence + 15% recency
            raw_score = (
                (sim * 0.45) +
                (mem.importance * 0.20) +
                (mem.confidence * 0.20) +
                (recency_weight * 0.15)
            ) * type_weight

            # Normalize to [0.0, 1.0]
            relevance_score = min(1.0, max(0.0, raw_score))

            # Environment Impact Verification
            env_warning = None
            is_applicable = True
            
            if env_diff and env_diff.changed:
                mem_env = mem.metadata_json.get("environment", {}) if mem.metadata_json else {}
                mem_router = mem_env.get("router")
                curr_router = current_env.get("router") if current_env else None

                if mem_router and curr_router and mem_router.lower() != curr_router.lower():
                    env_warning = f"Recorded on {mem_router}, but current router is {curr_router}. Solution may not directly transfer."
                    if mem.memory_type in [MemoryType.OUTCOME.value, MemoryType.EPISODIC.value]:
                        is_applicable = False
                        # Slightly dampen relevance so agent knows it's a historical reference, not a direct recipe
                        relevance_score *= 0.85

            # Reason formulation
            reason_parts = []
            if sim > 0.4:
                reason_parts.append(f"High semantic overlap ({int(sim*100)}%)")
            elif sim > 0.2:
                reason_parts.append(f"Moderate relevance ({int(sim*100)}%)")
            else:
                reason_parts.append("Contextual profile knowledge")

            if mem.memory_type == MemoryType.OUTCOME.value:
                reason_parts.append("Contains verified past resolution/failure data")
            elif mem.memory_type == MemoryType.PREFERENCE.value:
                reason_parts.append("Guides communication tone and structure")
            elif mem.memory_type == MemoryType.ENVIRONMENT.value:
                reason_parts.append("Hardware/topology baseline")

            reason = " • ".join(reason_parts)

            ranked_mem = MemoryWithRelevance(
                id=mem.id,
                customer_id=mem.customer_id,
                memory_type=type_enum,
                content=mem.content,
                importance=mem.importance,
                confidence=mem.confidence,
                source_case_id=mem.source_case_id,
                metadata_json=mem.metadata_json or {},
                created_at=mem.created_at,
                last_used=mem.last_used,
                relevance_score=round(relevance_score, 3),
                reason=reason,
                is_applicable=is_applicable,
                environment_impact_warning=env_warning
            )

            # Filter only if meets minimum threshold
            if relevance_score >= settings.RELEVANCE_THRESHOLD or mem.memory_type in [MemoryType.PREFERENCE.value, MemoryType.ENVIRONMENT.value]:
                ranked_memories.append(ranked_mem)

        # Sort by relevance descending
        ranked_memories.sort(key=lambda x: x.relevance_score, reverse=True)
        return ranked_memories[:limit]
