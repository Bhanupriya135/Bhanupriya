"""
PDF Export Service using ReportLab.
Generates professional PDF reports and BOQ documents.
"""
import os
import io
from datetime import datetime
from typing import Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.platypus.flowables import HRFlowable
from reportlab.lib.colors import HexColor
from sqlalchemy.orm import Session

# Brand Colors
BRAND_BLUE    = HexColor("#0ea5e9")
BRAND_NAVY    = HexColor("#0f172a")
BRAND_LIGHT   = HexColor("#f0f9ff")
BRAND_BORDER  = HexColor("#e2e8f0")
TEXT_DARK     = HexColor("#0f172a")
TEXT_GRAY     = HexColor("#64748b")
SUCCESS_GREEN = HexColor("#22c55e")
WARNING_YEL   = HexColor("#f59e0b")
WHITE         = colors.white


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=20, textColor=WHITE, alignment=TA_LEFT, spaceAfter=4),
        "subtitle": ParagraphStyle("subtitle", fontName="Helvetica", fontSize=10, textColor=HexColor("#bae6fd"), alignment=TA_LEFT),
        "section": ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=11, textColor=BRAND_NAVY, spaceBefore=14, spaceAfter=6),
        "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9, textColor=TEXT_DARK, spaceAfter=4),
        "small": ParagraphStyle("small", fontName="Helvetica", fontSize=8, textColor=TEXT_GRAY),
        "bold": ParagraphStyle("bold", fontName="Helvetica-Bold", fontSize=9, textColor=TEXT_DARK),
        "total": ParagraphStyle("total", fontName="Helvetica-Bold", fontSize=11, textColor=WHITE),
    }


def _header_table(project: dict, report_type: str) -> Table:
    """Build blue header banner."""
    s = _styles()
    title_text = Paragraph(project.get("name", "Project Report"), s["title"])
    sub_text = Paragraph(
        f"Client: {project.get('client','—')}  |  {project.get('type','')}  |  {project.get('location','—')}",
        s["subtitle"]
    )
    type_label = report_type.replace("_", " ").upper()
    date_text = Paragraph(f"{type_label}  |  {datetime.now().strftime('%d %b %Y')}", s["subtitle"])

    data = [[title_text, ""], [sub_text, date_text]]
    t = Table(data, colWidths=[120*mm, 55*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND_NAVY),
        ("TEXTCOLOR",  (0, 0), (-1, -1), WHITE),
        ("TOPPADDING",    (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("LEFTPADDING",   (0, 0), (-1, -1), 16),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 16),
        ("SPAN", (0, 0), (1, 0)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 1), (1, 1), "RIGHT"),
    ]))
    return t


