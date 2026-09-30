"""
Tender PDF Generator.
Produces a professional, printable tender/quotation document.
"""
import os
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, HRFlowable, KeepTogether
)

BRAND_BLUE  = HexColor("#0ea5e9")
BRAND_NAVY  = HexColor("#0f172a")
BRAND_LIGHT = HexColor("#f0f9ff")
BORDER_CLR  = HexColor("#e2e8f0")
WHITE       = colors.white
GRAY        = HexColor("#64748b")
SUCCESS     = HexColor("#22c55e")


def _s():
    return {
        "h1":    ParagraphStyle("h1",    fontName="Helvetica-Bold",  fontSize=22, textColor=WHITE,      alignment=TA_LEFT),
        "h2":    ParagraphStyle("h2",    fontName="Helvetica-Bold",  fontSize=11, textColor=BRAND_NAVY, spaceBefore=10, spaceAfter=4),
        "h3":    ParagraphStyle("h3",    fontName="Helvetica-Bold",  fontSize=9,  textColor=BRAND_NAVY),
        "body":  ParagraphStyle("body",  fontName="Helvetica",       fontSize=9,  textColor=BRAND_NAVY, spaceAfter=2),
        "small": ParagraphStyle("small", fontName="Helvetica",       fontSize=8,  textColor=GRAY),
        "bold":  ParagraphStyle("bold",  fontName="Helvetica-Bold",  fontSize=9,  textColor=BRAND_NAVY),
        "total": ParagraphStyle("total", fontName="Helvetica-Bold",  fontSize=12, textColor=WHITE),
        "sub":   ParagraphStyle("sub",   fontName="Helvetica",       fontSize=9,  textColor=BRAND_NAVY, alignment=TA_RIGHT),
        "center":ParagraphStyle("center",fontName="Helvetica",       fontSize=9,  textColor=BRAND_NAVY, alignment=TA_CENTER),
        "white_sm": ParagraphStyle("white_sm", fontName="Helvetica", fontSize=9,  textColor=HexColor("#bae6fd")),
    }


