"""
Estimation Service - Material quantity calculation engine.

NOTE: This service uses a deterministic coefficient-based estimation engine for MVP.
The coefficients are based on standard Indian construction norms (IS codes).

FUTURE AI INTEGRATION POINT:
Replace _calculate_quantities() with ML model inference:
- Input: project parameters + drawing analysis results
- Output: material quantities with confidence scores
- Model: Trained on historical project data
"""

from sqlalchemy.orm import Session
from app.models.estimation import Estimation
from app.models.material import Material
from app.models.project import Project
from app.schemas.estimation import EstimationCalculateRequest
from typing import List, Optional


# ---------------------------------------------------------------
# Estimation Coefficients (per sq.ft of built-up area)
# Based on standard Indian construction norms
# These can be replaced by ML model outputs in future
# ---------------------------------------------------------------
ESTIMATION_COEFFICIENTS = {
    "RCC": {
        "Cement":        {"qty_per_sqft": 0.40,  "unit": "bag",   "category": "Cement"},
        "Steel":         {"qty_per_sqft": 3.50,  "unit": "kg",    "category": "Steel"},
        "Sand (Fine)":   {"qty_per_sqft": 1.20,  "unit": "cft",   "category": "Sand"},
        "Aggregates":    {"qty_per_sqft": 2.10,  "unit": "cft",   "category": "Aggregates"},
        "Bricks":        {"qty_per_sqft": 8.00,  "unit": "nos",   "category": "Masonry"},
        "Tiles":         {"qty_per_sqft": 0.95,  "unit": "sqft",  "category": "Flooring"},
        "Paint":         {"qty_per_sqft": 0.05,  "unit": "ltr",   "category": "Finishing"},
        "Waterproofing": {"qty_per_sqft": 0.03,  "unit": "ltr",   "category": "Finishing"},
        "Plaster Sand":  {"qty_per_sqft": 0.80,  "unit": "cft",   "category": "Sand"},
        "Door Frames":   {"qty_per_sqft": 0.008, "unit": "nos",   "category": "Woodwork"},
        "Window Frames": {"qty_per_sqft": 0.010, "unit": "nos",   "category": "Woodwork"},
        "Wiring":        {"qty_per_sqft": 2.50,  "unit": "mtr",   "category": "Electrical"},
        "PVC Pipes":     {"qty_per_sqft": 0.80,  "unit": "mtr",   "category": "Plumbing"},
        "Cement Blocks": {"qty_per_sqft": 0.00,  "unit": "nos",   "category": "Masonry"},
    },
    "LoadBearing": {
        "Cement":        {"qty_per_sqft": 0.35,  "unit": "bag",   "category": "Cement"},
        "Steel":         {"qty_per_sqft": 1.80,  "unit": "kg",    "category": "Steel"},
        "Sand (Fine)":   {"qty_per_sqft": 1.50,  "unit": "cft",   "category": "Sand"},
        "Aggregates":    {"qty_per_sqft": 1.20,  "unit": "cft",   "category": "Aggregates"},
        "Bricks":        {"qty_per_sqft": 14.00, "unit": "nos",   "category": "Masonry"},
        "Tiles":         {"qty_per_sqft": 0.95,  "unit": "sqft",  "category": "Flooring"},
        "Paint":         {"qty_per_sqft": 0.05,  "unit": "ltr",   "category": "Finishing"},
        "Waterproofing": {"qty_per_sqft": 0.02,  "unit": "ltr",   "category": "Finishing"},
        "Plaster Sand":  {"qty_per_sqft": 0.90,  "unit": "cft",   "category": "Sand"},
        "Door Frames":   {"qty_per_sqft": 0.008, "unit": "nos",   "category": "Woodwork"},
        "Window Frames": {"qty_per_sqft": 0.010, "unit": "nos",   "category": "Woodwork"},
        "Wiring":        {"qty_per_sqft": 2.20,  "unit": "mtr",   "category": "Electrical"},
        "PVC Pipes":     {"qty_per_sqft": 0.75,  "unit": "mtr",   "category": "Plumbing"},
        "Cement Blocks": {"qty_per_sqft": 0.00,  "unit": "nos",   "category": "Masonry"},
    },
    "Steel": {
        "Cement":        {"qty_per_sqft": 0.30,  "unit": "bag",   "category": "Cement"},
        "Steel":         {"qty_per_sqft": 6.50,  "unit": "kg",    "category": "Steel"},
        "Sand (Fine)":   {"qty_per_sqft": 0.80,  "unit": "cft",   "category": "Sand"},
        "Aggregates":    {"qty_per_sqft": 1.20,  "unit": "cft",   "category": "Aggregates"},
        "Bricks":        {"qty_per_sqft": 4.00,  "unit": "nos",   "category": "Masonry"},
        "Tiles":         {"qty_per_sqft": 0.90,  "unit": "sqft",  "category": "Flooring"},
        "Paint":         {"qty_per_sqft": 0.06,  "unit": "ltr",   "category": "Finishing"},
        "Waterproofing": {"qty_per_sqft": 0.02,  "unit": "ltr",   "category": "Finishing"},
        "Plaster Sand":  {"qty_per_sqft": 0.50,  "unit": "cft",   "category": "Sand"},
        "Door Frames":   {"qty_per_sqft": 0.007, "unit": "nos",   "category": "Woodwork"},
        "Window Frames": {"qty_per_sqft": 0.010, "unit": "nos",   "category": "Woodwork"},
        "Wiring":        {"qty_per_sqft": 2.80,  "unit": "mtr",   "category": "Electrical"},
        "PVC Pipes":     {"qty_per_sqft": 0.90,  "unit": "mtr",   "category": "Plumbing"},
        "Cement Blocks": {"qty_per_sqft": 0.00,  "unit": "nos",   "category": "Masonry"},
    },
}

