from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from models.db_models import db, Doctor

auth_bp = Blueprint('auth', __name__)


# ─────────────────────────────────────────────────────────────
# REGISTER
# POST /api/auth/register
# ─────────────────────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # Validate required fields
    required = ['lab_id', 'name', 'email', 'password']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    # Check if lab_id already exists
    if Doctor.query.filter_by(lab_id=data['lab_id']).first():
        return jsonify({'error': 'Lab ID already registered'}), 409

    # Check if email already exists
    if Doctor.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409

    # Hash password
    password_hash = bcrypt.hashpw(
        data['password'].encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    # Create new doctor
    doctor = Doctor(
        lab_id        = data['lab_id'],
        name          = data['name'],
        email         = data['email'],
        password_hash = password_hash
    )

    db.session.add(doctor)
    db.session.commit()

    # Generate token
    token = create_access_token(identity=str(doctor.id))

    return jsonify({
        'message': 'Registration successful',
        'token'  : token,
        'doctor' : doctor.to_dict()
    }), 201


# ─────────────────────────────────────────────────────────────
# LOGIN
# POST /api/auth/login
# ─────────────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    # Find doctor by email
    doctor = Doctor.query.filter_by(email=data['email']).first()

    if not doctor:
        return jsonify({'error': 'Invalid email or password'}), 401

    # Verify password
    if not bcrypt.checkpw(
        data['password'].encode('utf-8'),
        doctor.password_hash.encode('utf-8')
    ):
        return jsonify({'error': 'Invalid email or password'}), 401

    # Generate token
    token = create_access_token(identity=str(doctor.id))

    return jsonify({
        'message': 'Login successful',
        'token'  : token,
        'doctor' : doctor.to_dict()
    }), 200


# ─────────────────────────────────────────────────────────────
# GET PROFILE
# GET /api/auth/profile
# ─────────────────────────────────────────────────────────────
@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    doctor_id = get_jwt_identity()
    doctor    = Doctor.query.get(doctor_id)

    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404

    return jsonify({'doctor': doctor.to_dict()}), 200


# ─────────────────────────────────────────────────────────────
# CHANGE PASSWORD
# PUT /api/auth/password
# ─────────────────────────────────────────────────────────────
@auth_bp.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    doctor_id = get_jwt_identity()
    doctor    = Doctor.query.get(doctor_id)
    data      = request.get_json()

    if not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Both current and new password are required'}), 400

    # Verify current password
    if not bcrypt.checkpw(
        data['current_password'].encode('utf-8'),
        doctor.password_hash.encode('utf-8')
    ):
        return jsonify({'error': 'Current password is incorrect'}), 401

    # Update password
    doctor.password_hash = bcrypt.hashpw(
        data['new_password'].encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    db.session.commit()

    return jsonify({'message': 'Password updated successfully'}), 200
