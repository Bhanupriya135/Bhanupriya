# Import all models here so SQLAlchemy can resolve all relationships
# ORDER MATTERS: independent models first, then dependent ones

from app.models.user import User
from app.models.material import Material
from app.models.project import Project
from app.models.drawing import Drawing
from app.models.estimation import Estimation
from app.models.boq import BOQItem
from app.models.report import Report
from app.models.revision import RevisionHistory
from app.models.tender import Tender

__all__ = [
    "User", "Material", "Project", "Drawing",
    "Estimation", "BOQItem", "Report", "RevisionHistory", "Tender",
]
