"""
Excel Import/Export Service for Materials.

Import: Reads an Excel/CSV file and bulk-inserts materials.
Export: Exports current materials to Excel for download.

Expected Excel columns (case-insensitive):
  name | category | unit | rate | location | description
"""
import io
import os
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.models.material import Material
from datetime import datetime

try:
    import openpyxl
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
    OPENPYXL_AVAILABLE = True
except ImportError:
    OPENPYXL_AVAILABLE = False

VALID_CATEGORIES = [
    "Cement", "Steel", "Sand", "Aggregates", "Masonry",
    "Flooring", "Finishing", "Woodwork", "Electrical", "Plumbing", "General"
]
VALID_UNITS = [
    "bag", "kg", "ton", "cft", "sqft", "sqm", "nos",
    "ltr", "mtr", "cum", "set", "rft"
]

# Column aliases
COL_MAP = {
    "name": ["name", "material name", "material", "item"],
    "category": ["category", "type", "group"],
    "unit": ["unit", "uom", "unit of measure"],
    "rate": ["rate", "price", "cost", "unit rate", "rate (inr)", "rate (₹)"],
    "location": ["location", "city", "place"],
    "description": ["description", "desc", "notes", "remarks"],
}


def _normalize_headers(headers: list) -> dict:
    """Map raw header names → field keys."""
    mapping = {}
    for i, h in enumerate(headers):
        h_clean = str(h).strip().lower()
        for field, aliases in COL_MAP.items():
            if h_clean in aliases:
                mapping[field] = i
                break
    return mapping


def import_materials_from_excel(
    db: Session, file_bytes: bytes, filename: str
) -> Tuple[int, int, List[str]]:
    """
    Parse Excel/CSV and bulk-import materials.
    Returns (imported_count, skipped_count, error_messages)
    """
    if not OPENPYXL_AVAILABLE:
        raise RuntimeError("openpyxl not installed")

    errors = []
    imported = 0
    skipped = 0

    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return 0, 0, ["Empty file"]

    # Find header row (first non-empty row)
    header_row = None
    data_start = 0
    for i, row in enumerate(rows):
        if any(c is not None for c in row):
            header_row = [str(c).strip() if c else "" for c in row]
            data_start = i + 1
            break

    if header_row is None:
        return 0, 0, ["Could not find header row"]

    col_map = _normalize_headers(header_row)
    if "name" not in col_map or "rate" not in col_map:
        return 0, 0, [f"Required columns 'name' and 'rate' not found. Found: {header_row}"]

    for row_idx, row in enumerate(rows[data_start:], start=data_start + 2):
        if not any(c is not None for c in row):
            continue  # skip empty rows

        def get(field):
            idx = col_map.get(field)
            if idx is None or idx >= len(row):
                return None
            return row[idx]

        name = str(get("name") or "").strip()
        if not name:
            skipped += 1
            continue

        try:
            rate = float(str(get("rate") or 0).replace(",", "").replace("₹", "").strip())
        except (ValueError, TypeError):
            errors.append(f"Row {row_idx}: invalid rate '{get('rate')}'")
            skipped += 1
            continue

        if rate <= 0:
            errors.append(f"Row {row_idx}: rate must be > 0 for '{name}'")
            skipped += 1
            continue

        category = str(get("category") or "General").strip()
        if category not in VALID_CATEGORIES:
            category = "General"

        unit = str(get("unit") or "nos").strip().lower()
        if unit not in VALID_UNITS:
            unit = "nos"

        location = str(get("location") or "Bangalore").strip() or "Bangalore"
        description = str(get("description") or "").strip()

        # Check for duplicate
        existing = db.query(Material).filter(
            Material.name == name,
            Material.location == location,
            Material.is_active == 1,
        ).first()

        if existing:
            existing.rate = rate
            existing.category = category
            existing.unit = unit
            existing.description = description
            imported += 1  # count as updated
        else:
            mat = Material(
                name=name, category=category, unit=unit,
                rate=rate, location=location, description=description,
                is_active=1,
            )
            db.add(mat)
            imported += 1

    db.commit()
    return imported, skipped, errors


