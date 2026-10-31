import os
import hmac
import hashlib
import base64
import json
import time
from typing import Optional, Dict, Any
from app.core.config import settings

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with 100,000 iterations."""
    if not salt:
        salt = base64.b64encode(os.urandom(16)).decode('utf-8')
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"pbkdf2:sha256:100000${salt}${base64.b64encode(key).decode('utf-8')}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Safely verify hashed password using constant-time comparison."""
    try:
        parts = hashed_password.split('$')
        if len(parts) != 3:
            return False
        algorithm_info, salt, stored_hash = parts
        computed = hash_password(plain_password, salt=salt)
        return hmac.compare_digest(computed, hashed_password)
    except Exception:
        return False

def _b64encode_url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _b64decode_url(s: str) -> bytes:
    padding = '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + padding)

def create_access_token(payload: Dict[str, Any], expires_delta_seconds: Optional[int] = None) -> str:
    """Create a cryptographically signed HS256 JWT access token."""
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    exp = now + (expires_delta_seconds or (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60))
    
    token_payload = payload.copy()
    token_payload.update({"iat": now, "exp": exp})
    
    header_b64 = _b64encode_url(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_b64 = _b64encode_url(json.dumps(token_payload, separators=(',', ':')).encode('utf-8'))
    
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(settings.SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    sig_b64 = _b64encode_url(signature)
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify the HS256 JWT signature and expiration."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(settings.SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
        actual_sig = _b64decode_url(sig_b64)
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
            
        payload = json.loads(_b64decode_url(payload_b64).decode('utf-8'))
        
        # Expiration check
        if payload.get("exp", 0) < int(time.time()):
            return None
            
        return payload
    except Exception:
        return None

def verify_razorpay_signature(payment_id: str, order_id_or_sub_id: str, signature: str, secret: Optional[str] = None) -> bool:
    """Verify Razorpay payment signature server-side using HMAC-SHA256."""
    key_secret = secret or settings.RAZORPAY_KEY_SECRET
    msg = f"{order_id_or_sub_id}|{payment_id}".encode('utf-8')
    generated_signature = hmac.new(key_secret.encode('utf-8'), msg, hashlib.sha256).hexdigest()
    return hmac.compare_digest(generated_signature, signature)

def verify_webhook_signature(body: bytes, signature: str, webhook_secret: Optional[str] = None) -> bool:
    """Verify Razorpay incoming webhook payload signature."""
    secret = webhook_secret or settings.RAZORPAY_WEBHOOK_SECRET
    generated = hmac.new(secret.encode('utf-8'), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(generated, signature)
