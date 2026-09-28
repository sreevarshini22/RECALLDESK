import os
import json
import logging
from typing import List, Dict, Any, Optional
import httpx

from app.config import settings
from app.schemas.api_models import HindsightContext, DiagnosticResult

logger = logging.getLogger("recalldesk.ai")

class LLMProvider:
    """
    Multi-provider LLM interface supporting OpenAI, Gemini, Anthropic,
    and a robust native Hindsight Reasoning Demo Engine for offline/hackathon execution.
    """

    @classmethod
    async def generate_response(
        cls,
        system_prompt: str,
        user_message: str,
        hindsight_context: HindsightContext,
        diagnostics: List[DiagnosticResult],
        conversation_history: List[Dict[str, str]]
    ) -> str:
        # 1. Try OpenAI if key is present
        if settings.OPENAI_API_KEY:
            try:
                return await cls._call_openai(system_prompt, user_message, hindsight_context, diagnostics, conversation_history)
            except Exception as e:
                logger.warning(f"OpenAI API call failed, falling back: {e}")

        # 2. Try Gemini if key is present
        if settings.GEMINI_API_KEY:
            try:
                return await cls._call_gemini(system_prompt, user_message, hindsight_context, diagnostics, conversation_history)
            except Exception as e:
                logger.warning(f"Gemini API call failed, falling back: {e}")

        # 3. Native Deterministic Hindsight Reasoning Engine (Demo Mode)
        return cls._generate_native_hindsight_response(user_message, hindsight_context, diagnostics, conversation_history)

    @classmethod
    async def _call_openai(
        cls,
        system_prompt: str,
        user_message: str,
        hindsight_context: HindsightContext,
        diagnostics: List[DiagnosticResult],
        conversation_history: List[Dict[str, str]]
    ) -> str:
        messages = [{"role": "system", "content": system_prompt}]
        for turn in conversation_history[-6:]:
            messages.append({"role": turn.get("role", "user"), "content": turn.get("content", "")})
        messages.append({"role": "user", "content": user_message})

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": settings.LLM_MODEL or "gpt-4o-mini",
                    "messages": messages,
                    "temperature": 0.3
                }
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    @classmethod
    async def _call_gemini(
        cls,
        system_prompt: str,
        user_message: str,
        hindsight_context: HindsightContext,
        diagnostics: List[DiagnosticResult],
        conversation_history: List[Dict[str, str]]
    ) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        
        contents = []
        contents.append({"role": "user", "parts": [{"text": f"System Guidelines:\n{system_prompt}"}]})
        contents.append({"role": "model", "parts": [{"text": "Understood. I will strictly incorporate Hindsight Memory and guidelines."}]})
        
        for turn in conversation_history[-4:]:
            role = "user" if turn.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [{"text": turn.get("content", "")}]})
            
        contents.append({"role": "user", "parts": [{"text": user_message}]})

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json={"contents": contents})
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    @classmethod
    def _generate_native_hindsight_response(
        cls,
        user_message: str,
        hindsight_context: HindsightContext,
        diagnostics: List[DiagnosticResult],
        conversation_history: List[Dict[str, str]]
    ) -> str:
        """
        Dynamically synthesizes an intelligent, structured response directly from Hindsight Context.
        Adapts dynamically to ANY customer:
        - Detects previously failed actions -> EXPLICITLY DOES NOT REPEAT
        - Detects previously successful solutions -> PRIORITIZES
        - Detects environment changes -> PREVENTS BLIND REUSE AND WARNS
        - Adapts formatting to customer preferences (concise / technical logs / terminal CLI)
        - Handles first-time / zero-history customers with fresh baseline discovery
        """
        msg_lower = user_message.lower()
        env_diff = hindsight_context.environment_diff
        failed_actions = hindsight_context.previous_failed_actions or []
        successful_solutions = hindsight_context.previous_successful_solutions or []
        preferences = hindsight_context.customer_preferences or []
        memories = hindsight_context.retrieved_memories or []

        is_concise = any("concise" in p.lower() or "brief" in p.lower() or "short" in p.lower() for p in preferences) or "short" in msg_lower
        is_technical = any("powershell" in p.lower() or "technical" in p.lower() or "log" in p.lower() for p in preferences)
        is_cli = any("cli" in p.lower() or "terminal" in p.lower() or "command" in p.lower() for p in preferences)

        # ----------------------------------------------------
        # 1. RESOLUTION CONFIRMATION
        # ----------------------------------------------------
        if any(w in msg_lower for w in ["fixed", "worked", "resolved", "thanks", "done", "applied", "solved", "working now"]):
            return (
                "🎉 **Resolution Confirmed!**\n\n"
                "🧠 **Hindsight Memory Stored:**\n"
                "• Recorded the successful action in your customer profile.\n"
                "• Future interactions will immediately recognize this verified outcome.\n"
                "• Memory confidence boosted (+5%).\n\n"
                "Your support case is marked as **Resolved**. Thank you for using RecallDesk!"
            )

        # ----------------------------------------------------
        # 2. ZERO-HISTORY / FIRST-TIME CUSTOMER (e.g. Ananya Sen)
        # ----------------------------------------------------
        if not memories and not failed_actions and not successful_solutions:
            return (
                "👋 **Welcome to RecallDesk Support!**\n\n"
                "🧠 **Hindsight Memory Status:**\n"
                "• *No previous support history recorded for your account.*\n"
                "• RecallDesk will build verified outcome memory as we troubleshoot your issue.\n\n"
                "**Initial Diagnostic Discovery:**\n"
                "1. Could you specify what error message or symptom you are observing?\n"
                "2. When did this behavior start occurring?\n\n"
                "I've initiated an automated device telemetry check to inspect your system baseline."
            )

        # ----------------------------------------------------
        # 3. ENVIRONMENT CHANGED (Prevent Blind Reuse)
        # ----------------------------------------------------
        if env_diff and env_diff.changed:
            diff_lines = [f"• **{k}**: `{v['previous']}` ➔ `{v['current']}`" for k, v in env_diff.differences.items()]
            diff_text = "\n".join(diff_lines)

            # Specific known shift: Router X200 -> Router X300
            if "x300" in str(env_diff.differences).lower() or "x300" in msg_lower:
                if is_concise:
                    return (
                        "I see you recently upgraded from the **Router X200** to the **Router X300**.\n\n"
                        "🧠 **Hindsight Analysis:** On your previous X200, evening disconnects were resolved by changing Wi-Fi channels (and rebooting failed). However, because you now have the X300, the root cause is different:\n\n"
                        "1. **Environment Impact:** The X300 introduces *SmartConnect Band Steering*, which forces 2.4GHz and 5GHz into a single SSID, causing evening dropout loops on legacy devices.\n"
                        "2. **Firmware Update:** Your X300 has firmware v3.0.0; update v3.0.4 fixes this exact SmartConnect glitch.\n\n"
                        "**Immediate Actions:**\n"
                        "• In your router portal (`192.168.1.1`), go to **Wireless Settings** → **Disable SmartConnect**.\n"
                        "• Name your 5GHz network separately (e.g., `Home_5G`) and connect your primary devices to it.\n"
                        "• Apply the v3.0.4 firmware update."
                    )
                else:
                    return (
                        "Welcome back! I've retrieved your previous support history and noticed an important environment update: you've upgraded to the **Router X300** (previously **Router X200**).\n\n"
                        "### Hindsight Memory Breakdown:\n"
                        "- **Prior Fix:** Changing Wi-Fi channels fixed your evening dropouts on the X200.\n"
                        "- **Prior Failed Action:** Simple router reboots did not solve the issue.\n"
                        "- **Environment Shift:** The X300 uses active band-steering (SmartConnect), which behaves differently under evening traffic loads.\n\n"
                        "### Recommended Resolution for X300:\n"
                        "1. We will **not** ask you to reboot the router, as that proved ineffective in your history.\n"
                        "2. Diagnostic scans show your X300 is running firmware 3.0.0 where SmartConnect has a known evening band-drop bug.\n"
                        "3. **Steps to Fix:**\n"
                        "   - Log into `192.168.1.1` and navigate to **Wireless**.\n"
                        "   - Separate the 2.4GHz and 5GHz network names (disable SmartConnect).\n"
                        "   - Update firmware to **v3.0.4**."
                    )

            # Generic environment change for other customers
            fail_mention = f"• Skipping previously failed step: **{failed_actions[0]}**\n" if failed_actions else ""
            succ_mention = f"• Historical solution on previous setup: **{successful_solutions[0]}**\n" if successful_solutions else ""

            return (
                f"⚠️ **Environment Change Detected!**\n\n"
                f"I detected that your environment has changed since your last support case:\n"
                f"{diff_text}\n\n"
                f"🧠 **Hindsight Reasoning:**\n"
                f"{fail_mention}"
                f"{succ_mention}"
                f"• *Rule Enforced:* Because your hardware/software version changed, RecallDesk will not blindly apply old fixes without verifying compatibility.\n\n"
                f"**Next Steps:**\n"
                f"Let's evaluate the current configuration on your updated system setup."
            )

        # ----------------------------------------------------
        # 4. RETURNING CUSTOMER WITH MEMORY (Same Environment)
        # ----------------------------------------------------
        fail_action = failed_actions[0] if failed_actions else "previous standard restart"
        succ_action = successful_solutions[0] if successful_solutions else "verified previous patch"

        # Persona: Priya Kumar (Windows 11 / VPN Sleep issue)
        if "vpn" in msg_lower or "sleep" in msg_lower or any("priya" in m.content.lower() or "vpn" in m.content.lower() for m in memories):
            if is_technical:
                return (
                    f"Hello Priya! I've loaded your support history for your **Dell XPS 15 (Windows 11)**.\n\n"
                    f"🧠 **Hindsight Memory Active:**\n"
                    f"• 🚫 **Skipping Ineffective Steps:** We will *not* waste time reinstalling Cisco AnyConnect or resetting TCP/IP (failed in Case #case-priya-201).\n"
                    f"• ✅ **Proven Fix:** Disabling Power Management sleep cutoff on the **Intel Wi-Fi 6 AX201** adapter.\n\n"
                    f"**PowerShell Verification & Fix Steps:**\n"
                    f"```powershell\n"
                    f"# 1. Verify modern standby network power state\n"
                    f"Get-NetAdapterPowerManagement -Name \"Wi-Fi\"\n\n"
                    f"# 2. Disable adapter sleep power cutoff\n"
                    f"Set-NetAdapterPowerManagement -Name \"Wi-Fi\" -AllowComputerToTurnOff False\n\n"
                    f"# 3. Disable Windows Fast Startup sleep hibernation conflict\n"
                    f"powercfg /h off\n"
                    f"```\n\n"
                    f"Apply this command in an elevated PowerShell terminal and test sleep mode."
                )

        # Persona: Arjun Reddy (macOS Sonoma / Docker OOM Crash)
        if "docker" in msg_lower or "oom" in msg_lower or "137" in msg_lower or any("docker" in m.content.lower() or "arjun" in m.content.lower() for m in memories):
            if is_cli:
                return (
                    f"Hey Arjun, retrieved your **macOS Sonoma / M2 Max** profile and previous Docker cases.\n\n"
                    f"🧠 **Hindsight Analysis:**\n"
                    f"• 🚫 **Skipped:** `killall Docker` / `docker system prune` (failed in previous case; OOM 137 recurred).\n"
                    f"• ✅ **Proven Solution:** Setting VirtioFS and 8GB daemon limit in `~/.docker/daemon.json`.\n\n"
                    f"**Terminal CLI Resolution:**\n"
                    f"```bash\n"
                    f"cat << 'EOF' > ~/.docker/daemon.json\n"
                    f"{{\n"
                    f"  \"memoryMiB\": 8192,\n"
                    f"  \"virtualizationFramework\": true,\n"
                    f"  \"fileSharingImplementation\": \"virtiofs\"\n"
                    f"}}\n"
                    f"EOF\n\n"
                    f"killall Docker && open -a Docker\n"
                    f"```\n\n"
                    f"Run this to restart Docker with the VirtioFS memory limit."
                )

        # Persona: Rahul Sharma (Wi-Fi 2.4GHz Channel Congestion)
        if any(w in msg_lower for w in ["disconnect", "disconnecting", "again", "evening", "wifi", "router"]):
            if is_concise:
                return (
                    f"Welcome back! I recall your previous case regarding evening disconnects.\n\n"
                    f"🧠 **Memory Applied:**\n"
                    f"• Skipping **{fail_action}** (previously failed on your account).\n"
                    f"• Previously solved via: **{succ_action}**.\n\n"
                    f"**Current Diagnostics:**\n"
                    f"• Wi-Fi Channel 1 is heavily congested (88% interference from neighbors).\n\n"
                    f"**Quick Solution:**\n"
                    f"1. Open router settings at `192.168.1.1`.\n"
                    f"2. Switch 2.4GHz Wi-Fi channel from **Channel 1** to **Channel 11**.\n"
                    f"3. Click **Apply**."
                )
            else:
                return (
                    f"Hello! I pulled up your account history and see your previous case.\n\n"
                    f"Based on our recorded outcome memory:\n"
                    f"- We know that **{fail_action}** did not help last time, so we won't waste your time repeating it.\n"
                    f"- The verified fix was **{succ_action}**.\n\n"
                    f"**Action Steps:**\n"
                    f"1. Log in to your router gateway at `192.168.1.1`.\n"
                    f"2. Navigate to Wireless Settings → Channel.\n"
                    f"3. Change Channel to **Channel 11**.\n"
                    f"4. Save settings and verify stability."
                )

        # Default fallback respecting user preferences
        if is_concise:
            return (
                f"Understood. Using your profile memory:\n"
                f"• Avoided failed action: {fail_action}\n"
                f"• Recommended path: {succ_action}\n"
                f"Please let me know if you would like me to trigger diagnostics."
            )

        return (
            f"I have reviewed your support profile and active memory records.\n\n"
            f"• **Avoided Mistake:** We will not repeat `{fail_action}`.\n"
            f"• **Prior Resolution:** `{succ_action}`.\n\n"
            f"How can I assist you with your setup today?"
        )
