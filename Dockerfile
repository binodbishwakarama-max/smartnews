# Production Dockerfile for Smart News Aggregator
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libxml2-dev \
    libxslt-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download nltk data required by newspaper3k
RUN python -c "import nltk; nltk.download('punkt_tab', quiet=True); nltk.download('punkt', quiet=True)" 2>/dev/null || true

# Copy application code
COPY backend/ .

# Create necessary directories
RUN mkdir -p logs ml/models

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV LOG_LEVEL=INFO

# Expose port
EXPOSE 8000

# Health check (increase start-period for cold starts with DB migrations)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/')"

# Run with gunicorn — 1 worker for free tier, 300s timeout for cold starts
CMD ["gunicorn", "app.main:app", "-w", "1", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--timeout", "300", "--access-logfile", "-", "--error-logfile", "-"]
