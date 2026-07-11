FROM python:3.11-slim

WORKDIR /app

# Install system dependencies and redis-server
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-only torch first to prevent downloading heavy CUDA binaries
RUN pip install --no-cache-dir --timeout=120 --retries=5 torch --index-url https://download.pytorch.org/whl/cpu

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=120 --retries=5 -r requirements.txt

# Create log directory
RUN mkdir -p /var/log

# Copy all application directories
COPY services/ ./services/
COPY shared/ ./shared/
COPY scripts/ ./scripts/
COPY start.sh .

# Set execution permissions
RUN chmod +x start.sh

# Expose API Gateway port
EXPOSE 8000

# Start services
CMD ["./start.sh"]
