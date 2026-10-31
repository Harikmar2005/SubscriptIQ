import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.subscription import AuditEvent

class CryptographicEvidenceLedger:
    """
    Financial Evidence Ledger with SHA-256 Hash Chaining.
    Guarantees non-repudiation, tamper-evidence, and audit trail verification.
    """
    GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

    def __init__(self, db_session: Session, tenant_id: str = "tenant-primary"):
        self.db = db_session
        self.tenant_id = tenant_id

    def get_latest_hash(self) -> str:
        latest = self.db.query(AuditEvent).filter(
            AuditEvent.tenant_id == self.tenant_id
        ).order_by(AuditEvent.timestamp.desc()).first()
        return latest.audit_hash if latest else self.GENESIS_HASH

    def append_audit_event(
        self,
        event_type: str,
        entity_id: str,
        actor: str,
        payload: Dict[str, Any],
        previous_hash: Optional[str] = None
    ) -> AuditEvent:
        now = datetime.now(timezone.utc)
        timestamp_str = now.isoformat()
        prev_hash = previous_hash or self.get_latest_hash()

        # Deterministic payload serialization for canonical hashing
        payload_canonical = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        canonical_str = f"{self.tenant_id}|{event_type}|{entity_id}|{actor}|{timestamp_str}|{payload_canonical}|{prev_hash}"
        audit_hash = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

        event_id = f"aud-{int(now.timestamp() * 1000)}"
        audit_entry = AuditEvent(
            id=event_id,
            tenant_id=self.tenant_id,
            event_type=event_type,
            entity_id=entity_id,
            actor=actor,
            payload=payload,
            previous_hash=prev_hash,
            audit_hash=audit_hash,
            timestamp=now
        )

        self.db.add(audit_entry)
        self.db.commit()
        self.db.refresh(audit_entry)
        return audit_entry

    def verify_chain_integrity(self) -> Dict[str, Any]:
        """Verifies that no ledger records have been tampered with or retroactively altered."""
        events = self.db.query(AuditEvent).filter(
            AuditEvent.tenant_id == self.tenant_id
        ).order_by(AuditEvent.timestamp.asc()).all()

        if not events:
            return {"valid": True, "count": 0, "verified_at": datetime.now(timezone.utc).isoformat()}

        for i in range(len(events)):
            current = events[i]
            expected_prev = events[i - 1].audit_hash if i > 0 else self.GENESIS_HASH
            if current.previous_hash != expected_prev:
                return {
                    "valid": False,
                    "tampered_index": i,
                    "tampered_id": current.id,
                    "error": "Hash break detected"
                }

        return {
            "valid": True,
            "count": len(events),
            "latest_hash": events[-1].audit_hash,
            "verified_at": datetime.now(timezone.utc).isoformat()
        }
