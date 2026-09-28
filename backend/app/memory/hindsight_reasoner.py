from typing import List, Dict, Any, Optional
from app.schemas.api_models import (
    MemoryWithRelevance,
    EnvironmentDiff,
    HindsightContext,
    MemoryType
)

class HindsightReasoningEngine:
    """
    Synthesizes past experiences, failed action warnings, successful resolutions,
    customer preferences, and hardware environment changes into an authoritative
    Hindsight Context that prevents amnesia, repeated mistakes, and naive assumptions.
    """

    @classmethod
    def synthesize_context(
        cls,
        current_query: str,
        retrieved_memories: List[MemoryWithRelevance],
        env_diff: EnvironmentDiff,
        current_env: Optional[Dict[str, Any]] = None
    ) -> HindsightContext:
        successful_solutions: List[str] = []
        failed_actions: List[str] = []
        preferences: List[str] = []
        
        for mem in retrieved_memories:
            meta = mem.metadata_json or {}
            
            # Extract success/fail from metadata or content
            if "successful_actions" in meta:
                successful_solutions.extend(meta["successful_actions"])
            elif "resolution" in meta:
                successful_solutions.append(meta["resolution"])
            elif "SUCCESS" in mem.content:
                successful_solutions.append(mem.content)

            if "failed_actions" in meta:
                failed_actions.extend(meta["failed_actions"])
            elif "FAILED" in mem.content:
                failed_actions.append(mem.content)

            if mem.memory_type == MemoryType.PREFERENCE:
                cleaned_pref = mem.content.replace("Customer Preference: ", "")
                if cleaned_pref not in preferences:
                    preferences.append(cleaned_pref)

        # Deduplicate while preserving order
        successful_solutions = list(dict.fromkeys(successful_solutions))
        failed_actions = list(dict.fromkeys(failed_actions))
        preferences = list(dict.fromkeys(preferences))

        # Build reasoning summary and agent guidance
        guidance_points: List[str] = []
        summary_points: List[str] = []

        if failed_actions:
            fail_str = ", ".join(failed_actions)
            guidance_points.append(
                f"🚫 DO NOT REPEAT FAILED ACTIONS: The following were previously attempted and FAILED: [{fail_str}]. Do NOT ask the customer to repeat these unless circumstances radically require it."
            )
            summary_points.append(f"Identified {len(failed_actions)} previously failed action(s) to avoid repeating.")

        if env_diff.changed:
            diff_desc = ", ".join([f"{k} ({v['previous']} -> {v['current']})" for k, v in env_diff.differences.items()])
            guidance_points.append(
                f"⚠️ ENVIRONMENT CHANGED ({diff_desc}): Do NOT blindly assume previous solutions will work on the new hardware. "
                "Acknowledge the hardware change, analyze the new device's architecture (e.g. SmartConnect band-steering, firmware defaults), "
                "and treat previous experience as evidence rather than dogma."
            )
            summary_points.append(f"Hardware/environment change detected: {diff_desc}.")
        elif successful_solutions:
            succ_str = ", ".join(successful_solutions)
            guidance_points.append(
                f"✅ PREVIOUS PROVEN FIX: Under the same environment, the following resolved the issue: [{succ_str}]. Prioritize this or related diagnostics immediately."
            )
            summary_points.append(f"Historical successful solution found: {succ_str}.")

        if preferences:
            pref_str = " | ".join(preferences)
            guidance_points.append(f"🎯 CUSTOMER PREFERENCES: {pref_str}. Adapt tone and brevity accordingly.")
            summary_points.append(f"Applied communication preference: {pref_str}.")

        if not retrieved_memories:
            summary_points.append("No prior history found. Operating in standard diagnostic baseline mode.")
            guidance_points.append("Fresh interaction: Proceed with baseline discovery questions and non-intrusive diagnostics.")

        reasoning_summary = " ".join(summary_points)
        agent_guidance = "\n".join(guidance_points)

        return HindsightContext(
            retrieved_memories=retrieved_memories,
            previous_successful_solutions=successful_solutions,
            previous_failed_actions=failed_actions,
            customer_preferences=preferences,
            environment_diff=env_diff,
            reasoning_summary=reasoning_summary,
            agent_guidance=agent_guidance
        )
