import pytest
from utils.pdf_utils import add_watermark
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import io


def _make_test_pdf() -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    c.drawString(100, 700, "Test Offer Letter")
    c.save()
    buf.seek(0)
    return buf.read()


def test_watermark_adds_content():
    pdf = _make_test_pdf()
    watermarked = add_watermark(pdf, "John Doe")
    assert len(watermarked) > 0
    assert watermarked != pdf


def test_watermark_produces_valid_pdf():
    from PyPDF2 import PdfReader
    pdf = _make_test_pdf()
    watermarked = add_watermark(pdf, "Jane Smith")
    reader = PdfReader(io.BytesIO(watermarked))
    assert len(reader.pages) == 1
