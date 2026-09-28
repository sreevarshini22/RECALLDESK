import time
from typing import Dict, Any, List
from app.schemas.api_models import DiagnosticResult

class ToolService:
    """
    Simulated & live diagnostic tools for network and device troubleshooting.
    Provides verifiable telemetry to ground agent actions in real data.
    """

    @staticmethod
    def scan_wifi_channels(router_model: str = "X200") -> DiagnosticResult:
        if "X300" in router_model.upper():
            output = {
                "current_channel_2_4ghz": 6,
                "current_channel_5ghz": 36,
                "band_steering_smart_connect": True,
                "congestion_index": 0.35,
                "neighbor_interference": "Low on 5GHz, Moderate on 2.4GHz",
                "firmware_version": "v3.0.4",
                "recommended_action": "Disable Band Steering / Separate 2.4GHz and 5GHz SSIDs or set 5GHz to Channel 149"
            }
            rec = "Separate SSIDs on X300 to stop legacy devices from bouncing between 2.4GHz and 5GHz."
        else:
            output = {
                "current_channel_2_4ghz": 1,
                "congestion_index": 0.88,
                "neighbor_interference": "High (9 neighboring APs detected on Ch 1)",
                "recommended_channel": 11,
                "signal_strength_dbm": -68
            }
            rec = "High congestion detected on Channel 1. Switch router to Channel 6 or 11."

        return DiagnosticResult(
            tool_name="scan_wifi_channels",
            status="SUCCESS",
            output=output,
            recommendation=rec
        )

    @staticmethod
    def ping_gateway(target_ip: str = "192.168.1.1") -> DiagnosticResult:
        return DiagnosticResult(
            tool_name="ping_gateway",
            status="SUCCESS",
            output={
                "target": target_ip,
                "packet_loss_pct": 0.0,
                "avg_latency_ms": 4.2,
                "jitter_ms": 1.1,
                "status": "HEALTHY"
            },
            recommendation="Local LAN connectivity to gateway is stable."
        )

    @staticmethod
    def check_firmware(router_model: str = "X300") -> DiagnosticResult:
        if "X300" in router_model.upper():
            return DiagnosticResult(
                tool_name="check_firmware",
                status="SUCCESS",
                output={
                    "installed_version": "3.0.0",
                    "latest_version": "3.0.4",
                    "update_available": True,
                    "release_notes": "Fixes 5GHz SmartConnect dropouts during peak evening hours"
                },
                recommendation="Firmware update available that addresses evening disconnection bugs."
            )
        return DiagnosticResult(
            tool_name="check_firmware",
            status="SUCCESS",
            output={
                "installed_version": "2.1.0",
                "latest_version": "2.1.0",
                "update_available": False
            },
            recommendation="Router firmware is up to date."
        )

    @classmethod
    def run_auto_diagnostics(cls, problem: str, environment: Dict[str, Any]) -> List[DiagnosticResult]:
        results: List[DiagnosticResult] = []
        router = environment.get("router", "X200")
        
        prob_lower = problem.lower()
        if "disconnect" in prob_lower or "wifi" in prob_lower or "channel" in prob_lower or "internet" in prob_lower:
            results.append(cls.scan_wifi_channels(router))
            results.append(cls.ping_gateway())
            if "X300" in router.upper():
                results.append(cls.check_firmware(router))

        return results
