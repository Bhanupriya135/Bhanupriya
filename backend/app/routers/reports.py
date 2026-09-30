from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.report import ReportGenerateRequest, ReportResponse
from app.services import report_service
from typing import List

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/generate", response_model=ReportResponse, status_code=201)
def generate_report(request: ReportGenerateRequest, db: Session = Depends(get_db)):
    """Generate a project report."""
    try:
        report = report_service.generate_report(db, request.project_id, request.report_type)
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.get("/project/{project_id}", response_model=List[ReportResponse])
def get_project_reports(project_id: int, db: Session = Depends(get_db)):
    return report_service.get_reports(db, project_id)


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = report_service.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