def export_materials_to_excel(db: Session, category: str = None) -> bytes:
    """Export all active materials to an Excel file. Returns bytes."""
    if not OPENPYXL_AVAILABLE:
        raise RuntimeError("openpyxl not installed")

    query = db.query(Material).filter(Material.is_active == 1)
    if category:
        query = query.filter(Material.category == category)
    materials = query.order_by(Material.category, Material.name).all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Materials"

    # Styles
    header_fill = PatternFill("solid", fgColor="0ea5e9")
    header_font = Font(bold=True, color="FFFFFF", size=11)
    title_font  = Font(bold=True, color="0f172a", size=14)
    border = Border(
        left=Side(style="thin", color="E2E8F0"),
        right=Side(style="thin", color="E2E8F0"),
        top=Side(style="thin", color="E2E8F0"),
        bottom=Side(style="thin", color="E2E8F0"),
    )

    # Title row
    ws.merge_cells("A1:G1")
    ws["A1"] = f"AI MatEsti — Materials Database Export  ({datetime.now().strftime('%d %b %Y')})"
    ws["A1"].font = title_font
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 28

    # Header row
    headers = ["#", "Name", "Category", "Unit", "Rate (₹)", "Location", "Description"]
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=2, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border
    ws.row_dimensions[2].height = 20

    # Data rows
    alt_fill = PatternFill("solid", fgColor="F0F9FF")
    for i, mat in enumerate(materials, 1):
        row_num = i + 2
        row_fill = alt_fill if i % 2 == 0 else None
        row_data = [i, mat.name, mat.category, mat.unit, mat.rate, mat.location, mat.description or ""]
        for col, value in enumerate(row_data, 1):
            cell = ws.cell(row=row_num, column=col, value=value)
            cell.border = border
            cell.alignment = Alignment(vertical="center")
            if row_fill:
                cell.fill = row_fill
        ws.row_dimensions[row_num].height = 16

    # Column widths
    for col, width in zip(range(1, 8), [5, 40, 16, 10, 12, 16, 40]):
        ws.column_dimensions[get_column_letter(col)].width = width

    # Summary sheet
    ws2 = wb.create_sheet("Summary")
    ws2["A1"] = "Category Summary"
    ws2["A1"].font = Font(bold=True, size=12)
    ws2["A2"] = "Category"
    ws2["B2"] = "Item Count"
    ws2["C2"] = "Avg Rate (₹)"
    for cell in [ws2["A2"], ws2["B2"], ws2["C2"]]:
        cell.fill = header_fill
        cell.font = header_font

    from collections import defaultdict
    cat_groups = defaultdict(list)
    for m in materials:
        cat_groups[m.category].append(m.rate)
    for r, (cat, rates) in enumerate(sorted(cat_groups.items()), 3):
        ws2.cell(row=r, column=1, value=cat)
        ws2.cell(row=r, column=2, value=len(rates))
        ws2.cell(row=r, column=3, value=round(sum(rates) / len(rates), 0))

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf.read()


def get_import_template() -> bytes:
    """Return a filled example Excel template for material import."""
    if not OPENPYXL_AVAILABLE:
        raise RuntimeError("openpyxl not installed")

    wb = Workbook()
    ws = wb.active
    ws.title = "Materials Import"

    header_fill = PatternFill("solid", fgColor="0ea5e9")
    header_font = Font(bold=True, color="FFFFFF")
    headers = ["name", "category", "unit", "rate", "location", "description"]
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=h)
        cell.fill = header_fill
        cell.font = header_font

    examples = [
        ["OPC Cement 53 Grade", "Cement",   "bag",  420,  "Bangalore", "53 grade OPC cement"],
        ["TMT Steel Fe 500",    "Steel",    "kg",   75,   "Bangalore", "Fe 500 grade TMT bars"],
        ["River Sand (Fine)",   "Sand",     "cft",  55,   "Bangalore", "River sand for construction"],
        ["20mm Aggregates",     "Aggregates","cft", 45,   "Bangalore", "Coarse aggregate 20mm"],
        ["Red Clay Bricks",     "Masonry",  "nos",  8,    "Bangalore", "Standard red clay bricks"],
    ]
    for r, row in enumerate(examples, 2):
        for c, val in enumerate(row, 1):
            ws.cell(row=r, column=c, value=val)

    for col, width in zip(range(1, 7), [35, 15, 8, 10, 14, 35]):
        ws.column_dimensions[get_column_letter(col)].width = width

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf.read()
