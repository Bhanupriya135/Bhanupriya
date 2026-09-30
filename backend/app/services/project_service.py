from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.revision_service import log_revision
from typing import List, Optional


def get_projects(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    project_type: Optional[str] = None,
    owner_id: Optional[int] = None,
) -> List[Project]:
    query = db.query(Project)
    if owner_id:
        query = query.filter(Project.owner_id == owner_id)
    if search:
        query = query.filter(
            or_(
                Project.name.ilike(f"%{search}%"),
                Project.client_name.ilike(f"%{search}%"),
                Project.location.ilike(f"%{search}%"),
            )
        )
    if status:
        query = query.filter(Project.status == status)
    if project_type:
        query = query.filter(Project.project_type == project_type)
    return query.order_by(Project.created_at.desc()).offset(skip).limit(limit).all()


def get_project(db: Session, project_id: int) -> Optional[Project]:
    return db.query(Project).filter(Project.id == project_id).first()


def create_project(db: Session, project: ProjectCreate, owner_id: int) -> Project:
    db_project = Project(**project.model_dump(), owner_id=owner_id, status="planning")
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    log_revision(
        db, project_id=db_project.id, entity_type="project",
        entity_id=db_project.id, action="created",
        snapshot={"name": db_project.name, "type": db_project.project_type,
                  "area": db_project.built_up_area, "floors": db_project.floors},
        note=f"Project '{db_project.name}' created",
    )
    return db_project


def update_project(db: Session, project_id: int, project_update: ProjectUpdate) -> Optional[Project]:
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        return None
    old_snap = {
        "name": db_project.name, "status": db_project.status,
        "built_up_area": db_project.built_up_area, "floors": db_project.floors,
        "construction_type": db_project.construction_type,
    }
    update_data = project_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_project, key, value)
    db.commit()
    db.refresh(db_project)
    new_snap = {
        "name": db_project.name, "status": db_project.status,
        "built_up_area": db_project.built_up_area, "floors": db_project.floors,
        "construction_type": db_project.construction_type,
    }
    from app.services.revision_service import diff_dicts
    changes = diff_dicts(old_snap, new_snap)
    if changes:
        log_revision(
            db, project_id=project_id, entity_type="project",
            entity_id=project_id, action="updated",
            changes=changes, snapshot=new_snap,
            note=f"Project updated: {', '.join(changes.keys())}",
        )
    return db_project


def delete_project(db: Session, project_id: int) -> bool:
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        return False
    name = db_project.name
    db.delete(db_project)
    db.commit()
    return True


def get_project_stats(db: Session, owner_id: Optional[int] = None) -> dict:
    query = db.query(Project)
    if owner_id:
        query = query.filter(Project.owner_id == owner_id)
    total = query.count()
    active = query.filter(Project.status.in_(["planning", "in_progress"])).count()
    completed = query.filter(Project.status == "completed").count()
    estimation_done = query.filter(Project.status == "estimation_done").count()
    return {
        "total_projects": total,
        "active_projects": active,
        "completed_projects": completed,
        "estimation_done": estimation_done,
    }
