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

# Shell form so $PORT is expanded at runtime
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
