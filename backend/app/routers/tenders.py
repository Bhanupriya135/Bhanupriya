from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.schemas.tender import TenderCreate, TenderUpdate, TenderResponse
from app.services.tender_service import (
    get_tenders, get_tender, create_tender,
    update_tender, delete_tender, refresh_tender_data
)
from app.services.tender_pdf_service import generate_tender_pdf
from typing import List
import os

router = APIRouter(prefix="/tenders", tags=["Tenders"])


@router.get("/project/{project_id}", response_model=List[TenderResponse])
def list_tenders(project_id: int, db: Session = Depends(get_db)):
    return get_tenders(db, project_id)


@router.post("", response_model=TenderResponse, status_code=201)
def create(data: TenderCreate, db: Session = Depends(get_db)):
    try:
        return create_tender(db, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{tender_id}", response_model=TenderResponse)
def get_one(tender_id: int, db: Session = Depends(get_db)):
    tender = get_tender(db, tender_id)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    return tender


@router.put("/{tender_id}", response_model=TenderResponse)
def update(tender_id: int, data: TenderUpdate, db: Session = Depends(get_db)):
    tender = update_tender(db, tender_id, data)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    return tender


@router.delete("/{tender_id}")
def delete(tender_id: int, db: Session = Depends(get_db)):
    if not delete_tender(db, tender_id):
        raise HTTPException(status_code=404, detail="Tender not found")
    return {"message": "Tender deleted"}


@router.post("/{tender_id}/refresh", response_model=TenderResponse)
def refresh(tender_id: int, db: Session = Depends(get_db)):
    """Re-snapshot latest project data into the tender."""
    tender = refresh_tender_data(db, tender_id)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    return tender


@router.get("/{tender_id}/pdf")
def download_pdf(tender_id: int, db: Session = Depends(get_db)):
    """Generate and download tender document as PDF."""
    tender = get_tender(db, tender_id)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    try:
        pdf_dir = os.path.join(settings.REPORTS_DIR, f"project_{tender.project_id}", "tenders")
        os.makedirs(pdf_dir, exist_ok=True)
        safe_name = tender.company_name[:20].replace(" ", "_")
        filename = f"tender_{tender.tender_no}_{safe_name}.pdf"
        output_path = os.path.join(pdf_dir, filename)
        generate_tender_pdf(tender, output_path)
        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=filename,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
