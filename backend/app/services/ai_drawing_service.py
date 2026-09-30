"""
AI Drawing Analysis Service using Google Gemini Vision API.

SETUP:
  1. Get a free API key from https://aistudio.google.com/app/apikey
  2. Set env variable:  GEMINI_API_KEY=your_key_here
  3. Or create backend/.env with:  GEMINI_API_KEY=your_key_here

If no key is configured, the service falls back to the simulated engine.
"""

import os
import json
import base64
import math
import httpx
from sqlalchemy.orm import Session
from app.models.drawing import Drawing
from app.models.project import Project
from typing import Optional


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

ANALYSIS_PROMPT = """
You are an expert construction drawing analyst. Analyze this floor plan / architectural drawing image.

Extract and return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "status": "completed",
  "analysis_type": "gemini_vision",
  "elements": {
    "rooms": {
      "total": <integer>,
      "bedrooms": <integer>,
      "bathrooms": <integer>,
      "living_rooms": <integer>,
      "kitchens": <integer>,
      "other": <integer>
    },
    "structural": {
      "columns": <integer>,
      "beams": <integer>,
      "walls_linear_meters": <integer>,
      "slabs": <integer>
    },
    "openings": {
      "doors": <integer>,
      "windows": <integer>
    }
  },
  "dimensions": {
    "total_built_up_area_sqft": <number>,
    "total_built_up_area_sqm": <number>,
    "approx_length_m": <number>,
    "approx_width_m": <number>,
    "floor_height_m": 3.0,
    "floors": <integer>,
    "carpet_area_sqft": <number>
  },
  "summary": {
    "project_type": "<Residential|Commercial|Industrial>",
    "construction_type": "<RCC|LoadBearing|Steel>",
    "total_floors": <integer>,
    "total_area_sqft": <number>,
    "estimated_rooms": <integer>,
    "structural_elements_detected": <integer>,
    "observations": "<brief observations about the drawing>"
  }
}

Use your best judgment for any values you cannot determine precisely.
If the image is not a floor plan, still return valid JSON with estimated zeros.
"""


async def analyze_with_gemini(image_path: str, project: Project) -> dict:
    """Call Gemini Vision API to analyze a drawing image."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")

    # Read and base64 encode the image
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    # Detect MIME type
    ext = os.path.splitext(image_path)[-1].lower()
    mime_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                ".png": "image/png", ".gif": "image/gif",
                ".webp": "image/webp", ".pdf": "application/pdf"}
    mime_type = mime_map.get(ext, "image/jpeg")

    payload = {
        "contents": [{
            "parts": [
                {"text": ANALYSIS_PROMPT},
                {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": image_b64,
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 1024,
        }
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        response.raise_for_status()
        data = response.json()

    # Extract text response
    text = data["candidates"][0]["content"]["parts"][0]["text"]

    # Clean markdown code fences if present
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    result = json.loads(text)

    # Patch project-specific fields
    result["analysis_type"] = "gemini_vision"
    result["status"] = "completed"
    if project.built_up_area and result["dimensions"]["total_built_up_area_sqft"] == 0:
        result["dimensions"]["total_built_up_area_sqft"] = project.built_up_area * (project.floors or 1)

    return result


def _simulated_analysis(project: Project) -> dict:
    """Fallback: coefficient-based simulated analysis (used when no API key)."""
    area = project.built_up_area or 1200
    floors = project.floors or 1
    total_area = area * floors

    rooms_count = max(2, int(total_area / 150))
    bedrooms    = max(1, int(rooms_count * 0.4))
    bathrooms   = max(1, int(rooms_count * 0.2))
    columns     = max(4, int(total_area / 100) * 2)
    beams       = max(4, int(total_area / 80) * 2)
    walls_lm    = int(math.sqrt(total_area) * 8)
    doors       = rooms_count + 2
    windows     = rooms_count * 2

    approx_length = round(math.sqrt(area * 1.5), 1)
    approx_width  = round(area / max(approx_length, 1), 1)

    return {
        "status": "completed",
        "analysis_type": "simulated",
        "note": "Simulated analysis — set GEMINI_API_KEY for real AI analysis.",
        "elements": {
            "rooms":      {"total": rooms_count, "bedrooms": bedrooms, "bathrooms": bathrooms,
                           "living_rooms": 1, "kitchens": 1, "other": max(0, rooms_count - bedrooms - bathrooms - 2)},
            "structural": {"columns": columns, "beams": beams,
                           "walls_linear_meters": walls_lm, "slabs": floors},
            "openings":   {"doors": doors, "windows": windows},
        },
        "dimensions": {
            "total_built_up_area_sqft": total_area,
            "total_built_up_area_sqm":  round(total_area * 0.0929, 2),
            "approx_length_m": approx_length,
            "approx_width_m":  approx_width,
            "floor_height_m":  3.0,
            "floors":          floors,
            "carpet_area_sqft": round(total_area * 0.70, 1),
        },
        "summary": {
            "project_type":               project.project_type,
            "construction_type":          project.construction_type or "RCC",
            "total_floors":               floors,
            "total_area_sqft":            total_area,
            "estimated_rooms":            rooms_count,
            "structural_elements_detected": columns + beams,
            "observations": "Simulated analysis. Upload a real floor plan and add GEMINI_API_KEY for AI results.",
        },
    }


async def analyze_drawing_ai(db: Session, drawing_id: int) -> Optional[Drawing]:
    """
    Main entry point. Uses Gemini Vision if API key is set, else falls back to simulation.
    """
    drawing = db.query(Drawing).filter(Drawing.id == drawing_id).first()
    if not drawing:
        return None

    project = db.query(Project).filter(Project.id == drawing.project_id).first()

    drawing.analysis_status = "processing"
    db.commit()

    try:
        if GEMINI_API_KEY and drawing.file_path and os.path.exists(drawing.file_path):
            result = await analyze_with_gemini(drawing.file_path, project)
        else:
            result = _simulated_analysis(project)

        drawing.analysis_status = "completed"
        drawing.analysis_result = result
        project.status = "in_progress"
        db.commit()
        db.refresh(drawing)
        return drawing

    except Exception as e:
        drawing.analysis_status = "failed"
        drawing.analysis_result = {"error": str(e), "status": "failed"}
        db.commit()
        raise e
