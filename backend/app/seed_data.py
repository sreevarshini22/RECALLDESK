from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.schema import (
    Customer,
    SupportCase,
    Memory,
    Action,
    CustomerPreference,
    EnvironmentSnapshot,
    MemoryFeedback,
    UserSession
)
from app.schemas.api_models import MemoryType, ActionStatus, CaseStatus
from app.security import hash_password

def seed_database(db: Session = None):
    should_close = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        should_close = True

    try:
        # Check if already seeded
        existing = db.query(Customer).first()
        if existing:
            return existing

        now = datetime.utcnow()

        # ==========================================
        # 1. CUSTOMER 1: Rahul Sharma (Wi-Fi / Router)
        # Email: rahul@example.com / Password: Rahul@123
        # ==========================================
        t_rahul = now - timedelta(days=7)
        rahul = Customer(
            id="cust-rahul-001",
            name="Rahul Sharma",
            email="rahul@example.com",
            password_hash=hash_password("Rahul@123"),
            environment={
                "device": "Wi-Fi Gateway",
                "router": "X200",
                "firmware": "2.1.0",
                "isp": "FiberNet",
                "band": "2.4GHz",
                "topology": "Single Router, 8 Connected Devices"
            },
            created_at=t_rahul
        )
        db.add(rahul)
        db.commit()
        db.refresh(rahul)

        snap_rahul = EnvironmentSnapshot(
            id="snap-rahul-001",
            customer_id=rahul.id,
            environment_data={
                "device": "Wi-Fi Gateway",
                "router": "X200",
                "firmware": "2.1.0",
                "isp": "FiberNet",
                "band": "2.4GHz"
            },
            created_at=t_rahul
        )
        db.add(snap_rahul)

        pref_rahul = CustomerPreference(
            id="pref-rahul-001",
            customer_id=rahul.id,
            preference="Customer prefers concise, step-by-step instructions without technical jargon.",
            confidence=0.95,
            created_at=t_rahul
        )
        db.add(pref_rahul)

        case_rahul = SupportCase(
            id="case-rahul-101",
            customer_id=rahul.id,
            problem="My internet disconnects every evening around 8 PM.",
            conversation=[
                {
                    "role": "user",
                    "content": "My internet disconnects every evening around 8 PM. Keep instructions brief please.",
                    "timestamp": t_rahul.isoformat()
                },
                {
                    "role": "assistant",
                    "content": "Let's first try restarting your router to clear the internal cache.",
                    "timestamp": (t_rahul + timedelta(minutes=2)).isoformat()
                },
                {
                    "role": "user",
                    "content": "I restarted it. It worked for 5 minutes but disconnected again.",
                    "timestamp": (t_rahul + timedelta(minutes=10)).isoformat()
                },
                {
                    "role": "assistant",
                    "content": "Diagnostic scan shows high neighbor interference on 2.4GHz Channel 1. Please switch your Wi-Fi channel to Channel 11 in router settings.",
                    "timestamp": (t_rahul + timedelta(minutes=12)).isoformat()
                },
                {
                    "role": "user",
                    "content": "Switched to Channel 11. That completely solved the evening disconnection issue!",
                    "timestamp": (t_rahul + timedelta(minutes=25)).isoformat()
                }
            ],
            resolution="Wi-Fi channel change from Channel 1 to Channel 11 resolved evening disconnection.",
            status=CaseStatus.RESOLVED.value,
            created_at=t_rahul,
            closed_at=t_rahul + timedelta(minutes=30)
        )
        db.add(case_rahul)
        db.commit()
        db.refresh(case_rahul)

        act_rahul_1 = Action(
            id="act-rahul-001",
            case_id=case_rahul.id,
            action="Restart router",
            result=ActionStatus.FAILED.value,
            notes="Ineffective. Disconnections resumed within 5 minutes due to channel congestion.",
            created_at=t_rahul + timedelta(minutes=5)
        )
        act_rahul_2 = Action(
            id="act-rahul-002",
            case_id=case_rahul.id,
            action="Change Wi-Fi channel to 11",
            result=ActionStatus.SUCCESS.value,
            notes="Successfully resolved evening interference and dropouts.",
            created_at=t_rahul + timedelta(minutes=20)
        )
        db.add_all([act_rahul_1, act_rahul_2])

        mem_rahul_1 = Memory(
            id="mem-rahul-001",
            customer_id=rahul.id,
            memory_type=MemoryType.OUTCOME.value,
            content="Issue 'Internet disconnects every evening': SUCCESSFUL: Change Wi-Fi channel to 11 | FAILED / INEFFECTIVE: Restart router",
            importance=0.95,
            confidence=0.95,
            source_case_id=case_rahul.id,
            metadata_json={
                "successful_actions": ["Change Wi-Fi channel to 11"],
                "failed_actions": ["Restart router"],
                "environment": {"router": "X200", "firmware": "2.1.0"}
            },
            created_at=t_rahul + timedelta(minutes=30),
            last_used=now - timedelta(days=2)
        )
        mem_rahul_2 = Memory(
            id="mem-rahul-002",
            customer_id=rahul.id,
            memory_type=MemoryType.EPISODIC.value,
            content="Case #case-rahul-101: Customer experienced recurring evening internet dropouts on Router X200. Resolved by switching Wi-Fi channel to 11.",
            importance=0.85,
            confidence=0.90,
            source_case_id=case_rahul.id,
            metadata_json={
                "problem": "Internet disconnects every evening",
                "resolution": "Wi-Fi channel change from Channel 1 to Channel 11 resolved evening disconnection.",
                "environment": {"router": "X200"}
            },
            created_at=t_rahul + timedelta(minutes=30)
        )
        mem_rahul_3 = Memory(
            id="mem-rahul-003",
            customer_id=rahul.id,
            memory_type=MemoryType.PREFERENCE.value,
            content="Customer Preference: Customer prefers concise, step-by-step instructions without unnecessary technical jargon.",
            importance=0.80,
            confidence=0.95,
            source_case_id=case_rahul.id,
            metadata_json={"source": "case-rahul-101"},
            created_at=t_rahul + timedelta(minutes=30)
        )
        mem_rahul_4 = Memory(
            id="mem-rahul-004",
            customer_id=rahul.id,
            memory_type=MemoryType.ENVIRONMENT.value,
            content="Environment Profile: router: X200, firmware: 2.1.0, isp: FiberNet, band: 2.4GHz",
            importance=0.85,
            confidence=0.95,
            source_case_id=case_rahul.id,
            metadata_json={"environment": {"router": "X200", "firmware": "2.1.0", "isp": "FiberNet"}},
            created_at=t_rahul + timedelta(minutes=30)
        )
        db.add_all([mem_rahul_1, mem_rahul_2, mem_rahul_3, mem_rahul_4])

        fb_rahul = MemoryFeedback(
            id="fb-rahul-001",
            memory_id=mem_rahul_1.id,
            was_useful=True,
            result="HELPED_RESOLVE",
            notes="Prevented repeating router restart and provided immediate resolution path.",
            created_at=t_rahul + timedelta(minutes=30)
        )
        db.add(fb_rahul)

        # ==========================================
        # 2. CUSTOMER 2: Priya Kumar (Windows 11 / VPN Sleep Disconnect)
        # Email: priya@example.com / Password: Priya@123
        # ==========================================
        t_priya = now - timedelta(days=5)
        priya = Customer(
            id="cust-priya-002",
            name="Priya Kumar",
            email="priya@example.com",
            password_hash=hash_password("Priya@123"),
            environment={
                "device": "Dell XPS 15 (9520)",
                "os": "Windows 11 Pro (Build 22631)",
                "vpn_client": "Cisco AnyConnect 4.10",
                "network_adapter": "Intel Wi-Fi 6 AX201",
                "power_state": "Modern Standby Enabled"
            },
            created_at=t_priya
        )
        db.add(priya)
        db.commit()
        db.refresh(priya)

        snap_priya = EnvironmentSnapshot(
            id="snap-priya-001",
            customer_id=priya.id,
            environment_data={
                "device": "Dell XPS 15 (9520)",
                "os": "Windows 11 Pro (Build 22631)",
                "vpn_client": "Cisco AnyConnect 4.10",
                "network_adapter": "Intel Wi-Fi 6 AX201"
            },
            created_at=t_priya
        )
        db.add(snap_priya)

        pref_priya = CustomerPreference(
            id="pref-priya-001",
            customer_id=priya.id,
            preference="Customer prefers technical log analysis, PowerShell verification scripts, and root-cause explanations.",
            confidence=0.95,
            created_at=t_priya
        )
        db.add(pref_priya)

        case_priya = SupportCase(
            id="case-priya-201",
            customer_id=priya.id,
            problem="Corporate VPN disconnects and fails to reconnect whenever laptop enters sleep mode or idles.",
            conversation=[
                {
                    "role": "user",
                    "content": "Corporate VPN disconnects and fails to reconnect whenever laptop enters sleep mode or idles. Please provide PowerShell diagnostic steps.",
                    "timestamp": t_priya.isoformat()
                },
                {
                    "role": "assistant",
                    "content": "Let's first reinstall the Cisco AnyConnect adapter and reset Windows TCP/IP stack using `netsh int ip reset`.",
                    "timestamp": (t_priya + timedelta(minutes=3)).isoformat()
                },
                {
                    "role": "user",
                    "content": "Reinstalled AnyConnect and reset TCP/IP stack. Problem still persists upon sleep.",
                    "timestamp": (t_priya + timedelta(minutes=15)).isoformat()
                },
                {
                    "role": "assistant",
                    "content": "Analyzed Windows Modern Standby power event logs. Intel AX201 is cutting D3 power state to save battery. In Device Manager -> Intel Wi-Fi AX201 -> Properties -> Power Management, uncheck 'Allow computer to turn off this device to save power'. Also disable Fast Startup.",
                    "timestamp": (t_priya + timedelta(minutes=18)).isoformat()
                },
                {
                    "role": "user",
                    "content": "Disabled the power management sleep cutoff on Intel AX201 and Fast Startup. VPN stays permanently connected across sleep!",
                    "timestamp": (t_priya + timedelta(minutes=28)).isoformat()
                }
            ],
            resolution="Disabled Intel AX201 Wi-Fi power-saving sleep cutoff in Windows 11 Device Manager, preventing VPN keepalive drop.",
            status=CaseStatus.RESOLVED.value,
            created_at=t_priya,
            closed_at=t_priya + timedelta(minutes=30)
        )
        db.add(case_priya)
        db.commit()
        db.refresh(case_priya)

        act_priya_1 = Action(
            id="act-priya-001",
            case_id=case_priya.id,
            action="Reinstall Cisco AnyConnect & reset TCP/IP stack",
            result=ActionStatus.FAILED.value,
            notes="Ineffective. Windows Modern Standby continued dropping NIC power.",
            created_at=t_priya + timedelta(minutes=8)
        )
        act_priya_2 = Action(
            id="act-priya-002",
            case_id=case_priya.id,
            action="Disable Intel AX201 Power Management sleep cutoff & disable Fast Startup",
            result=ActionStatus.SUCCESS.value,
            notes="Successfully resolved VPN teardown during Windows 11 sleep.",
            created_at=t_priya + timedelta(minutes=25)
        )
        db.add_all([act_priya_1, act_priya_2])

        mem_priya_1 = Memory(
            id="mem-priya-001",
            customer_id=priya.id,
            memory_type=MemoryType.OUTCOME.value,
            content="Issue 'VPN disconnects on sleep': SUCCESSFUL: Disable Intel AX201 Power Management sleep cutoff & disable Fast Startup | FAILED / INEFFECTIVE: Reinstall Cisco AnyConnect & reset TCP/IP stack",
            importance=0.95,
            confidence=0.95,
            source_case_id=case_priya.id,
            metadata_json={
                "successful_actions": ["Disable Intel AX201 Power Management sleep cutoff & disable Fast Startup"],
                "failed_actions": ["Reinstall Cisco AnyConnect & reset TCP/IP stack"],
                "environment": {"device": "Dell XPS 15", "os": "Windows 11 Pro"}
            },
            created_at=t_priya + timedelta(minutes=30)
        )
        mem_priya_2 = Memory(
            id="mem-priya-002",
            customer_id=priya.id,
            memory_type=MemoryType.EPISODIC.value,
            content="Case #case-priya-201: Resolved Dell XPS Windows 11 VPN disconnections during sleep by disabling power-saving on Intel Wi-Fi adapter.",
            importance=0.85,
            confidence=0.90,
            source_case_id=case_priya.id,
            metadata_json={
                "problem": "VPN disconnects on sleep",
                "resolution": "Disabled Intel AX201 Wi-Fi power-saving sleep cutoff in Device Manager",
                "environment": {"device": "Dell XPS 15", "os": "Windows 11 Pro"}
            },
            created_at=t_priya + timedelta(minutes=30)
        )
        mem_priya_3 = Memory(
            id="mem-priya-003",
            customer_id=priya.id,
            memory_type=MemoryType.PREFERENCE.value,
            content="Customer Preference: Customer prefers technical log analysis, PowerShell verification scripts, and root-cause explanations.",
            importance=0.80,
            confidence=0.95,
            source_case_id=case_priya.id,
            metadata_json={"source": "case-priya-201"},
            created_at=t_priya + timedelta(minutes=30)
        )
        mem_priya_4 = Memory(
            id="mem-priya-004",
            customer_id=priya.id,
            memory_type=MemoryType.ENVIRONMENT.value,
            content="Environment Profile: device: Dell XPS 15, os: Windows 11 Pro, vpn: Cisco AnyConnect 4.10, adapter: Intel Wi-Fi 6 AX201",
            importance=0.85,
            confidence=0.95,
            source_case_id=case_priya.id,
            metadata_json={"environment": {"device": "Dell XPS 15", "os": "Windows 11 Pro", "vpn": "Cisco AnyConnect"}},
            created_at=t_priya + timedelta(minutes=30)
        )
        db.add_all([mem_priya_1, mem_priya_2, mem_priya_3, mem_priya_4])

        fb_priya = MemoryFeedback(
            id="fb-priya-001",
            memory_id=mem_priya_1.id,
            was_useful=True,
            result="HELPED_RESOLVE",
            notes="Avoided repetitive VPN reinstalls and fixed root cause in Windows power management.",
            created_at=t_priya + timedelta(minutes=30)
        )
        db.add(fb_priya)

        # ==========================================
        # 3. CUSTOMER 3: Arjun Reddy (macOS Sonoma / Docker OOM Crash)
        # Email: arjun@example.com / Password: Arjun@123
        # ==========================================
        t_arjun = now - timedelta(days=3)
        arjun = Customer(
            id="cust-arjun-003",
            name="Arjun Reddy",
            email="arjun@example.com",
            password_hash=hash_password("Arjun@123"),
            environment={
                "device": "MacBook Pro M2 Max (32GB Unified RAM)",
                "os": "macOS Sonoma 14.4",
                "docker_version": "Docker Desktop 4.28.0",
                "virtualization": "Virtualization Framework",
                "file_sharing": "VirtioFS Enabled"
            },
            created_at=t_arjun
        )
        db.add(arjun)
        db.commit()
        db.refresh(arjun)

        snap_arjun = EnvironmentSnapshot(
            id="snap-arjun-001",
            customer_id=arjun.id,
            environment_data={
                "device": "MacBook Pro M2 Max",
                "os": "macOS Sonoma 14.4",
                "docker_version": "Docker Desktop 4.28.0"
            },
            created_at=t_arjun
        )
        db.add(snap_arjun)

        pref_arjun = CustomerPreference(
            id="pref-arjun-001",
            customer_id=arjun.id,
            preference="Customer prefers direct terminal CLI commands with exact flags and zero GUI explanation.",
            confidence=0.95,
            created_at=t_arjun
        )
        db.add(pref_arjun)

        case_arjun = SupportCase(
            id="case-arjun-301",
            customer_id=arjun.id,
            problem="Docker daemon crashing and consuming 100% memory during container builds (OOM 137).",
            conversation=[
                {
                    "role": "user",
                    "content": "Docker daemon crashing and consuming 100% memory during container builds (OOM 137). Give terminal commands.",
                    "timestamp": t_arjun.isoformat()
                },
                {
                    "role": "assistant",
                    "content": "Run `killall Docker` followed by `docker system prune -a --volumes` to reset build cache.",
                    "timestamp": (t_arjun + timedelta(minutes=2)).isoformat()
                },
                {
                    "role": "user",
                    "content": "Ran prune and killed Docker. Next multi-stage build crashed again with OOM 137.",
                    "timestamp": (t_arjun + timedelta(minutes=10)).isoformat()
                },
                {
                    "role": "assistant",
                    "content": "Execute: `echo '{\"memoryMiB\": 8192, \"virtualizationFramework\": true, \"fileSharingImplementation\": \"virtiofs\"}' > ~/.docker/daemon.json` and restart with `killall Docker && open -a Docker`.",
                    "timestamp": (t_arjun + timedelta(minutes=12)).isoformat()
                },
                {
                    "role": "user",
                    "content": "Configured daemon.json with virtiofs and 8GB RAM limit. Build finished in 38s without crashing!",
                    "timestamp": (t_arjun + timedelta(minutes=20)).isoformat()
                }
            ],
            resolution="Configured VirtioFS and 8GB memory limits in ~/.docker/daemon.json, resolving macOS Docker memory leak.",
            status=CaseStatus.RESOLVED.value,
            created_at=t_arjun,
            closed_at=t_arjun + timedelta(minutes=25)
        )
        db.add(case_arjun)
        db.commit()
        db.refresh(case_arjun)

        act_arjun_1 = Action(
            id="act-arjun-001",
            case_id=case_arjun.id,
            action="killall Docker & docker system prune -a --volumes",
            result=ActionStatus.FAILED.value,
            notes="Ineffective. OOM error 137 recurred during large multi-stage build.",
            created_at=t_arjun + timedelta(minutes=5)
        )
        act_arjun_2 = Action(
            id="act-arjun-002",
            case_id=case_arjun.id,
            action="Configure ~/.docker/daemon.json memory limits & enable VirtioFS",
            result=ActionStatus.SUCCESS.value,
            notes="Successfully resolved macOS Docker memory exhaustion.",
            created_at=t_arjun + timedelta(minutes=18)
        )
        db.add_all([act_arjun_1, act_arjun_2])

        mem_arjun_1 = Memory(
            id="mem-arjun-001",
            customer_id=arjun.id,
            memory_type=MemoryType.OUTCOME.value,
            content="Issue 'Docker daemon memory crash': SUCCESSFUL: Configure ~/.docker/daemon.json memory limits & enable VirtioFS | FAILED / INEFFECTIVE: killall Docker & docker system prune -a --volumes",
            importance=0.95,
            confidence=0.95,
            source_case_id=case_arjun.id,
            metadata_json={
                "successful_actions": ["Configure ~/.docker/daemon.json memory limits & enable VirtioFS"],
                "failed_actions": ["killall Docker & docker system prune -a --volumes"],
                "environment": {"device": "MacBook Pro M2 Max", "os": "macOS Sonoma"}
            },
            created_at=t_arjun + timedelta(minutes=25)
        )
        mem_arjun_2 = Memory(
            id="mem-arjun-002",
            customer_id=arjun.id,
            memory_type=MemoryType.EPISODIC.value,
            content="Case #case-arjun-301: Fixed Docker daemon OOM 137 crashes on macOS Sonoma M2 by configuring VirtioFS and daemon limits.",
            importance=0.85,
            confidence=0.90,
            source_case_id=case_arjun.id,
            metadata_json={
                "problem": "Docker daemon crashing with OOM 137",
                "resolution": "Configured VirtioFS and 8GB memory limit in daemon.json",
                "environment": {"device": "MacBook Pro M2 Max", "os": "macOS Sonoma"}
            },
            created_at=t_arjun + timedelta(minutes=25)
        )
        mem_arjun_3 = Memory(
            id="mem-arjun-003",
            customer_id=arjun.id,
            memory_type=MemoryType.PREFERENCE.value,
            content="Customer Preference: Customer prefers direct terminal CLI commands with exact flags and zero GUI fluff.",
            importance=0.80,
            confidence=0.95,
            source_case_id=case_arjun.id,
            metadata_json={"source": "case-arjun-301"},
            created_at=t_arjun + timedelta(minutes=25)
        )
        mem_arjun_4 = Memory(
            id="mem-arjun-004",
            customer_id=arjun.id,
            memory_type=MemoryType.ENVIRONMENT.value,
            content="Environment Profile: device: MacBook Pro M2 Max, os: macOS Sonoma 14.4, docker: Docker Desktop 4.28.0",
            importance=0.85,
            confidence=0.95,
            source_case_id=case_arjun.id,
            metadata_json={"environment": {"device": "MacBook Pro M2 Max", "os": "macOS Sonoma", "docker": "4.28.0"}},
            created_at=t_arjun + timedelta(minutes=25)
        )
        db.add_all([mem_arjun_1, mem_arjun_2, mem_arjun_3, mem_arjun_4])

        fb_arjun = MemoryFeedback(
            id="fb-arjun-001",
            memory_id=mem_arjun_1.id,
            was_useful=True,
            result="HELPED_RESOLVE",
            notes="Eliminated repetitive prune cycles and solved memory leak via VirtioFS configuration.",
            created_at=t_arjun + timedelta(minutes=25)
        )
        db.add(fb_arjun)

        db.commit()
        return rahul

    finally:
        if should_close:
            db.close()

def reset_and_reseed_database(db: Session = None):
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # Drop all data & recreate
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        return seed_database(db)
    finally:
        if should_close:
            db.close()
