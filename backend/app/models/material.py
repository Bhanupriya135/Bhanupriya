from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(100))  # Cement, Steel, Sand, Aggregates, etc.
    unit = Column(String(20))  # bag, kg, ton, sqft, sqm, cum, nos, ltr
    rate = Column(Float, nullable=False)  # INR per unit
    location = Column(String(100), default="Bangalore")
    description = Column(String(500))
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    estimations = relationship("Estimation", back_populates="material")
