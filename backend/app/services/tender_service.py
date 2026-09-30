"""
Tender Document Service.
Creates, updates and retrieves tender/quotation documents for projects.
"""
from sqlalchemy.orm import Session
from app.models.tender import Tender
from app.models.project import Project
from app.models.boq import BOQItem
from app.models.estimation import Estimation
from app.models.material import Material
from app.services.cost_service import calculate_project_cost
from app.schemas.tender import TenderCreate, TenderUpdate
from typing import List, Optional
from datetime import datetime
import random
import string


def _generate_tender_no(project_id: int) -> str:
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"TND-{datetime.now().strftime('%Y%m')}-{project_id:03d}-{suffix}"


def _build_tender_data(db: Session, project: Project) -> dict:
    """Snapshot all project data into tender_data JSON."""
    boq_items = db.query(BOQItem).filter(BOQItem.project_id == project.id).order_by(BOQItem.sl_no).all()
    estimations = db.query(Estimation).filter(Estimation.project_id == project.id).all()

    try:
        cost = calculate_project_cost(db, project.id)
    except Exception:
        cost = {}

    estimation_list = []
    for est in estimations:
        mat = db.query(Material).filter(Material.id == est.material_id).first()
        estimation_list.append({
            "material": mat.name if mat else "Unknown",
            "category": mat.category if mat else "",
            "unit": mat.unit if mat else "",
            "quantity": est.quantity,
            "rate": est.unit_rate,
            "total": est.total_cost,
        })

    boq_list = []
    for item in boq_items:
        boq_list.append({
            "sl_no": item.sl_no,
            "description": item.description,
            "material": item.material or "",
            "unit": item.unit,
            "quantity": item.quantity,
            "rate": item.rate,
            "amount": item.amount,
            "category": item.category or "",
            "remarks": item.remarks or "",
        })

    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "client": project.client_name,
            "type": project.project_type,
            "location": project.location,
            "built_up_area": project.built_up_area,
            "floors": project.floors,
            "construction_type": project.construction_type,
        },
        "cost_estimation": cost,
        "material_estimation": estimation_list,
        "boq": boq_list,
        "boq_total": sum(i["amount"] for i in boq_list),
        "snapshot_at": datetime.utcnow().isoformat(),
    }


def get_tenders(db: Session, project_id: int) -> List[Tender]:
    return db.query(Tender).filter(Tender.project_id == project_id).order_by(Tender.created_at.desc()).all()


def get_tender(db: Session, tender_id: int) -> Optional[Tender]:
    return db.query(Tender).filter(Tender.id == tender_id).first()


def create_tender(db: Session, data: TenderCreate) -> Tender:
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise ValueError(f"Project {data.project_id} not found")

    tender_data = _build_tender_data(db, project)
    total_project_cost = tender_data.get("cost_estimation", {}).get("total_project_cost", 0)

    tender = Tender(
        **data.model_dump(),
        tender_no=data.tender_no or _generate_tender_no(data.project_id),
        tender_date=datetime.utcnow(),
        # Auto-set quoted amount from project cost if not provided
        quoted_amount=data.quoted_amount or total_project_cost,
        tender_data=tender_data,
        status="draft",
    )
    db.add(tender)
    db.commit()
    db.refresh(tender)
    return tender


def update_tender(db: Session, tender_id: int, data: TenderUpdate) -> Optional[Tender]:
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tender, key, value)

    db.commit()
    db.refresh(tender)
    return tender


def delete_tender(db: Session, tender_id: int) -> bool:
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        return False
    db.delete(tender)
    db.commit()
    return True


def refresh_tender_data(db: Session, tender_id: int) -> Optional[Tender]:
    """Re-snapshot current project data into the tender."""
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        return None
    project = db.query(Project).filter(Project.id == tender.project_id).first()
    tender.tender_data = _build_tender_data(db, project)
    db.commit()
    db.refresh(tender)
    return tender
