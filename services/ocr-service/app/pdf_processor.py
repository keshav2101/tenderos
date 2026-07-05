"""
PDF Intelligence Pipeline
Detects PDF type (text/scanned/mixed) and extracts structured content.
"""
from __future__ import annotations
import io
import json
from enum import Enum
from typing import Any, Dict, List, Optional

import pdfplumber
import pytesseract
import structlog
from PIL import Image

logger = structlog.get_logger()


class PDFType(str, Enum):
    TEXT = "text"          # Has selectable text layer
    SCANNED = "scanned"    # Images only, no text layer
    MIXED = "mixed"        # Some pages text, some scanned
    EMPTY = "empty"        # No content


class PageContent(dict):
    pass


class PDFProcessor:
    """
    Detects PDF type and extracts:
    - Paragraphs with page numbers
    - Tables as structured dicts
    - Headers and footers
    - Raw text per page
    """

    MIN_TEXT_CHARS_PER_PAGE = 50  # Below this → treat as scanned

    def classify(self, pdf_bytes: bytes) -> PDFType:
        """Detect whether PDF is text, scanned, or mixed."""
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                if not pdf.pages:
                    return PDFType.EMPTY
                text_pages = 0
                scan_pages = 0
                for page in pdf.pages[:min(10, len(pdf.pages))]:
                    text = page.extract_text() or ""
                    if len(text.strip()) >= self.MIN_TEXT_CHARS_PER_PAGE:
                        text_pages += 1
                    else:
                        scan_pages += 1
                if scan_pages == 0:
                    return PDFType.TEXT
                if text_pages == 0:
                    return PDFType.SCANNED
                return PDFType.MIXED
        except Exception as e:
            logger.error("PDF classification failed", error=str(e))
            return PDFType.SCANNED

    def extract(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """Full extraction pipeline."""
        pdf_type = self.classify(pdf_bytes)
        logger.info("PDF classified", type=pdf_type)

        if pdf_type == PDFType.TEXT:
            return self._extract_text_pdf(pdf_bytes, pdf_type)
        elif pdf_type == PDFType.SCANNED:
            return self._extract_scanned_pdf(pdf_bytes)
        else:  # MIXED
            return self._extract_mixed_pdf(pdf_bytes)

    def _extract_text_pdf(self, pdf_bytes: bytes, pdf_type: PDFType = PDFType.TEXT) -> Dict:
        pages = []
        all_text = []
        tables = []

        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            total_pages = len(pdf.pages)
            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text(layout=True) or ""
                page_tables = page.extract_tables()

                structured_tables = []
                for table in (page_tables or []):
                    if table and len(table) > 1:
                        headers = [str(h or "").strip() for h in table[0]]
                        rows = []
                        for row in table[1:]:
                            if any(cell for cell in row):
                                rows.append({
                                    headers[i]: str(cell or "").strip()
                                    for i, cell in enumerate(row)
                                    if i < len(headers)
                                })
                        if rows:
                            structured_tables.append({"headers": headers, "rows": rows})
                            tables.append({"page": page_num, "data": {"headers": headers, "rows": rows}})

                words = page.extract_words()
                paragraphs = self._group_into_paragraphs(text)

                # Detect header/footer (first/last ~5% of page height)
                page_height = page.height
                header_words = [w for w in (words or []) if w["top"] < page_height * 0.08]
                footer_words = [w for w in (words or []) if w["top"] > page_height * 0.92]
                header = " ".join(w["text"] for w in header_words).strip()
                footer = " ".join(w["text"] for w in footer_words).strip()

                pages.append({
                    "page": page_num,
                    "text": text,
                    "paragraphs": paragraphs,
                    "tables": structured_tables,
                    "header": header,
                    "footer": footer,
                    "method": "pdfplumber",
                })
                all_text.append(f"[PAGE {page_num}]\n{text}")

        return {
            "pdf_type": pdf_type,
            "total_pages": total_pages,
            "pages": pages,
            "full_text": "\n\n".join(all_text),
            "tables": tables,
            "extraction_method": "pdfplumber",
        }

    def _extract_scanned_pdf(self, pdf_bytes: bytes) -> Dict:
        """OCR-based extraction for scanned PDFs."""
        import fitz  # PyMuPDF
        pages = []
        all_text = []

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        total_pages = len(doc)

        for page_num in range(total_pages):
            page = doc[page_num]
            # Render at 300 DPI for good OCR quality
            mat = fitz.Matrix(300 / 72, 300 / 72)
            pix = page.get_pixmap(matrix=mat)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            # OCR with pytesseract
            ocr_config = "--oem 3 --psm 6 -l eng+hin"  # Support Hindi too
            text = pytesseract.image_to_string(img, config=ocr_config)
            paragraphs = self._group_into_paragraphs(text)

            pages.append({
                "page": page_num + 1,
                "text": text,
                "paragraphs": paragraphs,
                "tables": [],  # Table extraction from OCR requires layout analysis
                "header": "",
                "footer": "",
                "method": "pytesseract",
            })
            all_text.append(f"[PAGE {page_num + 1}]\n{text}")

        doc.close()
        return {
            "pdf_type": PDFType.SCANNED,
            "total_pages": total_pages,
            "pages": pages,
            "full_text": "\n\n".join(all_text),
            "tables": [],
            "extraction_method": "pytesseract",
        }

    def _extract_mixed_pdf(self, pdf_bytes: bytes) -> Dict:
        """Hybrid extraction — text pages via pdfplumber, scanned via OCR."""
        text_result = self._extract_text_pdf(pdf_bytes, PDFType.MIXED)
        scanned_result = self._extract_scanned_pdf(pdf_bytes)

        # Merge: use OCR text for pages where pdfplumber got < MIN chars
        merged_pages = []
        for text_page, scan_page in zip(text_result["pages"], scanned_result["pages"]):
            if len((text_page.get("text") or "").strip()) >= self.MIN_TEXT_CHARS_PER_PAGE:
                merged_pages.append(text_page)
            else:
                # Use OCR for this page but keep any tables from pdfplumber
                scan_page["tables"] = text_page.get("tables", [])
                merged_pages.append(scan_page)

        full_text = "\n\n".join(f"[PAGE {p['page']}]\n{p['text']}" for p in merged_pages)
        return {
            "pdf_type": PDFType.MIXED,
            "total_pages": len(merged_pages),
            "pages": merged_pages,
            "full_text": full_text,
            "tables": text_result.get("tables", []),
            "extraction_method": "hybrid",
        }

    def _group_into_paragraphs(self, text: str) -> List[str]:
        """Group text into paragraphs by double newlines."""
        if not text:
            return []
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        return [p for p in paragraphs if len(p) > 20]  # Filter noise
