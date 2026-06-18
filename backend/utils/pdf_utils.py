import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import Color
from PyPDF2 import PdfReader, PdfWriter


def _create_watermark_page(
    candidate_name: str,
    page_width: float,
    page_height: float,
) -> bytes:
    """Creates a single watermark overlay page as bytes."""
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=(page_width, page_height))

    watermark_color = Color(0.5, 0.5, 0.5, alpha=0.15)
    c.setFillColor(watermark_color)
    c.setFont("Helvetica-Bold", 48)

    c.saveState()
    c.translate(page_width / 2, page_height / 2)
    c.rotate(45)
    c.drawCentredString(0, 60, "CONFIDENTIAL")
    c.setFont("Helvetica", 24)
    c.drawCentredString(0, 0, candidate_name)
    c.restoreState()

    c.setFont("Helvetica-Bold", 28)
    c.saveState()
    c.translate(page_width / 4, page_height / 4)
    c.rotate(45)
    c.drawCentredString(0, 0, "CONFIDENTIAL")
    c.restoreState()

    c.save()
    packet.seek(0)
    return packet.read()


def add_watermark(pdf_bytes: bytes, candidate_name: str) -> bytes:
    """Applies a per-page watermark to every page of the PDF."""
    reader = PdfReader(io.BytesIO(pdf_bytes))
    writer = PdfWriter()

    for page in reader.pages:
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)

        wm_bytes = _create_watermark_page(candidate_name, page_width, page_height)
        wm_reader = PdfReader(io.BytesIO(wm_bytes))
        watermark_page = wm_reader.pages[0]

        page.merge_page(watermark_page)
        writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return output.read()
