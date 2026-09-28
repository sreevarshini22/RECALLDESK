from typing import Dict, Any, Optional
from app.schemas.api_models import EnvironmentDiff

class EnvironmentChangeDetector:
    """
    Detects hardware, firmware, network, and environmental changes between
    historical customer profiles/snapshots and current interaction states.
    Prevents blind reuse of past solutions when underlying variables changed.
    """

    @staticmethod
    def compare(
        previous_env: Optional[Dict[str, Any]],
        current_env: Optional[Dict[str, Any]]
    ) -> EnvironmentDiff:
        prev = previous_env or {}
        curr = current_env or {}

        if not prev and not curr:
            return EnvironmentDiff(
                changed=False,
                differences={},
                previous_snapshot={},
                current_snapshot={},
                reasoning_implication="No prior environment recorded. Treating environment as fresh baseline."
            )

        differences: Dict[str, Dict[str, Any]] = {}
        all_keys = set(prev.keys()).union(curr.keys())

        for key in all_keys:
            prev_val = prev.get(key)
            curr_val = curr.get(key)
            
            # Normalize string comparisons
            if str(prev_val).strip().lower() != str(curr_val).strip().lower():
                differences[key] = {
                    "previous": prev_val,
                    "current": curr_val
                }

        changed = len(differences) > 0

        # Construct analytical reasoning implication
        if not changed:
            implication = "Environment is IDENTICAL to historical state. Historical outcomes and fixes carry direct applicability."
        else:
            diff_details = []
            for k, diff in differences.items():
                diff_details.append(f"{k} changed from '{diff['previous']}' to '{diff['current']}'")
            
            diff_str = "; ".join(diff_details)
            implication = (
                f"ENVIRONMENT CHANGED: {diff_str}. "
                "CRITICAL: Do NOT blindly apply previous fixes. Evaluate whether the new environment "
                "introduces new failure modes, default configs, or firmware behaviors."
            )

        return EnvironmentDiff(
            changed=changed,
            differences=differences,
            previous_snapshot=prev,
            current_snapshot=curr,
            reasoning_implication=implication
        )
