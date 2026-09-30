from sqlalchemy.orm import Session
from app.models.report import Report
from app.models.project import Project
from app.models.drawing import Drawing
from app.models.estimation import Estimation
from app.models.material import Material
from app.models.boq import BOQItem
from app.services.cost_service import calculate_project_cost
from typing import List, Optional
from datetime import datetime


def get_reports(db: Session, project_id: int) -> List[Report]:
    return db.query(Report).filter(Report.project_id == project_id).all()


def get_report(db: Session, report_id: int) -> Optional[Report]:
    return db.query(Report).filter(Report.id == report_id).first()


def generate_report(db: Session, project_id: int, report_type: str = "project_report") -> Report:
    """Generate a comprehensive project report and save it."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ValueError(f"Project {project_id} not found")

    # Gather all data
    drawings = db.query(Drawing).filter(Drawing.project_id == project_id).all()
    estimations = db.query(Estimation).filter(Estimation.project_id == project_id).all()
    boq_items = db.query(BOQItem).filter(BOQItem.project_id == project_id).order_by(BOQItem.sl_no).all()

    # Cost calculation
    try:
        cost_data = calculate_project_cost(db, project_id)
    except Exception:
        cost_data = {}

    # Build material estimation list
    estimation_list = []
    for est in estimations:
        mat = db.query(Material).filter(Material.id == est.material_id).first()
        estimation_list.append({
            "material": mat.name if mat else "Unknown",
            "category": mat.category if mat else "Unknown",
            "unit": mat.unit if mat else "",
            "quantity": est.quantity,
            "rate": est.unit_rate,
            "total": est.total_cost,
        })

    # Build BOQ list
    boq_list = []
    for item in boq_items:
        boq_list.append({
            "sl_no": item.sl_no,
            "description": item.description,
            "material": item.material,
            "unit": item.unit,
            "quantity": item.quantity,
            "rate": item.rate,
            "amount": item.amount,
            "remarks": item.remarks,
        })

    # Drawing analysis summary
    drawing_analysis = None
    for d in drawings:
        if d.analysis_status == "completed" and d.analysis_result:
            drawing_analysis = d.analysis_result
            break

    report_data = {
        "generated_at": datetime.utcnow().isoformat(),
        "report_type": report_type,
        "project": {
            "id": project.id,
            "name": project.name,
            "client": project.client_name,
            "type": project.project_type,
            "location": project.location,
            "built_up_area": project.built_up_area,
            "floors": project.floors,
            "construction_type": project.construction_type,
            "status": project.status,
        },
        "drawing_analysis": drawing_analysis,
        "material_estimation": {
            "items": estimation_list,
            "total_material_cost": cost_data.get("material_cost", 0),
            "total_items": len(estimation_list),
        },
        "cost_estimation": cost_data,
        "boq": {
            "items": boq_list,
            "total_amount": sum(i["amount"] for i in boq_list),
            "total_items": len(boq_list),
        },
        "summary": {
            "total_project_cost": cost_data.get("total_project_cost", 0),
            "cost_per_sqft": cost_data.get("cost_per_sqft", 0),
            "total_materials": len(estimation_list),
            "total_boq_items": len(boq_list),
        }
    }

    # Save report
    report = Report(
        project_id=project_id,
        report_type=report_type,
        title=f"{project.name} - {report_type.replace('_', ' ').title()} - {datetime.utcnow().strftime('%Y-%m-%d')}",
        report_data=report_data,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
