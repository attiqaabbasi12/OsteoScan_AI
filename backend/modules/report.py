from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer,
                                 Table, TableStyle, Image as RLImage,
                                 HRFlowable)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
import os


# ─────────────────────────────────────────────────────────────
# COLORS
# ─────────────────────────────────────────────────────────────
DARK_BLUE   = colors.HexColor('#1a2744')
MED_BLUE    = colors.HexColor('#2563eb')
LIGHT_BLUE  = colors.HexColor('#eff6ff')
GREEN       = colors.HexColor('#16a34a')
ORANGE      = colors.HexColor('#d97706')
RED         = colors.HexColor('#dc2626')
LIGHT_GRAY  = colors.HexColor('#f8fafc')
BORDER_GRAY = colors.HexColor('#e2e8f0')
TEXT_DARK   = colors.HexColor('#1e293b')
TEXT_GRAY   = colors.HexColor('#64748b')


def get_status_color(xray_class):
    return {
        'Normal'      : GREEN,
        'Osteopenia'  : ORANGE,
        'Osteoporosis': RED,
    }.get(xray_class, MED_BLUE)


# ─────────────────────────────────────────────────────────────
# GENERATE PDF REPORT
# ─────────────────────────────────────────────────────────────
def generate_report(session_data: dict, doctor_data: dict,
                    first_aid_data: dict, report_path: str,
                    xray_image_path: str = None,
                    heatmap_image_path: str = None) -> dict:
    """
    Generate a PDF report for the session.

    Returns:
    {
        'success'    : True/False,
        'report_path': '...',
        'message'    : '...'
    }
    """
    try:
        os.makedirs(os.path.dirname(report_path), exist_ok=True)

        doc   = SimpleDocTemplate(
            report_path,
            pagesize=A4,
            rightMargin=2*cm, leftMargin=2*cm,
            topMargin=2*cm,   bottomMargin=2*cm
        )
        story = []
        styles = getSampleStyleSheet()

        # ── Custom Styles ──────────────────────────────────────
        title_style = ParagraphStyle(
            'Title',
            fontSize=20, textColor=DARK_BLUE,
            fontName='Helvetica-Bold', alignment=TA_CENTER,
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'Subtitle',
            fontSize=10, textColor=TEXT_GRAY,
            fontName='Helvetica', alignment=TA_CENTER,
            spaceAfter=2
        )
        section_title_style = ParagraphStyle(
            'SectionTitle',
            fontSize=11, textColor=DARK_BLUE,
            fontName='Helvetica-Bold', spaceAfter=6,
            spaceBefore=12
        )
        normal_style = ParagraphStyle(
            'Normal',
            fontSize=9, textColor=TEXT_DARK,
            fontName='Helvetica', spaceAfter=3,
            leading=14
        )
        bullet_style = ParagraphStyle(
            'Bullet',
            fontSize=9, textColor=TEXT_DARK,
            fontName='Helvetica', spaceAfter=3,
            leftIndent=12, leading=14
        )
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            fontSize=8, textColor=TEXT_GRAY,
            fontName='Helvetica-Oblique',
            alignment=TA_CENTER, spaceAfter=4
        )

        status_color = get_status_color(session_data['xray_class'])

        # ── HEADER ─────────────────────────────────────────────
        story.append(Paragraph('BONE HEALTH SCREENING REPORT', title_style))
        story.append(Paragraph('AI-Assisted Knee X-Ray Analysis', subtitle_style))
        story.append(Spacer(1, 0.3*cm))
        story.append(HRFlowable(width='100%', thickness=2,
                                color=MED_BLUE, spaceAfter=10))

        # ── REPORT META ────────────────────────────────────────
        report_id   = f"RPT-{datetime.now().strftime('%Y%m%d')}-{str(session_data['id']).zfill(4)}"
        report_date = datetime.now().strftime('%B %d, %Y — %I:%M %p')

        meta_data = [
            ['Report ID', report_id, 'Date', report_date],
        ]
        meta_table = Table(meta_data, colWidths=[3*cm, 7*cm, 2.5*cm, 5*cm])
        meta_table.setStyle(TableStyle([
            ('FONTNAME',  (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE',  (0,0), (-1,-1), 8),
            ('TEXTCOLOR', (0,0), (0,-1), TEXT_GRAY),
            ('TEXTCOLOR', (2,0), (2,-1), TEXT_GRAY),
            ('FONTNAME',  (1,0), (1,-1), 'Helvetica-Bold'),
            ('FONTNAME',  (3,0), (3,-1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (1,0), (-1,-1), TEXT_DARK),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 0.4*cm))
        story.append(HRFlowable(width='100%', thickness=0.5,
                                color=BORDER_GRAY, spaceAfter=8))

        # ── LAB / DOCTOR INFO ──────────────────────────────────
        story.append(Paragraph('LAB & DOCTOR INFORMATION', section_title_style))
        lab_data = [
            ['Lab ID',       doctor_data.get('lab_id', '-'),
             'Doctor Name',  doctor_data.get('name', '-')],
            ['Lab Email',    doctor_data.get('email', '-'), '', ''],
        ]
        lab_table = Table(lab_data, colWidths=[3*cm, 7*cm, 3*cm, 4.5*cm])
        lab_table.setStyle(TableStyle([
            ('FONTNAME',  (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE',  (0,0), (-1,-1), 9),
            ('TEXTCOLOR', (0,0), (0,-1), TEXT_GRAY),
            ('TEXTCOLOR', (2,0), (2,-1), TEXT_GRAY),
            ('FONTNAME',  (1,0), (1,-1), 'Helvetica-Bold'),
            ('FONTNAME',  (3,0), (3,-1), 'Helvetica-Bold'),
            ('BACKGROUND',(0,0), (-1,-1), LIGHT_GRAY),
            ('ROWBACKGROUNDS', (0,0), (-1,-1), [LIGHT_GRAY, colors.white]),
            ('GRID',      (0,0), (-1,-1), 0.5, BORDER_GRAY),
            ('PADDING',   (0,0), (-1,-1), 5),
        ]))
        story.append(lab_table)
        story.append(Spacer(1, 0.3*cm))

        # ── PATIENT INFO ───────────────────────────────────────
        story.append(Paragraph('PATIENT INFORMATION', section_title_style))
        patient_data = [
            ['Patient Name', session_data['patient_name'],
             'Age',          str(session_data['patient_age'])],
            ['Gender',       session_data['patient_gender'], '', ''],
        ]
        patient_table = Table(patient_data, colWidths=[3*cm, 7*cm, 3*cm, 4.5*cm])
        patient_table.setStyle(TableStyle([
            ('FONTNAME',  (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE',  (0,0), (-1,-1), 9),
            ('TEXTCOLOR', (0,0), (0,-1), TEXT_GRAY),
            ('TEXTCOLOR', (2,0), (2,-1), TEXT_GRAY),
            ('FONTNAME',  (1,0), (1,-1), 'Helvetica-Bold'),
            ('FONTNAME',  (3,0), (3,-1), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0,0), (-1,-1), [LIGHT_GRAY, colors.white]),
            ('GRID',      (0,0), (-1,-1), 0.5, BORDER_GRAY),
            ('PADDING',   (0,0), (-1,-1), 5),
        ]))
        story.append(patient_table)
        story.append(Spacer(1, 0.3*cm))

        # ── SCAN RESULTS ───────────────────────────────────────
        story.append(Paragraph('SCAN RESULTS', section_title_style))
        confirmed_text = '✓ CONFIRMED' if session_data.get('confirmed') else '✗ NOT CONFIRMED'
        outcome_color  = GREEN if session_data.get('confirmed') else RED

        scan_data = [
            ['Classification', session_data['xray_class'],
             'Confidence',     f"{session_data['confidence']}%"],
            ['Symptom Score',
             f"{session_data.get('symptom_score', '-')} / {session_data.get('max_score', '-')}",
             'Confirmation',   confirmed_text],
            ['Outcome',
             session_data.get('outcome', '-'), '', ''],
        ]
        scan_table = Table(scan_data, colWidths=[3*cm, 7*cm, 3*cm, 4.5*cm])
        scan_table.setStyle(TableStyle([
            ('FONTNAME',  (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE',  (0,0), (-1,-1), 9),
            ('TEXTCOLOR', (0,0), (0,-1), TEXT_GRAY),
            ('TEXTCOLOR', (2,0), (2,-1), TEXT_GRAY),
            ('FONTNAME',  (1,0), (1,-1), 'Helvetica-Bold'),
            ('FONTNAME',  (3,0), (3,-1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (1,0), (1,0), status_color),
            ('ROWBACKGROUNDS', (0,0), (-1,-1), [LIGHT_GRAY, colors.white]),
            ('GRID',      (0,0), (-1,-1), 0.5, BORDER_GRAY),
            ('PADDING',   (0,0), (-1,-1), 5),
        ]))
        story.append(scan_table)
        story.append(Spacer(1, 0.3*cm))

        # ── X-RAY IMAGES ───────────────────────────────────────
        if xray_image_path and heatmap_image_path:
            if os.path.exists(xray_image_path) and os.path.exists(heatmap_image_path):
                story.append(Paragraph('X-RAY ANALYSIS', section_title_style))
                img_width = 7.5*cm
                img_height = 7*cm

                xray_img    = RLImage(xray_image_path,    width=img_width, height=img_height)
                heatmap_img = RLImage(heatmap_image_path, width=img_width, height=img_height)

                img_table = Table(
                    [[xray_img, heatmap_img],
                     [Paragraph('Original X-Ray', normal_style),
                      Paragraph('GradCAM++ Heatmap', normal_style)]],
                    colWidths=[9*cm, 9*cm]
                )
                img_table.setStyle(TableStyle([
                    ('ALIGN',   (0,0), (-1,-1), 'CENTER'),
                    ('VALIGN',  (0,0), (-1,-1), 'MIDDLE'),
                    ('PADDING', (0,0), (-1,-1), 5),
                ]))
                story.append(img_table)
                story.append(Spacer(1, 0.3*cm))

        # ── FIRST AID / RECOMMENDATIONS ────────────────────────
        if first_aid_data and session_data.get('confirmed'):
            story.append(Paragraph('FIRST AID & RECOMMENDATIONS', section_title_style))
            story.append(Paragraph(
                first_aid_data.get('summary', ''), normal_style
            ))
            story.append(Spacer(1, 0.2*cm))

            for step in first_aid_data.get('steps', []):
                cat_style = ParagraphStyle(
                    'Cat', fontSize=10, textColor=MED_BLUE,
                    fontName='Helvetica-Bold', spaceAfter=4, spaceBefore=8
                )
                story.append(Paragraph(
                    f"{step['icon']}  {step['category']}", cat_style
                ))
                for advice in step['advice']:
                    story.append(Paragraph(f"• {advice}", bullet_style))

        elif not session_data.get('confirmed'):
            story.append(Paragraph('RECOMMENDATION', section_title_style))
            story.append(Paragraph(
                'The patient\'s symptoms do not strongly correlate with the X-ray finding. '
                'A DEXA scan is recommended for definitive diagnosis.',
                normal_style
            ))
            dexa_steps = [
                'Refer the patient for a DEXA scan',
                'Consult an orthopedic specialist',
                'Do not start medication without formal diagnosis',
            ]
            for s in dexa_steps:
                story.append(Paragraph(f"• {s}", bullet_style))

        # ── DISCLAIMER ─────────────────────────────────────────
        story.append(Spacer(1, 0.5*cm))
        story.append(HRFlowable(width='100%', thickness=0.5,
                                color=BORDER_GRAY, spaceAfter=8))
        story.append(Paragraph(
            '⚠️  DISCLAIMER: This report is generated by an AI-assisted screening tool and is '
            'intended for clinical decision support only. It does not constitute a formal medical '
            'diagnosis. Always consult a qualified physician for official diagnosis and treatment.',
            disclaimer_style
        ))

        # ── BUILD PDF ──────────────────────────────────────────
        doc.build(story)

        return {
            'success'    : True,
            'report_path': report_path,
            'message'    : 'Report generated successfully'
        }

    except Exception as e:
        return {
            'success': False,
            'message': f'Report generation failed: {str(e)}'
        }
