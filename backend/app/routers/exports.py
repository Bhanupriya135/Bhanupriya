"""
Export router — PDF downloads for reports and BOQ.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.services.report_service import generate_report
from app.services.boq_service import get_boq_summary
from app.services.pdf_service import generate_project_pdf, generate_boq_pdf
from app.models.project import Project
import os

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/report/{project_id}/pdf")
def download_project_report_pdf(project_id: int, db: Session = Depends(get_db)):
    """Generate and download a full project report as PDF."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        # Build fresh report data
        report = generate_report(db, project_id, "project_report")
        report_data = report.report_data

        pdf_dir = os.path.join(settings.REPORTS_DIR, f"project_{project_id}")
        os.makedirs(pdf_dir, exist_ok=True)
        filename = f"report_{project_id}_{project.name[:20].replace(' ', '_')}.pdf"
        output_path = os.path.join(pdf_dir, filename)

        generate_project_pdf(db, report_data, output_path)

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=filename,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@router.get("/boq/{project_id}/pdf")
def download_boq_pdf(project_id: int, db: Session = Depends(get_db)):
    """Generate and download BOQ as PDF."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        boq_summary = get_boq_summary(db, project_id)
        boq_data = {
            "total_amount": boq_summary["total_amount"],
            "total_items": boq_summary["total_items"],
            "items": [
                {
                    "sl_no": i.sl_no,
                    "description": i.description,
                    "material": i.material,
                    "unit": i.unit,
                    "quantity": i.quantity,
                    "rate": i.rate,
                    "amount": i.amount,
                    "remarks": i.remarks,
                }
                for i in boq_summary["items"]
            ],
        }
        project_dict = {
            "name": project.name,
            "client": project.client_name,
            "type": project.project_type,
            "location": project.location,
        }

        pdf_dir = os.path.join(settings.REPORTS_DIR, f"project_{project_id}")
        os.makedirs(pdf_dir, exist_ok=True)
        filename = f"boq_{project_id}_{project.name[:20].replace(' ', '_')}.pdf"
        output_path = os.path.join(pdf_dir, filename)

        generate_boq_pdf(boq_data, project_dict, output_path)

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=filename,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BOQ PDF generation failed: {str(e)}")
