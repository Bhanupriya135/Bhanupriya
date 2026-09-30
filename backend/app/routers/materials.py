from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.material import Material
from app.schemas.material import MaterialCreate, MaterialUpdate, MaterialResponse
from app.services.excel_service import (
    import_materials_from_excel, export_materials_to_excel, get_import_template
)
from typing import List, Optional

router = APIRouter(prefix="/materials", tags=["Materials"])


@router.get("", response_model=List[MaterialResponse])
def list_materials(
    skip: int = 0,
    limit: int = 200,
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Material).filter(Material.is_active == 1)
    if category:
        query = query.filter(Material.category == category)
    if location:
        query = query.filter(Material.location == location)
    if search:
        query = query.filter(Material.name.ilike(f"%{search}%"))
    return query.order_by(Material.category, Material.name).offset(skip).limit(limit).all()


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Material.category).distinct().all()
    return [c[0] for c in categories if c[0]]


@router.get("/export/excel")
def export_materials_excel(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Download all materials as an Excel file."""
    try:
        excel_bytes = export_materials_to_excel(db, category)
        filename = f"materials_export_{category or 'all'}.xlsx"
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/import/template")
def download_import_template():
    """Download the Excel import template."""
    try:
        template_bytes = get_import_template()
        return Response(
            content=template_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": 'attachment; filename="materials_import_template.xlsx"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import/excel")
async def import_materials_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Import materials from an Excel file (.xlsx)."""
    filename = file.filename or ""
    if not filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported")

    try:
        file_bytes = await file.read()
        imported, skipped, errors = import_materials_from_excel(db, file_bytes, filename)
        return {
            "message": f"Import complete: {imported} imported/updated, {skipped} skipped",
            "imported": imported,
            "skipped": skipped,
            "errors": errors[:20],  # limit error list
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")


@router.post("", response_model=MaterialResponse, status_code=201)
def create_material(material: MaterialCreate, db: Session = Depends(get_db)):
    db_material = Material(**material.model_dump())
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material


@router.get("/{material_id}", response_model=MaterialResponse)
def get_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return material


@router.put("/{material_id}", response_model=MaterialResponse)
def update_material(material_id: int, material_update: MaterialUpdate, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    update_data = material_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(material, key, value)
    db.commit()
    db.refresh(material)
    return material


@router.delete("/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    material.is_active = 0
    db.commit()
    return {"message": "Material deleted successfully"}
