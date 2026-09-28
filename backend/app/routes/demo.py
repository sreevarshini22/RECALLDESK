from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.seed_data import reset_and_reseed_database, seed_database
from app.models.schema import Customer, SupportCase, Memory, Action, EnvironmentSnapshot
from app.ai.support_agent import SupportAgent
from app.schemas.api_models import ChatRequest, CaseStatus

router = APIRouter(prefix="/api/demo", tags=["demo"])

class RunDemoRequest(BaseModel):
    customer_id: Optional[str] = "cust-rahul-001"

def build_demo_steps_for_customer(customer: Customer, cases: List[SupportCase], memories: List[Memory]) -> List[Dict[str, Any]]:
    c_name = customer.name
    c_email = customer.email
    c_id = customer.id
    env = customer.environment or {}

    # Extract historical action outcomes from customer's memories
    failed_act = "Standard Restart / Basic troubleshooting"
    succ_act = "Tailored subsystem configuration"
    pref_text = "Standard support preferences"

    for m in memories:
        meta = m.metadata_json or {}
        if "failed_actions" in meta and meta["failed_actions"]:
            failed_act = meta["failed_actions"][0]
        if "successful_actions" in meta and meta["successful_actions"]:
            succ_act = meta["successful_actions"][0]
        if m.memory_type == "PREFERENCE":
            pref_text = m.content.replace("Customer Preference: ", "")

    # Customer 1: Rahul (Router X200 -> X300)
    if "rahul" in c_name.lower():
        return [
            {
                "step_number": 1,
                "title": "Historical Support Interaction",
                "phase": "HISTORICAL_EPISODE",
                "timeline_node": "FIRST_INTERACTION",
                "description": f"Customer {c_name} reported evening Wi-Fi dropouts. Router restart failed; switching to Wi-Fi Channel 11 succeeded.",
                "details": {
                    "customer": f"{c_name} ({c_email})",
                    "device": "Router X200 (Firmware 2.1.0)",
                    "failed_action": "Restart router (ineffective)",
                    "successful_action": "Change Wi-Fi channel to 11 (resolved interference)",
                    "preference": pref_text
                }
            },
            {
                "step_number": 2,
                "title": "Memory Extraction Engine",
                "phase": "EXTRACTION",
                "timeline_node": "PROBLEM_ACTIONS_RESOLVED",
                "description": "Distills high-signal facts, failed actions, success paths, and preferences without storing raw conversation blobs.",
                "details": {
                    "extracted_facts": [
                        "Issue: Evening disconnections between 8-9 PM",
                        "Failed Action: Router reboot was ineffective",
                        "Success Path: Channel 11 migration avoided neighbor interference",
                        "Communication Preference: Concise bullet points"
                    ]
                }
            },
            {
                "step_number": 3,
                "title": "Structured Memory Creation",
                "phase": "STORAGE",
                "timeline_node": "MEMORY_CREATED",
                "description": "Creates distinct customer memory records (OUTCOME, EPISODIC, PREFERENCE, ENVIRONMENT).",
                "details": {
                    "customer_id": c_id,
                    "memory_types_created": [
                        {"type": "OUTCOME", "importance": 0.95, "content": "SUCCESS: Channel 11 | FAILED: Router restart"},
                        {"type": "EPISODIC", "importance": 0.85, "content": "Case #case-rahul-101: Resolved evening dropouts on X200"},
                        {"type": "PREFERENCE", "importance": 0.80, "content": pref_text},
                        {"type": "ENVIRONMENT", "importance": 0.85, "content": "Router: X200, Firmware: 2.1.0, ISP: FiberNet"}
                    ]
                }
            },
            {
                "step_number": 4,
                "title": "Customer Returns with Similar Issue",
                "phase": "RECURRENCE",
                "timeline_node": "CUSTOMER_RETURNS",
                "description": f"{c_name} reaches out again: 'My internet is disconnecting again in the evening.'",
                "details": {
                    "incoming_query": "My internet is disconnecting again in the evening.",
                    "customer_id": c_id
                }
            },
            {
                "step_number": 5,
                "title": "Hindsight Memory Retrieval",
                "phase": "RETRIEVAL",
                "timeline_node": "MEMORY_RETRIEVED",
                "description": f"Engine executes strict customer isolation (customer_id={c_id}) and vector similarity ranking.",
                "details": {
                    "retrieved_memories_count": len(memories),
                    "top_memory": f"OUTCOME: {succ_act} (SUCCEEDED) | {failed_act} (FAILED)",
                    "avoidance_flag": f"DO NOT suggest {failed_act}"
                }
            },
            {
                "step_number": 6,
                "title": "Environment Change Detection",
                "phase": "DIFF_ANALYSIS",
                "timeline_node": "ENVIRONMENT_COMPARED",
                "description": "Customer upgrades router to X300. System detects hardware difference and alerts agent.",
                "details": {
                    "historical_router": "X200",
                    "current_router": "X300",
                    "firmware_diff": "2.1.0 -> 3.0.0",
                    "agent_alert": "⚠️ ENVIRONMENT CHANGED: Do NOT blindly assume Channel 11 applies to X300 SmartConnect architecture."
                }
            },
            {
                "step_number": 7,
                "title": "Adaptive Hindsight Response",
                "phase": "SYNTHESIS",
                "timeline_node": "ADAPTIVE_RESPONSE",
                "description": "Agent combines PAST EXPERIENCE (no reboots) + ENVIRONMENT SHIFT (X300 SmartConnect) + PREFERENCE (concise).",
                "details": {
                    "action_skipped": "Router reboot (marked as previously ineffective)",
                    "diagnostic_finding": "X300 SmartConnect band-steering dropout loop",
                    "tailored_instructions": "1. Disable SmartConnect at 192.168.1.1. 2. Separate SSIDs. 3. Update firmware to v3.0.4."
                }
            },
            {
                "step_number": 8,
                "title": "New Outcome Verification",
                "phase": "OUTCOME",
                "timeline_node": "NEW_OUTCOME",
                "description": "Customer applies the X300 SSID separation and firmware update: 'That completely fixed it!'",
                "details": {
                    "resolution_state": "SUCCESS",
                    "verified_fix": "X300 SmartConnect disable & separate 2.4GHz/5GHz SSIDs"
                }
            },
            {
                "step_number": 9,
                "title": "Memory Graph & Feedback Update",
                "phase": "CONTINUOUS_LEARNING",
                "timeline_node": "MEMORY_UPDATED",
                "description": "New outcome memory stored for X300. System is smarter for the next call.",
                "details": {
                    "new_memory": "OUTCOME: X300 evening dropouts resolved by disabling SmartConnect & firmware v3.0.4",
                    "feedback_recorded": "HELPED_RESOLVE (+5% confidence boost)"
                }
            }
        ]

    # Customer 2: Priya (Windows 11 / VPN Sleep drop)
    elif "priya" in c_name.lower():
        return [
            {
                "step_number": 1,
                "title": "Historical Support Interaction",
                "phase": "HISTORICAL_EPISODE",
                "timeline_node": "FIRST_INTERACTION",
                "description": f"Customer {c_name} reported VPN drops on sleep. Reinstalling VPN client failed; disabling Intel Wi-Fi power-save succeeded.",
                "details": {
                    "customer": f"{c_name} ({c_email})",
                    "device": "Dell XPS 15 (Windows 11 Pro)",
                    "failed_action": "Reinstall AnyConnect & reset TCP/IP (failed)",
                    "successful_action": "Disable Intel AX201 Power Management sleep cutoff",
                    "preference": pref_text
                }
            },
            {
                "step_number": 2,
                "title": "Memory Extraction Engine",
                "phase": "EXTRACTION",
                "timeline_node": "PROBLEM_ACTIONS_RESOLVED",
                "description": "Distills technical root causes and customer's preference for PowerShell scripts.",
                "details": {
                    "extracted_facts": [
                        "Issue: VPN disconnects during Windows 11 Modern Standby",
                        "Failed Action: Client reinstall does not fix OS-level power cutoff",
                        "Success Path: Intel AX201 Device Manager power-saving disable",
                        "Communication Preference: PowerShell / CLI log analysis"
                    ]
                }
            },
            {
                "step_number": 3,
                "title": "Structured Memory Creation",
                "phase": "STORAGE",
                "timeline_node": "MEMORY_CREATED",
                "description": f"Stored isolated memories tagged to {c_id}.",
                "details": {
                    "customer_id": c_id,
                    "memory_types_created": [
                        {"type": "OUTCOME", "importance": 0.95, "content": "SUCCESS: Disable Intel AX201 power save | FAILED: VPN reinstall"},
                        {"type": "EPISODIC", "importance": 0.85, "content": "Case #case-priya-201: Resolved Dell XPS VPN drops"},
                        {"type": "PREFERENCE", "importance": 0.80, "content": pref_text}
                    ]
                }
            },
            {
                "step_number": 4,
                "title": "Customer Returns with Similar Issue",
                "phase": "RECURRENCE",
                "timeline_node": "CUSTOMER_RETURNS",
                "description": f"{c_name} returns: 'VPN is disconnecting again after the latest Windows cumulative update.'",
                "details": {
                    "incoming_query": "VPN is disconnecting again after Windows update.",
                    "customer_id": c_id
                }
            },
            {
                "step_number": 5,
                "title": "Hindsight Memory Retrieval",
                "phase": "RETRIEVAL",
                "timeline_node": "MEMORY_RETRIEVED",
                "description": f"Retrieves ONLY Priya's records ({c_id}). Rahul's router records are completely excluded.",
                "details": {
                    "customer_isolation": "VERIFIED (0 cross-customer leak)",
                    "top_memory": "OUTCOME: Power management disable SUCCEEDED | VPN reinstall FAILED",
                    "avoidance_flag": "DO NOT suggest reinstalling AnyConnect"
                }
            },
            {
                "step_number": 6,
                "title": "Environment Comparison",
                "phase": "DIFF_ANALYSIS",
                "timeline_node": "ENVIRONMENT_COMPARED",
                "description": "Windows Update reset the network adapter power policy back to default.",
                "details": {
                    "os_build": "Windows 11 Build 22631",
                    "driver_state": "Intel AX201 power cutoff re-enabled by OS update"
                }
            },
            {
                "step_number": 7,
                "title": "Adaptive Technical Response",
                "phase": "SYNTHESIS",
                "timeline_node": "ADAPTIVE_RESPONSE",
                "description": "Provides instant PowerShell verification script directly without generic fluff.",
                "details": {
                    "action_skipped": "VPN client reinstallation",
                    "provided_solution": "Set-NetAdapterPowerManagement -Name 'Wi-Fi' -AllowComputerToTurnOff False"
                }
            },
            {
                "step_number": 8,
                "title": "Outcome Verification",
                "phase": "OUTCOME",
                "timeline_node": "NEW_OUTCOME",
                "description": "Priya executes the PowerShell script: 'Applied and VPN stays connected across sleep cycles!'",
                "details": {
                    "resolution_state": "SUCCESS"
                }
            },
            {
                "step_number": 9,
                "title": "Memory Reinforced",
                "phase": "CONTINUOUS_LEARNING",
                "timeline_node": "MEMORY_UPDATED",
                "description": f"Reinforced confidence for {c_name}'s power management memory.",
                "details": {
                    "customer_id": c_id,
                    "status": "Continuously learning"
                }
            }
        ]

    # Customer 3: Arjun (macOS / Docker OOM)
    elif "arjun" in c_name.lower():
        return [
            {
                "step_number": 1,
                "title": "Historical Support Interaction",
                "phase": "HISTORICAL_EPISODE",
                "timeline_node": "FIRST_INTERACTION",
                "description": f"Customer {c_name} reported Docker daemon OOM crash on macOS. `killall Docker` failed; daemon.json VirtioFS limits succeeded.",
                "details": {
                    "customer": f"{c_name} ({c_email})",
                    "device": "MacBook Pro M2 Max (macOS Sonoma)",
                    "failed_action": "killall Docker & docker system prune (ineffective)",
                    "successful_action": "Configure daemon.json VirtioFS and 8GB RAM limit",
                    "preference": pref_text
                }
            },
            {
                "step_number": 2,
                "title": "Memory Extraction Engine",
                "phase": "EXTRACTION",
                "timeline_node": "PROBLEM_ACTIONS_RESOLVED",
                "description": "Extracts exact CLI configuration without conversational bloat.",
                "details": {
                    "extracted_facts": [
                        "Issue: Docker daemon OOM error 137 during multi-stage builds",
                        "Failed Action: Docker restart/prune does not fix memory leak",
                        "Success Path: VirtioFS & daemon.json 8GB swap configuration",
                        "Communication Preference: Direct terminal commands"
                    ]
                }
            },
            {
                "step_number": 3,
                "title": "Structured Memory Creation",
                "phase": "STORAGE",
                "timeline_node": "MEMORY_CREATED",
                "description": f"Stored structured memories for {c_id}.",
                "details": {
                    "customer_id": c_id,
                    "memory_types_created": [
                        {"type": "OUTCOME", "importance": 0.95, "content": "SUCCESS: VirtioFS daemon.json | FAILED: prune/killall"},
                        {"type": "EPISODIC", "importance": 0.85, "content": "Case #case-arjun-301: Docker OOM fix"}
                    ]
                }
            },
            {
                "step_number": 4,
                "title": "Customer Returns with Similar Issue",
                "phase": "RECURRENCE",
                "timeline_node": "CUSTOMER_RETURNS",
                "description": f"{c_name} reports: 'Docker build crashing with error 137 again.'",
                "details": {
                    "incoming_query": "Docker build crashing with error 137 again.",
                    "customer_id": c_id
                }
            },
            {
                "step_number": 5,
                "title": "Hindsight Memory Retrieval",
                "phase": "RETRIEVAL",
                "timeline_node": "MEMORY_RETRIEVED",
                "description": f"Retrieves ONLY Arjun's records ({c_id}).",
                "details": {
                    "top_memory": "OUTCOME: VirtioFS SUCCEEDED | Prune/killall FAILED",
                    "avoidance_flag": "DO NOT suggest running docker system prune"
                }
            },
            {
                "step_number": 6,
                "title": "Environment Comparison",
                "phase": "DIFF_ANALYSIS",
                "timeline_node": "ENVIRONMENT_COMPARED",
                "description": "Verified macOS environment and daemon settings.",
                "details": {
                    "device": "MacBook Pro M2 Max",
                    "os": "macOS Sonoma"
                }
            },
            {
                "step_number": 7,
                "title": "Adaptive CLI Response",
                "phase": "SYNTHESIS",
                "timeline_node": "ADAPTIVE_RESPONSE",
                "description": "Responds with exact bash command block to update daemon.json.",
                "details": {
                    "action_skipped": "killall / system prune",
                    "cli_solution": "cat << 'EOF' > ~/.docker/daemon.json ..."
                }
            },
            {
                "step_number": 8,
                "title": "Outcome Verification",
                "phase": "OUTCOME",
                "timeline_node": "NEW_OUTCOME",
                "description": "Arjun runs the CLI snippet: 'Container build finished in 35s. Fixed!'",
                "details": {
                    "resolution_state": "SUCCESS"
                }
            },
            {
                "step_number": 9,
                "title": "Memory Reinforced",
                "phase": "CONTINUOUS_LEARNING",
                "timeline_node": "MEMORY_UPDATED",
                "description": "Reinforces confidence for Docker optimization memory.",
                "details": {
                    "customer_id": c_id
                }
            }
        ]

    # Customer 4: Ananya (Zero-History Customer)
    else:
        return [
            {
                "step_number": 1,
                "title": "Customer Inquiry (Zero History)",
                "phase": "HISTORICAL_EPISODE",
                "timeline_node": "FIRST_INTERACTION",
                "description": f"{c_name} reaches out for the very first time. No prior cases or memories exist.",
                "details": {
                    "customer": f"{c_name} ({c_email})",
                    "status": "🧠 No Hindsight Memory Yet",
                    "note": "Fresh baseline interaction with zero historical baggage"
                }
            },
            {
                "step_number": 2,
                "title": "Memory Retrieval Check",
                "phase": "RETRIEVAL",
                "timeline_node": "MEMORY_RETRIEVED",
                "description": f"Querying memories where customer_id = '{c_id}'.",
                "details": {
                    "retrieved_memories_count": 0,
                    "status": "Zero memories returned. No cross-customer leakage."
                }
            },
            {
                "step_number": 3,
                "title": "Baseline Diagnostic Discovery",
                "phase": "SYNTHESIS",
                "timeline_node": "ADAPTIVE_RESPONSE",
                "description": "Agent initiates respectful discovery questions tailored to the customer's mobile environment.",
                "details": {
                    "environment": str(env),
                    "approach": "Baseline diagnosis & telemetry collection"
                }
            },
            {
                "step_number": 4,
                "title": "Troubleshooting & Solution Application",
                "phase": "OUTCOME",
                "timeline_node": "NEW_OUTCOME",
                "description": f"Agent identifies root cause and provides resolution to {c_name}.",
                "details": {
                    "solution_applied": "Initial setup configuration applied successfully"
                }
            },
            {
                "step_number": 5,
                "title": "First Structured Memory Created!",
                "phase": "CONTINUOUS_LEARNING",
                "timeline_node": "MEMORY_UPDATED",
                "description": f"System extracts and stores the very first OUTCOME memory for {c_name}.",
                "details": {
                    "customer_id": c_id,
                    "newly_stored_memory": "OUTCOME: First verified resolution stored for future continuity",
                    "future_benefit": "Next time Ananya calls, RecallDesk will remember!"
                }
            }
        ]

