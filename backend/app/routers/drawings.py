from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.schemas.drawing import DrawingResponse
from app.services import drawing_service
from app.services.ai_drawing_service import analyze_drawing_ai
from typing import List
import os
import aiofiles

router = APIRouter(prefix="/drawings", tags=["Drawings"])


@router.post("/upload", response_model=DrawingResponse, status_code=201)
async def upload_drawing(
    project_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a drawing file for a project."""
    # Validate file type
    allowed_types = {"application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp"}
    content_type = file.content_type or ""

    file_ext = os.path.splitext(file.filename or "")[-1].lower()
    allowed_extensions = {".pdf", ".jpg", ".jpeg", ".png", ".gif", ".dwg", ".dxf", ".webp"}

    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type {file_ext} not supported")

    # Determine file type category
    if file_ext == ".pdf":
        file_type = "pdf"
    elif file_ext in {".dwg", ".dxf"}:
        file_type = "cad"
    else:
        file_type = "image"

    # Save file
    upload_path = os.path.join(settings.UPLOAD_DIR, f"project_{project_id}")
    os.makedirs(upload_path, exist_ok=True)

    file_path = os.path.join(upload_path, file.filename)
    content = await file.read()
    file_size = len(content)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    drawing = drawing_service.create_drawing_record(
        db=db,
        project_id=project_id,
        file_name=file.filename,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
    )
    return drawing


@router.get("/{project_id}", response_model=List[DrawingResponse])
def get_drawings(project_id: int, db: Session = Depends(get_db)):
    return drawing_service.get_drawings(db, project_id)


@router.post("/{drawing_id}/analyze", response_model=DrawingResponse)
async def analyze_drawing(drawing_id: int, db: Session = Depends(get_db)):
    """Trigger AI drawing analysis (Gemini Vision if key set, else simulated)."""
    drawing = await analyze_drawing_ai(db, drawing_id)
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found")
    return drawing


@router.get("/single/{drawing_id}", response_model=DrawingResponse)
def get_drawing(drawing_id: int, db: Session = Depends(get_db)):
    drawing = drawing_service.get_drawing(db, drawing_id)
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found")
    return drawing
