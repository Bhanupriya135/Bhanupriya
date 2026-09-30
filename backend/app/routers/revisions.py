from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.revision_service import get_project_revisions, get_all_revisions
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/revisions", tags=["Revision History"])


class RevisionResponse(BaseModel):
    id: int
    project_id: int
    entity_type: str
    entity_id: int
    action: str
    changed_by: str
    changes: Optional[dict] = None
    snapshot: Optional[dict] = None
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/project/{project_id}", response_model=List[RevisionResponse])
def get_revisions(
    project_id: int,
    entity_type: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    return get_project_revisions(db, project_id, entity_type, limit)


@router.get("/all", response_model=List[RevisionResponse])
def get_all(limit: int = Query(100, le=500), db: Session = Depends(get_db)):
    return get_all_revisions(db, limit)
