FROM python:3.11-slim

# Install system dependencies for OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

RUN adduser --disabled-password --gecos "" --no-create-home appuser
USER appuser

EXPOSE 8006

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8006"]