def generate_tender_pdf(tender, output_path: str) -> str:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=15*mm, bottomMargin=20*mm,
    )
    s = _s()
    story = []
    td   = tender.tender_data or {}
    proj = td.get("project", {})
    cost = td.get("cost_estimation", {})
    boq  = td.get("boq", [])

    # ── Cover Header ─────────────────────────────────────────────────
    quoted = tender.quoted_amount or cost.get("total_project_cost", 0)
    discount = tender.discount_percent or 0
    final_amount = quoted * (1 - discount / 100)

    header_data = [[
        Table([
            [Paragraph(tender.company_name, s["h1"])],
            [Paragraph(tender.company_address or "", s["white_sm"])],
            [Paragraph(
                f"{'📞 ' + tender.company_phone + '   ' if tender.company_phone else ''}"
                f"{'✉ ' + tender.company_email if tender.company_email else ''}",
                s["white_sm"]
            )],
        ], colWidths=[120*mm], style=TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), BRAND_NAVY),
            ("TOPPADDING",    (0,0), (-1,-1), 4),
            ("BOTTOMPADDING", (0,0), (-1,-1), 2),
            ("LEFTPADDING",   (0,0), (-1,-1), 0),
        ])),
        Table([
            [Paragraph("TENDER / QUOTATION", ParagraphStyle("tq", fontName="Helvetica-Bold", fontSize=10, textColor=BRAND_BLUE, alignment=TA_RIGHT))],
            [Paragraph(f"No: {tender.tender_no}", ParagraphStyle("tn", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE, alignment=TA_RIGHT))],
            [Paragraph(f"Date: {tender.tender_date.strftime('%d %b %Y') if tender.tender_date else datetime.now().strftime('%d %b %Y')}", s["white_sm"])],
            [Paragraph(f"Valid till: {(tender.tender_date + timedelta(days=tender.validity_days or 30)).strftime('%d %b %Y') if tender.tender_date else ''}", s["white_sm"])],
        ], colWidths=[55*mm], style=TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), BRAND_NAVY),
            ("ALIGN",      (0,0), (-1,-1), "RIGHT"),
            ("TOPPADDING",    (0,0), (-1,-1), 4),
            ("BOTTOMPADDING", (0,0), (-1,-1), 2),
            ("RIGHTPADDING",  (0,0), (-1,-1), 0),
        ])),
    ]]
    outer = Table(header_data, colWidths=[120*mm, 55*mm])
    outer.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), BRAND_NAVY),
        ("TOPPADDING",    (0,0), (-1,-1), 14),
        ("BOTTOMPADDING", (0,0), (-1,-1), 14),
        ("LEFTPADDING",   (0,0), (-1,-1), 14),
        ("RIGHTPADDING",  (0,0), (-1,-1), 14),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ]))
    story.append(outer)

    # GSTIN / License strip
    if tender.company_gstin or tender.company_license:
        strip = f"GSTIN: {tender.company_gstin or '—'}    |    License No: {tender.company_license or '—'}"
        story.append(Table([[Paragraph(strip, ParagraphStyle("strip", fontName="Helvetica", fontSize=8, textColor=WHITE, alignment=TA_CENTER))]],
            colWidths=[175*mm], style=TableStyle([
                ("BACKGROUND",    (0,0), (-1,-1), BRAND_BLUE),
                ("TOPPADDING",    (0,0), (-1,-1), 4),
                ("BOTTOMPADDING", (0,0), (-1,-1), 4),
            ])
        ))
    story.append(Spacer(1, 6*mm))

    # ── Addressed To / Project Info ───────────────────────────────────
    story.append(KeepTogether([
        Paragraph("TENDER SUBMITTED TO", s["h2"]),
        _kv(s, [
            ("Client Name",       proj.get("client", "—")),
            ("Project Name",      proj.get("name", "—")),
            ("Project Type",      proj.get("type", "—")),
            ("Location",          proj.get("location", "—")),
            ("Built-up Area",     f"{proj.get('built_up_area', 0):,.0f} sqft  ({proj.get('floors', 1)} floor{'s' if (proj.get('floors') or 1) > 1 else ''})"),
            ("Construction Type", proj.get("construction_type", "RCC")),
        ])
    ]))
    story.append(Spacer(1, 4*mm))

    # ── Scope of Work ─────────────────────────────────────────────────
    scope = tender.scope_of_work or _default_scope(proj)
    story.append(KeepTogether([
        Paragraph("SCOPE OF WORK", s["h2"]),
        Paragraph(scope, s["body"]),
    ]))
    story.append(Spacer(1, 4*mm))

    # ── BOQ Table ────────────────────────────────────────────────────
    if boq:
        story.append(Paragraph("BILL OF QUANTITIES", s["h2"]))
        headers = ["Sl.", "Description", "Unit", "Qty", "Rate (₹)", "Amount (₹)"]
        rows = [[Paragraph(h, ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8, textColor=WHITE)) for h in headers]]
        for item in boq:
            rows.append([
                Paragraph(str(item.get("sl_no", "")), s["small"]),
                Paragraph(item.get("description", ""), s["body"]),
                Paragraph(item.get("unit", ""), s["small"]),
                Paragraph(f"{item.get('quantity', 0):,.2f}", s["small"]),
                Paragraph(f"{item.get('rate', 0):,.0f}", s["small"]),
                Paragraph(f"{item.get('amount', 0):,.0f}", s["bold"]),
            ])
        boq_total = td.get("boq_total", 0)
        rows.append([
            Paragraph("TOTAL", s["bold"]), "", "", "", "",
            Paragraph(f"₹{boq_total:,.0f}", ParagraphStyle("tot", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE)),
        ])
        col_w = [10*mm, 72*mm, 14*mm, 18*mm, 20*mm, 26*mm]
        boq_table = Table(rows, colWidths=col_w, repeatRows=1)
        boq_table.setStyle(TableStyle([
            ("BACKGROUND",     (0, 0), (-1,  0), BRAND_BLUE),
            ("GRID",           (0, 0), (-1, -1), 0.4, BORDER_CLR),
            ("ROWBACKGROUNDS", (0, 1), (-1, -2), [WHITE, BRAND_LIGHT]),
            ("BACKGROUND",     (0,-1), (-1, -1), BRAND_NAVY),
            ("SPAN",           (0,-1), (4,  -1)),
            ("ALIGN",          (3, 0), (-1, -1), "RIGHT"),
            ("TOPPADDING",     (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING",  (0, 0), (-1, -1), 4),
            ("LEFTPADDING",    (0, 0), (-1, -1), 4),
        ]))
        story.append(boq_table)
        story.append(Spacer(1, 4*mm))

    # ── Financial Summary ────────────────────────────────────────────
    story.append(Paragraph("FINANCIAL SUMMARY", s["h2"]))
    fin_rows = [
        ("Estimated Material Cost",  f"₹{cost.get('material_cost', 0):,.0f}"),
        ("Labor & Equipment",        f"₹{(cost.get('labor_cost', 0) + cost.get('equipment_cost', 0)):,.0f}"),
        ("Other Expenses",           f"₹{cost.get('other_cost', 0):,.0f}"),
        ("Sub-Total",                f"₹{cost.get('subtotal', 0):,.0f}"),
        ("GST @ 18%",                f"₹{cost.get('tax', 0):,.0f}"),
        ("Contingency",              f"₹{cost.get('contingency', 0):,.0f}"),
        ("Quoted Amount",            f"₹{quoted:,.0f}"),
    ]
    if discount > 0:
        fin_rows.append((f"Discount ({discount}%)", f"-₹{quoted * discount / 100:,.0f}"))
    story.append(_kv(s, fin_rows))

    # Grand total banner
    story.append(Spacer(1, 3*mm))
    gt = Table([[
        Paragraph("FINAL TENDER AMOUNT", s["total"]),
        Paragraph(f"₹{final_amount:,.0f}", ParagraphStyle("gtv", fontName="Helvetica-Bold", fontSize=14, textColor=WHITE, alignment=TA_RIGHT)),
    ]], colWidths=[110*mm, 65*mm])
    gt.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), BRAND_NAVY),
        ("TOPPADDING",    (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 10),
        ("LEFTPADDING",   (0,0), (-1,-1), 12),
        ("RIGHTPADDING",  (0,0), (-1,-1), 12),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    story.append(gt)
    story.append(Spacer(1, 5*mm))

    # ── Payment & Delivery Terms ──────────────────────────────────────
    adv = tender.advance_percent or 20
    story.append(KeepTogether([
        Paragraph("PAYMENT & DELIVERY TERMS", s["h2"]),
        _kv(s, [
            ("Advance Payment",     f"{adv:.0f}% of tender amount on acceptance (₹{final_amount * adv / 100:,.0f})"),
            ("Progress Payment",    "Based on certified work completion milestones"),
            ("Final Payment",       "Balance on project completion and handover"),
            ("Project Delivery",    f"Within {tender.delivery_days or 90} working days from advance receipt"),
            ("Tender Validity",     f"{tender.validity_days or 30} days from tender date"),
        ])
    ]))
    story.append(Spacer(1, 4*mm))

    # ── Terms & Conditions ────────────────────────────────────────────
    terms = tender.payment_terms or _default_terms()
    story.append(KeepTogether([
        Paragraph("TERMS & CONDITIONS", s["h2"]),
        Paragraph(terms, s["body"]),
    ]))

    # Exclusions
    if tender.exclusions:
        story.append(Spacer(1, 3*mm))
        story.append(KeepTogether([
            Paragraph("EXCLUSIONS", s["h2"]),
            Paragraph(tender.exclusions, s["body"]),
        ]))

    # Special Conditions
    if tender.special_conditions:
        story.append(Spacer(1, 3*mm))
        story.append(KeepTogether([
            Paragraph("SPECIAL CONDITIONS", s["h2"]),
            Paragraph(tender.special_conditions, s["body"]),
        ]))

    # ── Acceptance / Signature Block ──────────────────────────────────
    story.append(Spacer(1, 8*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_CLR))
    story.append(Spacer(1, 4*mm))
    sig_data = [[
        Table([
            [Paragraph("For " + tender.company_name, s["bold"])],
            [Spacer(1, 12*mm)],
            [Paragraph("Authorised Signatory", s["small"])],
            [Paragraph("Name & Designation", s["small"])],
        ], colWidths=[75*mm]),
        Table([
            [Paragraph("Accepted by Client", s["bold"])],
            [Spacer(1, 12*mm)],
            [Paragraph("Client Signature", s["small"])],
            [Paragraph(f"Date: _______________", s["small"])],
        ], colWidths=[75*mm]),
    ]]
    sig_table = Table(sig_data, colWidths=[87*mm, 88*mm])
    sig_table.setStyle(TableStyle([
        ("BOX",           (0,0), (0,0), 0.4, BORDER_CLR),
        ("BOX",           (1,0), (1,0), 0.4, BORDER_CLR),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 4*mm))

    # Footer
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_CLR))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        f"Generated by AI MatEsti  •  {datetime.now().strftime('%d %b %Y %H:%M')}  •  "
        f"Tender No: {tender.tender_no}  •  This is a computer-generated document.",
        ParagraphStyle("foot", fontName="Helvetica", fontSize=7, textColor=GRAY, alignment=TA_CENTER)
    ))

    doc.build(story)
    return output_path


