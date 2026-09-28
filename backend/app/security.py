import os
import hashlib
import secrets
from typing import Optional

def hash_password(password: str) -> str:
    """
    Hashes a plain password using standard cryptographically secure PBKDF2-HMAC-SHA256
    with 100,000 iterations and a 16-byte random salt.
    Format: pbkdf2_sha256$iterations$salt_hex$hash_hex
    """
    iterations = 100_000
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        iterations
    )
    return f"pbkdf2_sha256${iterations}${salt.hex()}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against the stored hash in constant time.
    """
    if not hashed_password or not plain_password:
        return False
    
    try:
        parts = hashed_password.split('$')
        if len(parts) != 4 or parts[0] != 'pbkdf2_sha256':
            return False
        
        iterations = int(parts[1])
        salt = bytes.fromhex(parts[2])
        expected_key = bytes.fromhex(parts[3])
        
        computed_key = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt,
            iterations
        )
        return secrets.compare_digest(computed_key, expected_key)
    except Exception:
        return False

def generate_session_token() -> str:
    """
    Generates a secure random 32-byte URL-safe session token.
    """
    return f"sess_{secrets.token_urlsafe(32)}"
