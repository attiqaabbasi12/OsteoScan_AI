from flask import Blueprint, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db_models import db, Session
import os

history_bp = Blueprint('history', __name__)


# ─────────────────────────────────────────────────────────────
# GET ALL SESSIONS FOR LOGGED IN DOCTOR
# GET /api/history
# ─────────────────────────────────────────────────────────────
@history_bp.route('/', methods=['GET'])
@jwt_required()
def get_history():
    doctor_id = int(get_jwt_identity())

    sessions = Session.query\
        .filter_by(doctor_id=doctor_id)\
        .order_by(Session.created_at.desc())\
        .all()

    return jsonify({
        'sessions': [s.to_dict() for s in sessions],
        'total'   : len(sessions)
    }), 200


# ─────────────────────────────────────────────────────────────
# GET SINGLE SESSION
# GET /api/history/<session_id>
# ─────────────────────────────────────────────────────────────
@history_bp.route('/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    doctor_id = int(get_jwt_identity())

    session = Session.query.filter_by(
        id=session_id, doctor_id=doctor_id
    ).first()

    if not session:
        return jsonify({'error': 'Session not found'}), 404

    return jsonify({'session': session.to_dict()}), 200


# ─────────────────────────────────────────────────────────────
# DOWNLOAD PDF REPORT
# GET /api/history/<session_id>/pdf
# ─────────────────────────────────────────────────────────────
@history_bp.route('/<int:session_id>/pdf', methods=['GET'])
@jwt_required()
def download_report(session_id):
    doctor_id = int(get_jwt_identity())

    session = Session.query.filter_by(
        id=session_id, doctor_id=doctor_id
    ).first()

    if not session:
        return jsonify({'error': 'Session not found'}), 404

    if not session.report_path:
        return jsonify({'error': 'Report not found'}), 404

    report_folder = current_app.config['REPORT_FOLDER']

    return send_from_directory(
        report_folder,
        session.report_path,
        as_attachment=True,
        download_name=f"report_{session.patient_name}_{session.created_at.strftime('%Y%m%d')}.pdf"
    )


# ─────────────────────────────────────────────────────────────
# DELETE SESSION
# DELETE /api/history/<session_id>
# ─────────────────────────────────────────────────────────────
@history_bp.route('/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    doctor_id = int(get_jwt_identity())

    session = Session.query.filter_by(
        id=session_id, doctor_id=doctor_id
    ).first()

    if not session:
        return jsonify({'error': 'Session not found'}), 404

    db.session.delete(session)
    db.session.commit()

    return jsonify({'message': 'Session deleted successfully'}), 200
