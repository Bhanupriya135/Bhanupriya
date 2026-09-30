from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Tender(Base):
    __tablename__ = "tenders"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    # Company / Contractor info
    company_name = Column(String(200), nullable=False)
    company_address = Column(Text)
    company_phone = Column(String(30))
    company_email = Column(String(100))
    company_gstin = Column(String(20))
    company_license = Column(String(50))

    # Tender details
    tender_no = Column(String(50))
    tender_date = Column(DateTime, default=datetime.utcnow)
    validity_days = Column(Integer, default=30)
    delivery_days = Column(Integer, default=90)

    # Financial
    quoted_amount = Column(Float)          # final quoted price (can differ from estimate)
    discount_percent = Column(Float, default=0.0)
    advance_percent = Column(Float, default=20.0)

    # Terms
    payment_terms = Column(Text)
    special_conditions = Column(Text)
    scope_of_work = Column(Text)
    exclusions = Column(Text)

    # Status
    status = Column(String(20), default="draft")   # draft, sent, accepted, rejected
    notes = Column(Text)

    # Snapshot of data used
    tender_data = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project")
