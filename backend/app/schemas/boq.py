from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class BOQItemBase(BaseModel):
    description: str
    material: Optional[str] = None
    unit: str
    quantity: float
    rate: float
    remarks: Optional[str] = None
    category: Optional[str] = None


class BOQItemCreate(BOQItemBase):
    project_id: int
    sl_no: Optional[int] = None


class BOQItemUpdate(BaseModel):
    description: Optional[str] = None
    material: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[float] = None
    rate: Optional[float] = None
    remarks: Optional[str] = None
    category: Optional[str] = None


class BOQItemResponse(BOQItemBase):
    id: int
    project_id: int
    sl_no: Optional[int] = None
    amount: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BOQGenerateRequest(BaseModel):
    project_id: int


class BOQSummary(BaseModel):
    project_id: int
    total_amount: float
    total_items: int
    items: List[BOQItemResponse]
