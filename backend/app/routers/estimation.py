from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.estimation import EstimationCalculateRequest, EstimationResponse, EstimationUpdate
from app.services import estimation_service
from app.services.cost_service import calculate_project_cost
from typing import List

router = APIRouter(prefix="/estimation", tags=["Estimation"])


@router.post("/calculate")
def calculate_estimation(
    request: EstimationCalculateRequest,
    db: Session = Depends(get_db),
):
    """Calculate material estimations for a project."""
    try:
        estimations = estimation_service.calculate_estimation(db, request)
        total_cost = sum(e["total_cost"] for e in estimations)
        return {
            "project_id": request.project_id,
            "total_material_cost": round(total_cost, 2),
            "total_items": len(estimations),
            "estimations": estimations,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation failed: {str(e)}")


@router.get("/project/{project_id}")
def get_project_estimation(project_id: int, db: Session = Depends(get_db)):
    """Get all estimations for a project."""
    estimations = estimation_service.get_estimation_with_material(db, project_id)
    total_cost = sum(e["total_cost"] for e in estimations)
    return {
        "project_id": project_id,
        "total_material_cost": round(total_cost, 2),
        "total_items": len(estimations),
        "estimations": estimations,
    }


@router.get("/cost/{project_id}")
def get_project_cost(project_id: int, db: Session = Depends(get_db)):
    """Get complete project cost breakdown."""
    try:
        return calculate_project_cost(db, project_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{estimation_id}")
def update_estimation(
    estimation_id: int,
    update: EstimationUpdate,
    db: Session = Depends(get_db),
):
    from app.models.estimation import Estimation
    db_est = db.query(Estimation).filter(Estimation.id == estimation_id).first()
    if not db_est:
        raise HTTPException(status_code=404, detail="Estimation not found")

    if update.quantity is not None:
        db_est.quantity = update.quantity
    if update.unit_rate is not None:
        db_est.unit_rate = update.unit_rate
    if update.notes is not None:
        db_est.notes = update.notes

    db_est.total_cost = round(db_est.quantity * db_est.unit_rate, 2)
    db.commit()
    db.refresh(db_est)
    return db_est


@router.delete("/{estimation_id}")
def delete_estimation(estimation_id: int, db: Session = Depends(get_db)):
    success = estimation_service.delete_estimation(db, estimation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Estimation not found")
    return {"message": "Estimation deleted"}
