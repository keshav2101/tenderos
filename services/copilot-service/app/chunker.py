"""Document chunker for indexing PDFs for RAG retrieval."""
import uuid
from typing import List, Dict


def chunk_document(
    text: str,
    tender_id: str,
    doc_type: str = "notice",
    page_data: List[Dict] = None,
    chunk_size: int = 512,
    overlap: int = 50,
) -> List[Dict]:
    """
    Split text into overlapping chunks.
    Preserves page references when page_data is provided.
    """
    chunks = []
    if not text:
        return chunks

    if page_data:
        # If we have page data, chunk page by page
        for page in page_data:
            page_num = page.get("page", 1)
            page_text = page.get("text", "")
            if not page_text:
                continue

            words = page_text.split()
            for idx in range(0, len(words), chunk_size - overlap):
                chunk_words = words[idx : idx + chunk_size]
                if not chunk_words:
                    break
                chunk_text = " ".join(chunk_words)
                chunks.append({
                    "id": str(uuid.uuid4()),
                    "tender_id": tender_id,
                    "doc_type": doc_type,
                    "page": page_num,
                    "section": page.get("section", ""),
                    "text": chunk_text,
                })
    else:
        # Fallback to simple text splitting
        words = text.split()
        for idx in range(0, len(words), chunk_size - overlap):
            chunk_words = words[idx : idx + chunk_size]
            if not chunk_words:
                break
            chunk_text = " ".join(chunk_words)
            chunks.append({
                "id": str(uuid.uuid4()),
                "tender_id": tender_id,
                "doc_type": doc_type,
                "page": "?",
                "section": "",
                "text": chunk_text,
            })

    return chunks
