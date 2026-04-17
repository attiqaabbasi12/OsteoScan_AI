# ╔══════════════════════════════════════════════════════╗
# ║   OsteoScan AI — Hugging Face Spaces Dockerfile     ║
# ║   SDK: Docker  |  Port: 7860                        ║
# ╚══════════════════════════════════════════════════════╝

# ── Base image: Python 3.10 slim ──────────────────────────────
FROM python:3.10-slim

# ── Set working directory ─────────────────────────────────────
WORKDIR /app

# ── System dependencies ───────────────────────────────────────
# opencv, reportlab and torch need these system libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── Install Python dependencies ───────────────────────────────
# Copy requirements first so Docker caches this layer
COPY requirements.txt .

# Install PyTorch CPU-only (smaller, no GPU on free HF spaces)
RUN pip install --no-cache-dir \
    torch==2.1.0+cpu \
    torchvision==0.16.0+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Install remaining packages
RUN pip install --no-cache-dir -r requirements.txt

# ── Copy all backend source files ────────────────────────────
COPY . .

# ── Create required directories ──────────────────────────────
RUN mkdir -p \
    static/uploads \
    static/heatmaps \
    static/reports \
    model

# ── Set permissions (HuggingFace runs as non-root user 1000) ─
RUN chmod -R 777 static/ && \
    chmod -R 777 model/

# ── Environment variables ─────────────────────────────────────
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV FLASK_ENV=production

# ── Expose port 7860 (required by HuggingFace Spaces) ────────
EXPOSE 7860

# ── Health check ─────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:7860/api/health || exit 1

# ── Start Flask ───────────────────────────────────────────────
CMD ["python", "app.py"]
