from enum import Enum

class MemoryType(str, Enum):
    EPISODIC = "EPISODIC"          # Specific previous customer interactions (e.g., "Evening disconnects on X200 resolved by channel change")
    SEMANTIC = "SEMANTIC"          # General patterns learned (e.g., "Evening Wi-Fi congestion in high-density areas causes 2.4GHz interference")
    PREFERENCE = "PREFERENCE"      # Customer communication preferences (e.g., "Prefers concise, step-by-step instructions without jargon")
    OUTCOME = "OUTCOME"            # Explicit what worked vs what failed (e.g., "Router restart FAILED; Wi-Fi channel change SUCCEEDED")
    ENVIRONMENT = "ENVIRONMENT"    # Hardware, firmware, ISP, topology (e.g., "Router: X200, Firmware: 2.1, ISP: FiberNet")

MEMORY_TYPE_WEIGHTS = {
    MemoryType.OUTCOME: 1.25,
    MemoryType.ENVIRONMENT: 1.20,
    MemoryType.PREFERENCE: 1.10,
    MemoryType.EPISODIC: 1.05,
    MemoryType.SEMANTIC: 1.00,
}
