"""
Cost Service - Calculates total project cost including labor, equipment, overhead.
"""

from sqlalchemy.orm import Session
from app.models.estimation import Estimation
from app.models.project import Project


# Cost ratios relative to material cost
LABOR_RATIO = 0.35       # Labor = 35% of material cost
EQUIPMENT_RATIO = 0.10   # Equipment = 10% of material cost
OTHER_RATIO = 0.05       # Miscellaneous = 5% of material cost
TAX_RATE = 0.18          # GST = 18%
CONTINGENCY_RATE = 0.05  # Contingency = 5%


def calculate_project_cost(db: Session, project_id: int) -> dict:
    """Calculate complete project cost breakdown."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ValueError(f"Project {project_id} not found")

    # Sum material costs
    estimations = db.query(Estimation).filter(Estimation.project_id == project_id).all()
    material_cost = sum(e.total_cost for e in estimations)

    if material_cost == 0:
        return {
            "project_id": project_id,
            "material_cost": 0,
            "labor_cost": 0,
            "equipment_cost": 0,
            "other_cost": 0,
            "subtotal": 0,
            "tax": 0,
            "contingency": 0,
            "total_project_cost": 0,
            "cost_per_sqft": 0,
            "currency": "INR",
        }

    labor_cost = round(material_cost * LABOR_RATIO, 2)
    equipment_cost = round(material_cost * EQUIPMENT_RATIO, 2)
    other_cost = round(material_cost * OTHER_RATIO, 2)
    subtotal = material_cost + labor_cost + equipment_cost + other_cost
    tax = round(subtotal * TAX_RATE, 2)
    contingency = round(subtotal * CONTINGENCY_RATE, 2)
    total = round(subtotal + tax + contingency, 2)

    built_up_area = project.built_up_area or 1
    floors = project.floors or 1
    total_area = built_up_area * floors
    cost_per_sqft = round(total / total_area, 2) if total_area > 0 else 0

    return {
        "project_id": project_id,
        "material_cost": round(material_cost, 2),
        "labor_cost": round(labor_cost, 2),
        "equipment_cost": round(equipment_cost, 2),
        "other_cost": round(other_cost, 2),
        "subtotal": round(subtotal, 2),
        "tax": round(tax, 2),
        "contingency": round(contingency, 2),
        "total_project_cost": total,
        "cost_per_sqft": cost_per_sqft,
        "currency": "INR",
        "breakdown_percentages": {
            "material": round((material_cost / total) * 100, 1),
            "labor": round((labor_cost / total) * 100, 1),
            "equipment": round((equipment_cost / total) * 100, 1),
            "other": round((other_cost / total) * 100, 1),
            "tax": round((tax / total) * 100, 1),
            "contingency": round((contingency / total) * 100, 1),
        }
    }
