from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class TenderCreate(BaseModel):
    project_id: int
    company_name: str
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_gstin: Optional[str] = None
    company_license: Optional[str] = None
    tender_no: Optional[str] = None
    validity_days: Optional[int] = 30
    delivery_days: Optional[int] = 90
    quoted_amount: Optional[float] = None
    discount_percent: Optional[float] = 0.0
    advance_percent: Optional[float] = 20.0
    payment_terms: Optional[str] = None
    special_conditions: Optional[str] = None
    scope_of_work: Optional[str] = None
    exclusions: Optional[str] = None
    notes: Optional[str] = None


class TenderUpdate(BaseModel):
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_gstin: Optional[str] = None
    company_license: Optional[str] = None
    tender_no: Optional[str] = None
    validity_days: Optional[int] = None
    delivery_days: Optional[int] = None
    quoted_amount: Optional[float] = None
    discount_percent: Optional[float] = None
    advance_percent: Optional[float] = None
    payment_terms: Optional[str] = None
    special_conditions: Optional[str] = None
    scope_of_work: Optional[str] = None
    exclusions: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class TenderResponse(BaseModel):
    id: int
    project_id: int
    company_name: str
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_gstin: Optional[str] = None
    company_license: Optional[str] = None
    tender_no: Optional[str] = None
    tender_date: Optional[datetime] = None
    validity_days: Optional[int] = 30
    delivery_days: Optional[int] = 90
    quoted_amount: Optional[float] = None
    discount_percent: Optional[float] = 0.0
    advance_percent: Optional[float] = 20.0
    payment_terms: Optional[str] = None
    special_conditions: Optional[str] = None
    scope_of_work: Optional[str] = None
    exclusions: Optional[str] = None
    status: str
    notes: Optional[str] = None
    tender_data: Optional[Any] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
