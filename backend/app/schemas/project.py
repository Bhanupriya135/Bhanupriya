from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProjectBase(BaseModel):
    name: str
    client_name: str
    project_type: str
    location: Optional[str] = None
    built_up_area: Optional[float] = None
    floors: Optional[int] = 1
    construction_type: Optional[str] = None
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    client_name: Optional[str] = None
    project_type: Optional[str] = None
    location: Optional[str] = None
    built_up_area: Optional[float] = None
    floors: Optional[int] = None
    construction_type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    status: str
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectSummary(BaseModel):
    id: int
    name: str
    client_name: str
    project_type: str
    location: Optional[str]
    built_up_area: Optional[float]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
