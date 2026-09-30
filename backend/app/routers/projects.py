from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectSummary
from app.services import project_service
from typing import List, Optional

router = APIRouter(prefix="/projects", tags=["Projects"])

# For MVP: use a default user_id of 1 (demo user)
DEFAULT_USER_ID = 1


@router.get("", response_model=List[ProjectSummary])
def list_projects(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    project_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return project_service.get_projects(db, skip=skip, limit=limit, search=search, status=status, project_type=project_type)


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    return project_service.create_project(db, project, owner_id=DEFAULT_USER_ID)


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    return project_service.get_project_stats(db)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = project_service.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, project_update: ProjectUpdate, db: Session = Depends(get_db)):
    project = project_service.update_project(db, project_id, project_update)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    success = project_service.delete_project(db, project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}
