from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class ReportGenerateRequest(BaseModel):
    project_id: int
    report_type: Optional[str] = "project_report"


class ReportResponse(BaseModel):
    id: int
    project_id: int
    report_type: str
    title: Optional[str] = None
    file_path: Optional[str] = None
    report_data: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True