@router.get("/steps")
def get_demo_steps(customer_id: Optional[str] = Query("cust-rahul-001"), db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        customer = db.query(Customer).first()
    
    if not customer:
        customer = seed_database(db)

    cases = db.query(SupportCase).filter(SupportCase.customer_id == customer.id).all()
    memories = db.query(Memory).filter(Memory.customer_id == customer.id).all()

    return build_demo_steps_for_customer(customer, cases, memories)

@router.post("/reset")
def reset_demo(db: Session = Depends(get_db)):
    rahul = reset_and_reseed_database(db)
    return {
        "status": "success",
        "message": "Demo state reset successfully to baseline.",
        "customer": {
            "id": rahul.id,
            "name": rahul.name,
            "email": rahul.email,
            "environment": rahul.environment
        }
    }

@router.post("/run")
async def run_full_demo(req: Optional[RunDemoRequest] = None, db: Session = Depends(get_db)):
    cust_id = req.customer_id if req and req.customer_id else "cust-rahul-001"
    customer = db.query(Customer).filter(Customer.id == cust_id).first()
    if not customer:
        customer = db.query(Customer).first()
    
    if not customer:
        customer = reset_and_reseed_database(db)

    cases = db.query(SupportCase).filter(SupportCase.customer_id == customer.id).all()
    memories = db.query(Memory).filter(Memory.customer_id == customer.id).all()

    steps = build_demo_steps_for_customer(customer, cases, memories)

    # Dynamic simulation based on customer
    if "rahul" in customer.name.lower():
        chat_req = ChatRequest(
            customer_id=customer.id,
            message="My internet is disconnecting again in the evening. Yesterday I upgraded my router to X300.",
            environment={
                "device": "Wi-Fi Gateway",
                "router": "X300",
                "firmware": "3.0.0",
                "isp": "FiberNet",
                "band": "Dual-Band SmartConnect"
            },
            auto_execute_diagnostics=True
        )
        chat_resp = await SupportAgent.process_chat(db, chat_req)

        confirm_req = ChatRequest(
            customer_id=customer.id,
            case_id=chat_resp.case_id,
            message="I disabled SmartConnect and updated the firmware to v3.0.4. That completely fixed it!",
            environment={
                "device": "Wi-Fi Gateway",
                "router": "X300",
                "firmware": "3.0.4",
                "isp": "FiberNet",
                "band": "Separate 2.4G and 5G"
            }
        )
        confirm_resp = await SupportAgent.process_chat(db, confirm_req)

    elif "priya" in customer.name.lower():
        chat_req = ChatRequest(
            customer_id=customer.id,
            message="VPN is disconnecting again whenever my laptop enters sleep mode. Should I reinstall Cisco AnyConnect?",
            environment={
                "device": "Dell XPS 15",
                "os": "Windows 11 Pro",
                "vpn_client": "Cisco AnyConnect 4.10",
                "network_adapter": "Intel Wi-Fi 6 AX201"
            },
            auto_execute_diagnostics=True
        )
        chat_resp = await SupportAgent.process_chat(db, chat_req)

        confirm_req = ChatRequest(
            customer_id=customer.id,
            case_id=chat_resp.case_id,
            message="I ran the PowerShell command to disable the sleep power cutoff. VPN is now rock solid and staying connected across sleep! That solved it.",
            environment={
                "device": "Dell XPS 15",
                "os": "Windows 11 Pro",
                "power_management": "Sleep Cutoff Disabled"
            }
        )
        confirm_resp = await SupportAgent.process_chat(db, confirm_req)

    elif "arjun" in customer.name.lower():
        chat_req = ChatRequest(
            customer_id=customer.id,
            message="Docker build crashed with error 137 again. Should I run docker system prune?",
            environment={
                "device": "MacBook Pro M2 Max",
                "os": "macOS Sonoma 14.4",
                "docker_version": "Docker Desktop 4.28.0"
            },
            auto_execute_diagnostics=True
        )
        chat_resp = await SupportAgent.process_chat(db, chat_req)

        confirm_req = ChatRequest(
            customer_id=customer.id,
            case_id=chat_resp.case_id,
            message="Updated daemon.json with VirtioFS and restarted Docker. Multi-stage build completed without OOM crash! All fixed.",
            environment={
                "device": "MacBook Pro M2 Max",
                "os": "macOS Sonoma 14.4",
                "file_sharing": "VirtioFS Active"
            }
        )
        confirm_resp = await SupportAgent.process_chat(db, confirm_req)

    else:
        # Ananya (New customer)
        chat_req = ChatRequest(
            customer_id=customer.id,
            message="Hello, my mobile app push notifications are not arriving on my Android device.",
            environment=customer.environment,
            auto_execute_diagnostics=True
        )
        chat_resp = await SupportAgent.process_chat(db, chat_req)

        confirm_req = ChatRequest(
            customer_id=customer.id,
            case_id=chat_resp.case_id,
            message="I enabled background data permission and battery optimization whitelist. Notifications are working now, thanks!",
            environment=customer.environment
        )
        confirm_resp = await SupportAgent.process_chat(db, confirm_req)

    return {
        "status": "success",
        "demo_timeline_completed": True,
        "steps": steps,
        "case_id": chat_resp.case_id,
        "customer_id": customer.id,
        "initial_agent_response": chat_resp.response,
        "resolution_agent_response": confirm_resp.response,
        "hindsight_context": chat_resp.hindsight_context,
        "newly_extracted_memories": confirm_resp.extracted_memories
    }
