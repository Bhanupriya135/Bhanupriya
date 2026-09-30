from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class EstimationBase(BaseModel):
    project_id: int
    material_id: int
    quantity: float
    unit_rate: float
    notes: Optional[str] = None


class EstimationCreate(EstimationBase):
    pass


class EstimationUpdate(BaseModel):
    quantity: Optional[float] = None
    unit_rate: Optional[float] = None
    notes: Optional[str] = None


class EstimationResponse(BaseModel):
    id: int
    project_id: int
    material_id: int
    quantity: float
    unit_rate: float
    total_cost: float
    notes: Optional[str] = None
    material_name: Optional[str] = None
    material_category: Optional[str] = None
    material_unit: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EstimationCalculateRequest(BaseModel):
    project_id: int
    built_up_area: Optional[float] = None
    floors: Optional[int] = 1
    construction_type: Optional[str] = "RCC"


class EstimationSummary(BaseModel):
    project_id: int
    total_material_cost: float
    total_items: int
    estimations: List[EstimationResponse]
