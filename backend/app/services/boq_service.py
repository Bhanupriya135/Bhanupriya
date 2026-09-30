from sqlalchemy.orm import Session
from app.models.boq import BOQItem
from app.models.estimation import Estimation
from app.models.material import Material
from app.models.project import Project
from app.schemas.boq import BOQItemCreate, BOQItemUpdate
from typing import List, Optional


def get_boq_items(db: Session, project_id: int) -> List[BOQItem]:
    return (
        db.query(BOQItem)
        .filter(BOQItem.project_id == project_id)
        .order_by(BOQItem.sl_no)
        .all()
    )


def get_boq_item(db: Session, item_id: int) -> Optional[BOQItem]:
    return db.query(BOQItem).filter(BOQItem.id == item_id).first()


def generate_boq(db: Session, project_id: int) -> List[BOQItem]:
    """Generate BOQ from existing estimations."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ValueError(f"Project {project_id} not found")

    # Delete existing BOQ items
    db.query(BOQItem).filter(BOQItem.project_id == project_id).delete()

    estimations = (
        db.query(Estimation)
        .filter(Estimation.project_id == project_id)
        .all()
    )

    if not estimations:
        raise ValueError("No estimations found. Please run material estimation first.")

    boq_items = []
    sl_no = 1

    # Group by material category
    category_groups = {}
    for est in estimations:
        mat = db.query(Material).filter(Material.id == est.material_id).first()
        category = mat.category if mat else "General"
        if category not in category_groups:
            category_groups[category] = []
        category_groups[category].append((est, mat))

    for category, items in category_groups.items():
        for est, mat in items:
            if mat is None:
                continue
            amount = round(est.quantity * est.unit_rate, 2)
            item = BOQItem(
                project_id=project_id,
                sl_no=sl_no,
                description=f"Supply and use of {mat.name}",
                material=mat.name,
                unit=mat.unit,
                quantity=est.quantity,
                rate=est.unit_rate,
                amount=amount,
                category=category,
                remarks=f"{project.construction_type or 'RCC'} construction",
            )
            db.add(item)
            boq_items.append(item)
            sl_no += 1

    db.commit()

    # Log revision
    from app.services.revision_service import log_revision
    items_after = get_boq_items(db, project_id)
    total = sum(i.amount for i in items_after)
    log_revision(
        db, project_id=project_id, entity_type="boq",
        entity_id=project_id, action="generated",
        snapshot={"total_amount": round(total, 2), "items": len(items_after)},
        note=f"BOQ generated: {len(items_after)} items, total ₹{round(total):,}",
    )

    return get_boq_items(db, project_id)


def create_boq_item(db: Session, item: BOQItemCreate) -> BOQItem:
    amount = round(item.quantity * item.rate, 2)

    # Get next sl_no
    max_sl = db.query(BOQItem).filter(
        BOQItem.project_id == item.project_id
    ).count()

    db_item = BOQItem(
        **item.model_dump(exclude={"sl_no"}),
        sl_no=item.sl_no or max_sl + 1,
        amount=amount,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def update_boq_item(db: Session, item_id: int, item_update: BOQItemUpdate) -> Optional[BOQItem]:
    db_item = db.query(BOQItem).filter(BOQItem.id == item_id).first()
    if not db_item:
        return None

    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)

    # Recalculate amount
    db_item.amount = round(db_item.quantity * db_item.rate, 2)
    db.commit()
    db.refresh(db_item)
    return db_item


def delete_boq_item(db: Session, item_id: int) -> bool:
    db_item = db.query(BOQItem).filter(BOQItem.id == item_id).first()
    if not db_item:
        return False
    db.delete(db_item)
    db.commit()
    return True


def get_boq_summary(db: Session, project_id: int) -> dict:
    items = get_boq_items(db, project_id)
    total_amount = sum(item.amount for item in items)

    category_totals = {}
    for item in items:
        cat = item.category or "General"
        category_totals[cat] = category_totals.get(cat, 0) + item.amount

    return {
        "project_id": project_id,
        "total_amount": round(total_amount, 2),
        "total_items": len(items),
        "category_breakdown": {k: round(v, 2) for k, v in category_totals.items()},
        "items": items,
    }
