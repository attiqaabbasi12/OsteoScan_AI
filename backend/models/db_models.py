from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# ─────────────────────────────────────────────────────────────
# DOCTOR (Radiologist) Model
# ─────────────────────────────────────────────────────────────
class Doctor(db.Model):
    __tablename__ = 'doctors'

    id              = db.Column(db.Integer,  primary_key=True)
    lab_id          = db.Column(db.String(50),  unique=True, nullable=False)
    name            = db.Column(db.String(100), nullable=False)
    email           = db.Column(db.String(120), unique=True, nullable=False)
    password_hash   = db.Column(db.String(255), nullable=False)
    created_at      = db.Column(db.DateTime,    default=datetime.utcnow)

    # Relationship
    sessions        = db.relationship('Session', backref='doctor', lazy=True)

    def to_dict(self):
        return {
            'id'        : self.id,
            'lab_id'    : self.lab_id,
            'name'      : self.name,
            'email'     : self.email,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }


# ─────────────────────────────────────────────────────────────
# SESSION Model (each scan = one session)
# ─────────────────────────────────────────────────────────────
class Session(db.Model):
    __tablename__ = 'sessions'

    id                  = db.Column(db.Integer,     primary_key=True)
    doctor_id           = db.Column(db.Integer,     db.ForeignKey('doctors.id'), nullable=False)

    # Patient Info
    patient_name        = db.Column(db.String(100), nullable=False)
    patient_age         = db.Column(db.Integer,     nullable=False)
    patient_gender      = db.Column(db.String(10),  nullable=False)

    # X-Ray Classification
    xray_class          = db.Column(db.String(20),  nullable=False)   # Normal/Osteopenia/Osteoporosis
    confidence          = db.Column(db.Float,        nullable=False)   # e.g. 94.3

    # Image Paths
    xray_image_path     = db.Column(db.String(255), nullable=True)
    heatmap_image_path  = db.Column(db.String(255), nullable=True)

    # Question Engine
    symptom_score       = db.Column(db.Integer,     nullable=True)
    max_score           = db.Column(db.Integer,     nullable=True)
    confirmed           = db.Column(db.Boolean,     nullable=True)

    # Outcome
    outcome             = db.Column(db.String(20),  nullable=True)    # Confirmed / DEXA / Inconclusive
    first_aid           = db.Column(db.Text,        nullable=True)

    # Report
    report_path         = db.Column(db.String(255), nullable=True)

    created_at          = db.Column(db.DateTime,    default=datetime.utcnow)

    def to_dict(self):
        return {
            'id'                : self.id,
            'doctor_id'         : self.doctor_id,
            'patient_name'      : self.patient_name,
            'patient_age'       : self.patient_age,
            'patient_gender'    : self.patient_gender,
            'xray_class'        : self.xray_class,
            'confidence'        : self.confidence,
            'xray_image_path'   : self.xray_image_path,
            'heatmap_image_path': self.heatmap_image_path,
            'symptom_score'     : self.symptom_score,
            'max_score'         : self.max_score,
            'confirmed'         : self.confirmed,
            'outcome'           : self.outcome,
            'first_aid'         : self.first_aid,
            'report_path'       : self.report_path,
            'created_at'        : self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