# Default construction type if not specified
DEFAULT_CONSTRUCTION_TYPE = "RCC"


def get_estimations(db: Session, project_id: int) -> List[Estimation]:
    return (
        db.query(Estimation)
        .filter(Estimation.project_id == project_id)
        .all()
    )


def get_estimation_with_material(db: Session, project_id: int) -> List[dict]:
    """Get estimations enriched with material info."""
    estimations = (
        db.query(Estimation)
        .filter(Estimation.project_id == project_id)
        .all()
    )
    results = []
    for est in estimations:
        mat = db.query(Material).filter(Material.id == est.material_id).first()
        results.append({
            "id": est.id,
            "project_id": est.project_id,
            "material_id": est.material_id,
            "quantity": est.quantity,
            "unit_rate": est.unit_rate,
            "total_cost": est.total_cost,
            "notes": est.notes,
            "material_name": mat.name if mat else "Unknown",
            "material_category": mat.category if mat else "Unknown",
            "material_unit": mat.unit if mat else "unit",
            "created_at": est.created_at,
            "updated_at": est.updated_at,
        })
    return results


def calculate_estimation(db: Session, request: EstimationCalculateRequest) -> dict:
    """
    Core estimation calculation engine.
    Uses project parameters to estimate material quantities.
    """
    project = db.query(Project).filter(Project.id == request.project_id).first()
    if not project:
        raise ValueError(f"Project {request.project_id} not found")

    # Use project data, fallback to request overrides
    built_up_area = request.built_up_area or project.built_up_area or 1000
    floors = request.floors or project.floors or 1
    construction_type = request.construction_type or project.construction_type or DEFAULT_CONSTRUCTION_TYPE

    total_area = built_up_area * floors

    # Get appropriate coefficients
    coefficients = ESTIMATION_COEFFICIENTS.get(construction_type, ESTIMATION_COEFFICIENTS[DEFAULT_CONSTRUCTION_TYPE])

    # Delete existing estimations for this project
    db.query(Estimation).filter(Estimation.project_id == request.project_id).delete()

    created_estimations = []
    for material_name, coeff in coefficients.items():
        if coeff["qty_per_sqft"] == 0:
            continue

        quantity = round(total_area * coeff["qty_per_sqft"], 2)

        # Find or use default rate from materials DB
        mat = db.query(Material).filter(
            Material.name == material_name,
            Material.is_active == 1
        ).first()

        if mat:
            unit_rate = mat.rate
            material_id = mat.id
        else:
            # Create a placeholder material if not found
            mat = db.query(Material).filter(
                Material.category == coeff["category"],
                Material.is_active == 1
            ).first()
            if mat:
                unit_rate = mat.rate
                material_id = mat.id
            else:
                # Use default rates if no material found
                default_rates = {
                    "Cement": 420, "Steel": 75, "Sand (Fine)": 55,
                    "Aggregates": 45, "Bricks": 8, "Tiles": 65,
                    "Paint": 180, "Waterproofing": 280, "Plaster Sand": 40,
                    "Door Frames": 4500, "Window Frames": 3200,
                    "Wiring": 35, "PVC Pipes": 120,
                }
                unit_rate = default_rates.get(material_name, 100)
                # Create material
                mat = Material(
                    name=material_name,
                    category=coeff["category"],
                    unit=coeff["unit"],
                    rate=unit_rate,
                    location="Bangalore",
                    is_active=1,
                )
                db.add(mat)
                db.flush()
                material_id = mat.id

        total_cost = round(quantity * unit_rate, 2)

        estimation = Estimation(
            project_id=request.project_id,
            material_id=material_id,
            quantity=quantity,
            unit_rate=unit_rate,
            total_cost=total_cost,
        )
        db.add(estimation)
        db.flush()
        created_estimations.append(estimation)

    # Update project status
    project.status = "estimation_done"
    db.commit()

    # Log revision
    from app.services.revision_service import log_revision
    total = sum(e.total_cost for e in created_estimations)
    log_revision(
        db, project_id=request.project_id, entity_type="estimation",
        entity_id=request.project_id, action="calculated",
        snapshot={"total_material_cost": round(total, 2), "items": len(created_estimations),
                  "construction_type": construction_type, "total_area_sqft": total_area},
        note=f"Estimation calculated: {len(created_estimations)} materials, total ₹{round(total):,}",
    )

    return get_estimation_with_material(db, request.project_id)


def update_estimation(db: Session, estimation_id: int, quantity: float, unit_rate: float) -> Optional[Estimation]:
    est = db.query(Estimation).filter(Estimation.id == estimation_id).first()
    if not est:
        return None
    est.quantity = quantity
    est.unit_rate = unit_rate
    est.total_cost = round(quantity * unit_rate, 2)
    db.commit()
    db.refresh(est)
    return est


def delete_estimation(db: Session, estimation_id: int) -> bool:
    est = db.query(Estimation).filter(Estimation.id == estimation_id).first()
    if not est:
        return False
    db.delete(est)
    db.commit()
    return True
