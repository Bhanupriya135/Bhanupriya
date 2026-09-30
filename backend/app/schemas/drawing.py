from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class DrawingResponse(BaseModel):
    id: int
    project_id: int
    file_name: str
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[float] = None
    upload_status: str
    analysis_status: str
    analysis_result: Optional[Any] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DrawingAnalysisResult(BaseModel):
    drawing_id: int
    project_id: int
    elements: dict
    dimensions: dict
    summary: dict
