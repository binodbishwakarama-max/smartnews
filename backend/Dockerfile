FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies first (Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download nltk data required by newspaper3k to avoid runtime failures
RUN python -c "import nltk; nltk.download('punkt_tab', quiet=True); nltk.download('punkt', quiet=True)" 2>/dev/null || true

COPY . .

# Render injects PORT at runtime (usually 10000, not 8000)
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Shell form so $PORT is expanded at runtime
# Use 1 worker for Render free tier (512MB RAM) with 300s timeout for cold starts
CMD gunicorn app.main:app -w 1 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 300 --access-logfile - --error-logfile -
