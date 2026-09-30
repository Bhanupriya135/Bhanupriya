from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    client_name = Column(String(200), nullable=False)
    project_type = Column(String(50), nullable=False)  # Residential, Commercial, Industrial, Infrastructure
    location = Column(String(200))
    built_up_area = Column(Float)  # sq ft
    floors = Column(Integer, default=1)
    construction_type = Column(String(50))  # RCC, Load Bearing, Steel, etc.
    description = Column(Text)
    status = Column(String(30), default="planning")  # planning, in_progress, estimation_done, completed
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="projects")
    drawings = relationship("Drawing", back_populates="project", cascade="all, delete-orphan")
    estimations = relationship("Estimation", back_populates="project", cascade="all, delete-orphan")
    boq_items = relationship("BOQItem", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")