def _kv_table(rows: list) -> Table:
    """Two-column key-value info table."""
    s = _styles()
    data = [[Paragraph(k, s["small"]), Paragraph(str(v), s["bold"])] for k, v in rows]
    t = Table(data, colWidths=[50*mm, 120*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), BRAND_LIGHT),
        ("GRID", (0, 0), (-1, -1), 0.4, BRAND_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def generate_project_pdf(db: Session, report_data: dict, output_path: str) -> str:
    """Generate a full project report PDF."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=15*mm, bottomMargin=20*mm,
    )
    s = _styles()
    story = []

    project = report_data.get("project", {})
    cost    = report_data.get("cost_estimation", {})
    mat_est = report_data.get("material_estimation", {})
    boq     = report_data.get("boq", {})
    drawing = report_data.get("drawing_analysis", {})

    # ── Header ──────────────────────────────────────────────
    story.append(_header_table(project, report_data.get("report_type", "project_report")))
    story.append(Spacer(1, 10*mm))

    # ── Project Info ─────────────────────────────────────────
    story.append(Paragraph("PROJECT INFORMATION", s["section"]))
    story.append(_kv_table([
        ("Project Type",       project.get("type", "—")),
        ("Construction Type",  project.get("construction_type", "—")),
        ("Location",           project.get("location", "—")),
        ("Built-up Area",      f"{project.get('built_up_area', 0):,.0f} sqft"),
        ("Number of Floors",   project.get("floors", 1)),
        ("Status",             project.get("status", "—").replace("_", " ").title()),
    ]))
    story.append(Spacer(1, 6*mm))

    # ── Drawing Analysis ─────────────────────────────────────
    if drawing and drawing.get("elements"):
        story.append(Paragraph("DRAWING ANALYSIS SUMMARY", s["section"]))
        el = drawing.get("elements", {})
        dims = drawing.get("dimensions", {})
        rows = [
            ("Total Rooms",     el.get("rooms", {}).get("total", "—")),
            ("Columns",         el.get("structural", {}).get("columns", "—")),
            ("Beams",           el.get("structural", {}).get("beams", "—")),
            ("Doors / Windows", f"{el.get('openings',{}).get('doors','—')} / {el.get('openings',{}).get('windows','—')}"),
            ("Total Area",      f"{dims.get('total_built_up_area_sqft', 0):,.0f} sqft"),
        ]
        story.append(_kv_table(rows))
        story.append(Spacer(1, 6*mm))

    # ── Material Estimation ───────────────────────────────────
    items = mat_est.get("items", [])
    if items:
        story.append(Paragraph("MATERIAL ESTIMATION", s["section"]))
        headers = ["Material", "Category", "Qty", "Unit", "Rate (₹)", "Amount (₹)"]
        table_data = [[Paragraph(h, s["bold"]) for h in headers]]
        for item in items:
            table_data.append([
                Paragraph(item.get("material", ""), s["body"]),
                Paragraph(item.get("category", ""), s["small"]),
                Paragraph(f"{item.get('quantity', 0):,.2f}", s["body"]),
                Paragraph(item.get("unit", ""), s["body"]),
                Paragraph(f"{item.get('rate', 0):,.0f}", s["body"]),
                Paragraph(f"{item.get('total', 0):,.0f}", s["bold"]),
            ])
        # Total row
        table_data.append([
            Paragraph("TOTAL MATERIAL COST", s["bold"]),
            "", "", "", "",
            Paragraph(f"₹{mat_est.get('total_material_cost', 0):,.0f}", s["bold"]),
        ])
        col_w = [55*mm, 30*mm, 20*mm, 15*mm, 22*mm, 28*mm]
        mat_table = Table(table_data, colWidths=col_w, repeatRows=1)
        mat_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
            ("TEXTCOLOR",  (0, 0), (-1, 0), WHITE),
            ("GRID",       (0, 0), (-1, -1), 0.4, BRAND_BORDER),
            ("ROWBACKGROUNDS", (0, 1), (-1, -2), [WHITE, BRAND_LIGHT]),
            ("BACKGROUND", (0, -1), (-1, -1), BRAND_NAVY),
            ("TEXTCOLOR",  (0, -1), (-1, -1), WHITE),
            ("SPAN",       (0, -1), (4, -1)),
            ("ALIGN",      (2, 0), (-1, -1), "RIGHT"),
            ("TOPPADDING",    (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ]))
        story.append(mat_table)
        story.append(Spacer(1, 6*mm))

    # ── Cost Estimation ───────────────────────────────────────
    if cost and cost.get("total_project_cost", 0) > 0:
        story.append(Paragraph("COST ESTIMATION SUMMARY", s["section"]))
        cost_rows = [
            ("Material Cost",     f"₹{cost.get('material_cost', 0):,.0f}"),
            ("Labor Cost (35%)",  f"₹{cost.get('labor_cost', 0):,.0f}"),
            ("Equipment Cost (10%)", f"₹{cost.get('equipment_cost', 0):,.0f}"),
            ("Other Expenses (5%)", f"₹{cost.get('other_cost', 0):,.0f}"),
            ("Sub-Total",         f"₹{cost.get('subtotal', 0):,.0f}"),
            ("GST @ 18%",         f"₹{cost.get('tax', 0):,.0f}"),
            ("Contingency (5%)",  f"₹{cost.get('contingency', 0):,.0f}"),
        ]
        story.append(_kv_table(cost_rows))

        # Total banner
        total_data = [[
            Paragraph("TOTAL PROJECT COST", s["total"]),
            Paragraph(f"₹{cost.get('total_project_cost', 0):,.0f}", s["total"]),
            Paragraph(f"₹{cost.get('cost_per_sqft', 0):,.0f} / sqft", s["total"]),
        ]]
        total_table = Table(total_data, colWidths=[70*mm, 60*mm, 45*mm])
        total_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BRAND_NAVY),
            ("TEXTCOLOR",  (0, 0), (-1, -1), WHITE),
            ("ALIGN",      (1, 0), (-1, -1), "RIGHT"),
            ("TOPPADDING",    (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ]))
        story.append(Spacer(1, 4*mm))
        story.append(total_table)
        story.append(Spacer(1, 6*mm))

    # ── BOQ Summary ───────────────────────────────────────────
    boq_items = boq.get("items", [])
    if boq_items:
        story.append(Paragraph("BILL OF QUANTITIES (BOQ)", s["section"]))
        headers = ["Sl.", "Description", "Unit", "Qty", "Rate (₹)", "Amount (₹)", "Remarks"]
        boq_data = [[Paragraph(h, s["bold"]) for h in headers]]
        for item in boq_items:
            boq_data.append([
                Paragraph(str(item.get("sl_no", "")), s["small"]),
                Paragraph(item.get("description", ""), s["body"]),
                Paragraph(item.get("unit", ""), s["body"]),
                Paragraph(f"{item.get('quantity', 0):,.2f}", s["body"]),
                Paragraph(f"{item.get('rate', 0):,.0f}", s["body"]),
                Paragraph(f"{item.get('amount', 0):,.0f}", s["bold"]),
                Paragraph(item.get("remarks", "") or "", s["small"]),
            ])
        boq_data.append([
            Paragraph("TOTAL", s["bold"]), "", "", "", "",
            Paragraph(f"₹{boq.get('total_amount', 0):,.0f}", s["bold"]),
            "",
        ])
        col_w = [8*mm, 60*mm, 14*mm, 18*mm, 20*mm, 24*mm, 26*mm]
        boq_table = Table(boq_data, colWidths=col_w, repeatRows=1)
        boq_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
            ("TEXTCOLOR",  (0, 0), (-1, 0), WHITE),
            ("GRID",       (0, 0), (-1, -1), 0.4, BRAND_BORDER),
            ("ROWBACKGROUNDS", (0, 1), (-1, -2), [WHITE, BRAND_LIGHT]),
            ("BACKGROUND", (0, -1), (-1, -1), BRAND_NAVY),
            ("TEXTCOLOR",  (0, -1), (-1, -1), WHITE),
            ("SPAN",       (0, -1), (4, -1)),
            ("ALIGN",      (3, 0), (-1, -1), "RIGHT"),
            ("TOPPADDING",    (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING",   (0, 0), (-1, -1), 4),
        ]))
        story.append(boq_table)
        story.append(Spacer(1, 6*mm))

    # ── Footer note ──────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=BRAND_BORDER))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        f"Generated by AI MatEsti  •  {datetime.now().strftime('%d %b %Y %H:%M')}  •  Estimates are indicative and subject to site conditions.",
        s["small"]
    ))

    doc.build(story)
    return output_path


def generate_boq_pdf(boq_data: dict, project: dict, output_path: str) -> str:
    """Generate a standalone BOQ PDF."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=15*mm, bottomMargin=20*mm,
    )
    s = _styles()
    story = []

    story.append(_header_table(project, "BOQ"))
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph("BILL OF QUANTITIES", s["section"]))

    headers = ["Sl.", "Description", "Material", "Unit", "Quantity", "Rate (₹)", "Amount (₹)"]
    data = [[Paragraph(h, s["bold"]) for h in headers]]
    items = boq_data.get("items", [])
    for item in items:
        data.append([
            Paragraph(str(item.get("sl_no", "")), s["small"]),
            Paragraph(item.get("description", ""), s["body"]),
            Paragraph(item.get("material", "") or "", s["small"]),
            Paragraph(item.get("unit", ""), s["body"]),
            Paragraph(f"{item.get('quantity', 0):,.2f}", s["body"]),
            Paragraph(f"{item.get('rate', 0):,.0f}", s["body"]),
            Paragraph(f"{item.get('amount', 0):,.0f}", s["bold"]),
        ])
    data.append([
        Paragraph("TOTAL BOQ VALUE", s["bold"]), "", "", "", "", "",
        Paragraph(f"₹{boq_data.get('total_amount', 0):,.0f}", s["bold"]),
    ])
    col_w = [8*mm, 58*mm, 30*mm, 14*mm, 18*mm, 20*mm, 22*mm]
    t = Table(data, colWidths=col_w, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
        ("TEXTCOLOR",  (0, 0), (-1, 0), WHITE),
        ("GRID",       (0, 0), (-1, -1), 0.4, BRAND_BORDER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [WHITE, BRAND_LIGHT]),
        ("BACKGROUND", (0, -1), (-1, -1), BRAND_NAVY),
        ("TEXTCOLOR",  (0, -1), (-1, -1), WHITE),
        ("SPAN",       (0, -1), (5, -1)),
        ("ALIGN",      (4, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 6*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BRAND_BORDER))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        f"Generated by AI MatEsti  •  {datetime.now().strftime('%d %b %Y %H:%M')}",
        s["small"]
    ))
    doc.build(story)
    return output_path
