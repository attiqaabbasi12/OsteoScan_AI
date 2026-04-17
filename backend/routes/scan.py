from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import uuid

from models.db_models import db, Doctor, Session
from modules.classifier import classify_image, get_model
from modules.gradcam import generate_heatmap, get_original_base64
from modules.question_engine import get_questions, calculate_score
from modules.first_aid import get_first_aid, get_dexa_recommendation
from modules.report import generate_report

scan_bp = Blueprint('scan', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ─────────────────────────────────────────────────────────────
# CLASSIFY X-RAY
# POST /api/scan/classify
# ─────────────────────────────────────────────────────────────
@scan_bp.route('/classify', methods=['POST'])
@jwt_required()
def classify():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Use PNG, JPG or JPEG'}), 400

    # ── Save uploaded image ────────────────────────────────────
    ext          = file.filename.rsplit('.', 1)[1].lower()
    unique_name  = f"{uuid.uuid4().hex}.{ext}"
    upload_dir   = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)
    upload_path  = os.path.join(upload_dir, unique_name)
    file.save(upload_path)

    # ── Classify ───────────────────────────────────────────────
    result = classify_image(upload_path, current_app.config['MODEL_PATH'])

    if not result['success']:
        return jsonify({'error': result['message']}), 500

    # ── Low confidence → ask for clearer image ─────────────────
    if not result['above_threshold']:
        return jsonify({
            'above_threshold': False,
            'confidence'     : result['confidence'],
            'message'        : result['message'],
            'image_name'     : unique_name,
        }), 200

    # ── Generate GradCAM++ heatmap ─────────────────────────────
    # Reuse the model + pil_image + tensor already in memory
    model, device = get_model(current_app.config['MODEL_PATH'])

    heatmap_result = generate_heatmap(
        model         = model,
        image_tensor  = result['image_tensor'],
        pil_image     = result['pil_image'],
        predicted_idx = result['predicted_idx'],
        heatmap_dir   = current_app.config['HEATMAP_FOLDER'],
        device        = device,
    )

    heatmap_name   = None
    heatmap_base64 = None
    if heatmap_result['success']:
        heatmap_name   = heatmap_result['overlay_name']
        heatmap_base64 = heatmap_result['base64']

    # ── Original image as base64 for frontend ──────────────────
    original_base64 = get_original_base64(result['pil_image'])

    return jsonify({
        'above_threshold'  : True,
        'predicted_class'  : result['predicted_class'],
        'predicted_idx'    : result['predicted_idx'],
        'confidence'       : result['confidence'],
        'all_probabilities': result['all_probabilities'],
        'image_name'       : unique_name,
        'heatmap_name'     : heatmap_name,
        'original_base64'  : original_base64,    # ← base64 for direct display
        'heatmap_base64'   : heatmap_base64,     # ← base64 for direct display
        'message'          : 'Classification successful',
    }), 200


# ─────────────────────────────────────────────────────────────
# GET QUESTIONS FOR CLASS
# GET /api/scan/questions/<xray_class>
# ─────────────────────────────────────────────────────────────
@scan_bp.route('/questions/<xray_class>', methods=['GET'])
@jwt_required()
def questions(xray_class):
    valid = ['Normal', 'Osteopenia', 'Osteoporosis']
    if xray_class not in valid:
        return jsonify({'error': 'Invalid class'}), 400
    return jsonify({
        'xray_class': xray_class,
        'questions' : get_questions(xray_class)
    }), 200


# ─────────────────────────────────────────────────────────────
# SUBMIT SESSION
# POST /api/scan/submit
# ─────────────────────────────────────────────────────────────
@scan_bp.route('/submit', methods=['POST'])
@jwt_required()
def submit():
    doctor_id = int(get_jwt_identity())
    doctor    = Doctor.query.get(doctor_id)
    data      = request.get_json()

    required = ['patient_name', 'patient_age', 'patient_gender',
                'xray_class', 'confidence', 'image_name', 'answers']
    for field in required:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    xray_class   = data['xray_class']
    answers      = data['answers']
    score_result = calculate_score(xray_class, answers)

    # ── First Aid or DEXA recommendation ──────────────────────
    if score_result['confirmed']:
        first_aid_data = get_first_aid(xray_class)
        outcome        = 'Confirmed'
    else:
        first_aid_data = get_dexa_recommendation()
        outcome        = 'DEXA Recommended'

    # ── Paths ──────────────────────────────────────────────────
    report_folder = current_app.config['REPORT_FOLDER']
    upload_folder = current_app.config['UPLOAD_FOLDER']
    heatmap_folder= current_app.config['HEATMAP_FOLDER']
    os.makedirs(report_folder, exist_ok=True)

    report_name  = f"report_{uuid.uuid4().hex}.pdf"
    report_path  = os.path.join(report_folder, report_name)

    xray_path    = os.path.join(upload_folder, data['image_name'])
    heatmap_path = None
    if data.get('heatmap_name'):
        heatmap_path = os.path.join(heatmap_folder, data['heatmap_name'])

    # ── Save session to DB ─────────────────────────────────────
    session = Session(
        doctor_id          = doctor_id,
        patient_name       = data['patient_name'],
        patient_age        = int(data['patient_age']),
        patient_gender     = data['patient_gender'],
        xray_class         = xray_class,
        confidence         = float(data['confidence']),
        xray_image_path    = data['image_name'],
        heatmap_image_path = data.get('heatmap_name'),
        symptom_score      = score_result['score'],
        max_score          = score_result['max_score'],
        confirmed          = score_result['confirmed'],
        outcome            = outcome,
        first_aid          = str(first_aid_data),
        report_path        = report_name,
    )
    db.session.add(session)
    db.session.commit()

    # ── Generate PDF ───────────────────────────────────────────
    generate_report(
        session_data       = session.to_dict(),
        doctor_data        = doctor.to_dict(),
        first_aid_data     = first_aid_data,
        report_path        = report_path,
        xray_image_path    = xray_path,
        heatmap_image_path = heatmap_path,
    )

    return jsonify({
        'session'     : session.to_dict(),
        'score_result': score_result,
        'first_aid'   : first_aid_data,
        'report_name' : report_name,
        'outcome'     : outcome,
        'message'     : 'Session saved successfully',
    }), 201


# ─────────────────────────────────────────────────────────────
# SERVE STATIC FILES
# ─────────────────────────────────────────────────────────────
@scan_bp.route('/image/<filename>', methods=['GET'])
@jwt_required()
def serve_image(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@scan_bp.route('/heatmap/<filename>', methods=['GET'])
@jwt_required()
def serve_heatmap(filename):
    return send_from_directory(current_app.config['HEATMAP_FOLDER'], filename)
