import os
from datetime import timedelta

class Config:
    # ── Database ──────────────────────────────────────────
    BASE_DIR              = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'database.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── JWT ───────────────────────────────────────────────
    JWT_SECRET_KEY           = os.environ.get('JWT_SECRET_KEY', 'fyp-osteoporosis-secret-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)

    # ── File Uploads ──────────────────────────────────────
    UPLOAD_FOLDER      = os.path.join(BASE_DIR, 'static', 'uploads')
    HEATMAP_FOLDER     = os.path.join(BASE_DIR, 'static', 'heatmaps')
    REPORT_FOLDER      = os.path.join(BASE_DIR, 'static', 'reports')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024   # 16MB max upload

    # ── Model ─────────────────────────────────────────────
    MODEL_PATH           = os.path.join(BASE_DIR, 'model', 'best_swin_model.pth')
    CONFIDENCE_THRESHOLD = 0.80
    CLASS_NAMES          = ['Normal', 'Osteopenia', 'Osteoporosis']

    # ── CORS ──────────────────────────────────────────────
    # Add your actual Vercel URL after deployment
    CORS_ORIGINS = [
        "http://localhost:3000",                          # local dev
        "https://osteoscan-ai-l5lk.vercel.app",           # ← replace with your Vercel URL
        os.environ.get('FRONTEND_URL', ''),              # set as env var on HuggingFace
    ]
