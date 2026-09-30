from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MaterialBase(BaseModel):
    name: str
    category: str
    unit: str
    rate: float
    location: Optional[str] = "Bangalore"
    description: Optional[str] = None


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    rate: Optional[float] = None
    location: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[int] = None


class MaterialResponse(MaterialBase):
    id: int
    is_active: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
