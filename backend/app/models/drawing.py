from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Drawing(Base):
    __tablename__ = "drawings"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500))
    file_type = Column(String(20))  # pdf, image, cad
    file_size = Column(Float)  # bytes
    upload_status = Column(String(20), default="pending")  # pending, uploaded, failed
    analysis_status = Column(String(20), default="pending")  # pending, processing, completed, failed
    analysis_result = Column(JSON)  # Extracted elements stored as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="drawings")
