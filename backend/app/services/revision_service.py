"""
Revision History Service.
Call log_revision() after any create/update/delete to record a change.
"""
from sqlalchemy.orm import Session
from app.models.revision import RevisionHistory
from typing import Optional, List
from datetime import datetime


def log_revision(
    db: Session,
    project_id: int,
    entity_type: str,
    entity_id: int,
    action: str,
    changes: Optional[dict] = None,
    snapshot: Optional[dict] = None,
    note: Optional[str] = None,
    changed_by: str = "demo@aimatesti.com",
):
    """Record a revision entry."""
    rev = RevisionHistory(
        project_id=project_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        changed_by=changed_by,
        changes=changes,
        snapshot=snapshot,
        note=note,
    )
    db.add(rev)
    db.commit()
    return rev


def get_project_revisions(
    db: Session,
    project_id: int,
    entity_type: Optional[str] = None,
    limit: int = 100,
) -> List[RevisionHistory]:
    query = db.query(RevisionHistory).filter(RevisionHistory.project_id == project_id)
    if entity_type:
        query = query.filter(RevisionHistory.entity_type == entity_type)
    return query.order_by(RevisionHistory.created_at.desc()).limit(limit).all()


def get_all_revisions(db: Session, limit: int = 200) -> List[RevisionHistory]:
    return (
        db.query(RevisionHistory)
        .order_by(RevisionHistory.created_at.desc())
        .limit(limit)
        .all()
    )


def diff_dicts(old: dict, new: dict) -> dict:
    """Return only the changed fields between two dicts."""
    changes = {}
    for key in set(list(old.keys()) + list(new.keys())):
        old_val = old.get(key)
        new_val = new.get(key)
        if old_val != new_val:
            changes[key] = {"old": old_val, "new": new_val}
    return changes
