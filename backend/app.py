from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models.db_models import db
import os

# ── Import Blueprints ──────────────────────────────────────────
from routes.auth    import auth_bp
from routes.scan    import scan_bp
from routes.history import history_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ── Extensions ────────────────────────────────────────────
    db.init_app(app)
    JWTManager(app)
    CORS(app,
         origins=app.config['CORS_ORIGINS'],
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # ── Register Blueprints ───────────────────────────────────
    app.register_blueprint(auth_bp,    url_prefix='/api/auth')
    app.register_blueprint(scan_bp,    url_prefix='/api/scan')
    app.register_blueprint(history_bp, url_prefix='/api/history')

    # ── Health Check (Docker HEALTHCHECK + frontend ping) ─────
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({
            'status' : 'ok',
            'app'    : 'OsteoScan AI',
            'version': '1.0.0'
        }), 200

    # ── Create DB Tables ──────────────────────────────────────
    with app.app_context():
        db.create_all()
        print("✅ Database tables created")

    return app


if __name__ == '__main__':
    app = create_app()

    # Port 7860 for HuggingFace Spaces, 5000 for local dev
    port  = int(os.environ.get('PORT', 7860))
    debug = os.environ.get('FLASK_ENV', 'production') == 'development'

    print(f"🚀 OsteoScan AI Backend running on port {port}")
    app.run(debug=debug, host='0.0.0.0', port=port)