def _kv(s, rows):
    data = [
        [Paragraph(k, s["small"]), Paragraph(str(v), s["bold"])]
        for k, v in rows
    ]
    t = Table(data, colWidths=[52*mm, 123*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (0,-1), BRAND_LIGHT),
        ("GRID",          (0,0), (-1,-1), 0.4, BORDER_CLR),
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING",   (0,0), (-1,-1), 6),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    return t


def _default_scope(proj: dict) -> str:
    area = proj.get("built_up_area", 0)
    floors = proj.get("floors", 1)
    ctype = proj.get("construction_type", "RCC")
    ptype = proj.get("type", "Residential")
    return (
        f"Complete {ctype} construction of {ptype.lower()} building comprising {floors} floor(s) "
        f"with total built-up area of {area:,.0f} sqft. "
        f"Work includes: site preparation, foundation, structural framework, masonry, "
        f"plastering, flooring, doors & windows, electrical, plumbing, painting, and finishing as per approved drawings. "
        f"All materials shall conform to relevant IS codes and specifications."
    )


def _default_terms() -> str:
    return (
        "1. All materials used shall conform to relevant Indian Standard (IS) specifications.\n"
        "2. Work shall be carried out as per approved architectural and structural drawings.\n"
        "3. Any extra/additional work beyond the agreed scope will be charged separately with prior written approval.\n"
        "4. The contractor shall maintain the site in a clean and safe condition throughout the project duration.\n"
        "5. Any defects arising within 12 months of project completion shall be rectified by the contractor at no extra cost.\n"
        "6. Disputes, if any, shall be subject to the jurisdiction of Bangalore courts.\n"
        "7. Prices are inclusive of all taxes except GST which will be charged as applicable.\n"
        "8. Force majeure conditions such as natural disasters, government restrictions shall be excluded from the delivery timeline."
    )
