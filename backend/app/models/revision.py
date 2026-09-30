from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class RevisionHistory(Base):
    __tablename__ = "revision_history"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    entity_type = Column(String(50), nullable=False)   # project, estimation, boq_item, drawing
    entity_id = Column(Integer, nullable=False)
    action = Column(String(20), nullable=False)        # created, updated, deleted, calculated, generated
    changed_by = Column(String(100), default="demo@aimatesti.com")
    changes = Column(JSON)                             # {field: {old: v, new: v}}
    snapshot = Column(JSON)                            # full object snapshot after change
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
