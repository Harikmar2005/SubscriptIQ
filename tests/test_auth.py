import unittest
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token

class TestAuthenticationSecurity(unittest.TestCase):
    def test_password_hashing_and_verification(self):
        password = "EnterpriseSecurePassword2026!"
        hashed = hash_password(password)
        self.assertNotEqual(password, hashed)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("WrongPassword123", hashed))

    def test_jwt_creation_and_tamper_resistance(self):
        payload = {"sub": "usr-123", "role": "admin", "tenant_id": "tenant-primary"}
        token = create_access_token(payload, expires_delta_seconds=3600)
        self.assertIsInstance(token, str)

        decoded = decode_access_token(token)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded["sub"], "usr-123")
        self.assertEqual(decoded["role"], "admin")

        # Tampered token test
        tampered_token = token[:-5] + "AAAAA"
        self.assertIsNone(decode_access_token(tampered_token))

    def test_jwt_expiration(self):
        payload = {"sub": "usr-expired", "role": "customer"}
        # Token expired 10 seconds ago
        expired_token = create_access_token(payload, expires_delta_seconds=-10)
        self.assertIsNone(decode_access_token(expired_token))

if __name__ == '__main__':
    unittest.main()
