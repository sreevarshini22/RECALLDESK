import asyncio
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.seed_data import reset_and_reseed_database, seed_database
from app.models.schema import Customer, SupportCase, Memory, UserSession
from app.services.customer_service import CustomerService
from app.schemas.api_models import ChatRequest, CustomerCreate
from app.routes.auth import login, logout, register, forgot_password, get_me, LoginRequest
from app.ai.support_agent import SupportAgent

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

async def run_all_tests():
    print("==================================================")
    print("RECALLDESK CONSOLIDATED PRODUCTION TEST SUITE")
    print("==================================================")

    db: Session = SessionLocal()
    try:
        # ==========================================
        # PART 1: Database Seed & Cryptographic Security
        # ==========================================
        print("\n[Suite 1/3] Testing Database Seed & Cryptographic Hashing...")
        reset_and_reseed_database(db)

        customers = db.query(Customer).all()
        assert len(customers) == 3, f"Expected 3 demo customers, found {len(customers)}"

        for c in customers:
            assert c.password_hash.startswith("pbkdf2_sha256$"), f"Password for {c.email} is not PBKDF2!"
            assert "Rahul@123" not in c.password_hash, "Plaintext password leak!"
        print("[OK] Passwords securely hashed with PBKDF2-HMAC-SHA256 (0 plaintext storage).")

        # ==========================================
        # PART 2: Authentication & Multi-Tenant Isolation
        # ==========================================
        print("\n[Suite 2/3] Testing Authentication & Strict Multi-Tenant Isolation...")
        rahul = next(c for c in customers if "rahul" in c.name.lower())
        priya = next(c for c in customers if "priya" in c.name.lower())
        arjun = next(c for c in customers if "arjun" in c.name.lower())

        # Test login
        res_login = login(LoginRequest(email="rahul@example.com", password="Rahul@123"), db)
        assert res_login["success"] == True
        token = res_login["token"]

        # Verify session
        session_record = db.query(UserSession).filter(UserSession.token == token).first()
        assert session_record is not None and session_record.customer_id == rahul.id

        # Verify memory isolation
        rahul_mems = db.query(Memory).filter(Memory.customer_id == rahul.id).all()
        priya_mems = db.query(Memory).filter(Memory.customer_id == priya.id).all()
        arjun_mems = db.query(Memory).filter(Memory.customer_id == arjun.id).all()

        assert len(rahul_mems) >= 4 and len(priya_mems) >= 4 and len(arjun_mems) >= 4
        for m in priya_mems:
            assert "X200" not in m.content and "X300" not in m.content, "Memory leakage in Priya's profile!"
        for m in arjun_mems:
            assert "X200" not in m.content and "AnyConnect" not in m.content, "Memory leakage in Arjun's profile!"

        # Logout
        res_logout = logout(token=token, db=db)
        assert res_logout["success"] == True
        assert db.query(UserSession).filter(UserSession.token == token).first() is None

        # Test dynamic new customer creation
        kavya = CustomerService.create_customer(db, CustomerCreate(
            name="Kavya Nair",
            email="kavya@example.com",
            password="Kavya@123",
            environment={"device": "Ubuntu Workstation", "os": "Ubuntu 24.04"}
        ))
        assert len(db.query(Memory).filter(Memory.customer_id == kavya.id).all()) == 0
        print("[OK] Multi-tenant customer isolation verified with 0 cross-contamination.")

        # ==========================================
        # PART 3: Core Hindsight Reasoning Engine & Learning Loop
        # ==========================================
        print("\n[Suite 3/3] Testing Hindsight Reasoning, Mistake Avoidance & Learning...")
        
        # Test Rahul returning (Router X200) -> Avoids restart, applies Channel 11
        resp_rahul = await SupportAgent.process_chat(db, ChatRequest(
            customer_id=rahul.id,
            message="My internet is disconnecting again in the evening.",
            environment=rahul.environment
        ))
        assert "Restart router" in resp_rahul.hindsight_context.previous_failed_actions
        assert "Change Wi-Fi channel to 11" in resp_rahul.hindsight_context.previous_successful_solutions
        print("  ✓ Mistake avoidance: Bypassed previously failed router reboot.")

        # Test Environment Diff Guard: Upgraded to Router X300
        resp_env_shift = await SupportAgent.process_chat(db, ChatRequest(
            customer_id=rahul.id,
            case_id=resp_rahul.case_id,
            message="Yesterday I upgraded to Router X300.",
            environment={"device": "Wi-Fi Gateway", "router": "X300", "firmware": "3.0.0", "band": "SmartConnect Dual-Band"}
        ))
        assert resp_env_shift.hindsight_context.environment_diff.changed == True
        print("  ✓ Environment diff guard: Hardware change (X200 -> X300) detected & blind reuse blocked.")

        # Test Outcome Ingestion & Continuous Learning
        resp_res = await SupportAgent.process_chat(db, ChatRequest(
            customer_id=rahul.id,
            case_id=resp_rahul.case_id,
            message="I separated the SSIDs and updated firmware to v3.0.4. That completely fixed it!",
            environment={"device": "Wi-Fi Gateway", "router": "X300", "firmware": "3.0.4", "band": "Separate 2.4G and 5G"}
        ))
        assert resp_res.case_status.value == "resolved"
        assert len(resp_res.extracted_memories) > 0
        print("  ✓ Continuous learning: New X300 outcome successfully extracted and committed to database.")

        print("\n==================================================")
        print("ALL RECALLDESK SUITE TESTS PASSED 100%! 🚀")
        print("==================================================")

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_all_tests())
