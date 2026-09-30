from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.boq import BOQItemCreate, BOQItemUpdate, BOQItemResponse, BOQGenerateRequest
from app.services import boq_service
from typing import List

router = APIRouter(prefix="/boq", tags=["BOQ"])


@router.post("/generate")
def generate_boq(request: BOQGenerateRequest, db: Session = Depends(get_db)):
    """Generate BOQ from project estimations."""
    try:
        items = boq_service.generate_boq(db, request.project_id)
        total = sum(i.amount for i in items)
        return {
            "project_id": request.project_id,
            "total_amount": round(total, 2),
            "total_items": len(items),
            "items": [BOQItemResponse.model_validate(i) for i in items],
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/project/{project_id}")
def get_boq(project_id: int, db: Session = Depends(get_db)):
    """Get BOQ for a project."""
    summary = boq_service.get_boq_summary(db, project_id)
    return {
        "project_id": summary["project_id"],
        "total_amount": summary["total_amount"],
        "total_items": summary["total_items"],
        "category_breakdown": summary["category_breakdown"],
        "items": [BOQItemResponse.model_validate(i) for i in summary["items"]],
    }


@router.post("/item", response_model=BOQItemResponse, status_code=201)
def add_boq_item(item: BOQItemCreate, db: Session = Depends(get_db)):
    return boq_service.create_boq_item(db, item)


@router.put("/{item_id}", response_model=BOQItemResponse)
def update_boq_item(item_id: int, item_update: BOQItemUpdate, db: Session = Depends(get_db)):
    item = boq_service.update_boq_item(db, item_id, item_update)
    if not item:
        raise HTTPException(status_code=404, detail="BOQ item not found")
    return item


@router.delete("/{item_id}")
def delete_boq_item(item_id: int, db: Session = Depends(get_db)):
    success = boq_service.delete_boq_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="BOQ item not found")
    return {"message": "BOQ item deleted"}
