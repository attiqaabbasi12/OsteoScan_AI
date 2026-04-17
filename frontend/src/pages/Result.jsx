import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { downloadReport } from '../services/api';
import Navbar from '../components/Navbar';
import './Result.css';

export default function Result() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const sessionData = location.state?.sessionData;

  if (!sessionData) {
    navigate('/new-scan');
    return null;
  }

  const { session, score_result, first_aid, outcome } = sessionData;
  const confirmed = score_result?.confirmed;
  const cls       = session?.xray_class;

  const statusConfig = {
    Normal       : { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', icon: '✅', label: 'Normal' },
    Osteopenia   : { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', icon: '⚠️', label: 'Osteopenia' },
    Osteoporosis : { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', icon: '🔴', label: 'Osteoporosis' },
  };

  const config = statusConfig[cls] || statusConfig['Normal'];

  const handleDownload = async () => {
    try {
      const res  = await downloadReport(session.id);
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download',
        `OsteoScan_Report_${session.patient_name}_${session.created_at?.split(' ')[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="result-container">

        {/* ── Page Header ── */}
        <div className="result-page-header">
          <h1>Scan Result</h1>
          <p>Complete assessment for {session.patient_name}</p>
        </div>

        {/* ── Outcome Banner ── */}
        <div
          className="outcome-banner"
          style={{ background: config.bg, borderColor: config.border }}
        >
          <div className="outcome-icon" style={{ color: config.color }}>
            {confirmed ? config.icon : '📋'}
          </div>
          <div className="outcome-content">
            <h2 style={{ color: config.color }}>
              {confirmed
                ? (cls === 'Normal'
                    ? 'Bone Density is Normal'
                    : `${cls} Detected & Confirmed`)
                : 'DEXA Scan Recommended'
              }
            </h2>
            <p>
              {confirmed
                ? first_aid?.summary
                : "Patient's symptoms do not strongly correlate with the X-ray finding. Please refer for DEXA scan."
              }
            </p>
          </div>
          {session.outcome === 'DEXA Recommended' && (
            <div className="dexa-badge">DEXA Required</div>
          )}
        </div>

        {/* ── Score + Session Info ── */}
        <div className="info-grid">
          <div className="info-card">
            <h4>Session Summary</h4>
            <div className="info-rows">
              <div className="info-row">
                <span>Patient</span>
                <strong>{session.patient_name}</strong>
              </div>
              <div className="info-row">
                <span>Age / Gender</span>
                <strong>{session.patient_age} / {session.patient_gender}</strong>
              </div>
              <div className="info-row">
                <span>X-Ray Class</span>
                <strong style={{ color: config.color }}>{cls}</strong>
              </div>
              <div className="info-row">
                <span>Model Confidence</span>
                <strong>{session.confidence}%</strong>
              </div>
              <div className="info-row">
                <span>Symptom Score</span>
                <strong>{session.symptom_score} / {session.max_score}</strong>
              </div>
              <div className="info-row">
                <span>Outcome</span>
                <strong>{outcome}</strong>
              </div>
              <div className="info-row">
                <span>Date</span>
                <strong>{session.created_at}</strong>
              </div>
            </div>
          </div>

          {/* ── Score Gauge ── */}
          <div className="score-card">
            <h4>Clinical Score</h4>
            <div className="score-gauge">
              <div className="gauge-circle">
                <svg viewBox="0 0 120 120" className="gauge-svg">
                  <circle cx="60" cy="60" r="50"
                    fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <circle cx="60" cy="60" r="50"
                    fill="none"
                    stroke={confirmed ? config.color : '#94a3b8'}
                    strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - (session.symptom_score / session.max_score))}`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="gauge-text">
                  <span className="gauge-value"
                    style={{ color: confirmed ? config.color : '#94a3b8' }}>
                    {session.symptom_score}
                  </span>
                  <span className="gauge-max">/ {session.max_score}</span>
                </div>
              </div>
              <div className="gauge-meta">
                <div className="meta-item">
                  <span>Your Score</span>
                  <strong>{session.symptom_score}</strong>
                </div>
                <div className="meta-item">
                  <span>Threshold</span>
                  <strong>{score_result?.threshold}</strong>
                </div>
                <div className="meta-item">
                  <span>Status</span>
                  <strong style={{ color: confirmed ? '#16a34a' : '#dc2626' }}>
                    {confirmed ? 'Confirmed' : 'Not Confirmed'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── First Aid ── */}
        {confirmed && first_aid?.steps && (
          <div className="first-aid-section">
            <h3>First Aid & Recommendations</h3>
            <div className="steps-grid">
              {first_aid.steps.map((step, idx) => (
                <div key={idx} className="step-card">
                  <div className="step-header">
                    <span className="step-emoji">{step.icon}</span>
                    <h4>{step.category}</h4>
                  </div>
                  <ul className="step-list">
                    {step.advice.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DEXA Recommendation ── */}
        {!confirmed && (
          <div className="dexa-section">
            <div className="dexa-header">
              <span>🏥</span>
              <h3>DEXA Scan Recommended</h3>
            </div>
            <p>
              The patient's reported symptoms do not strongly match the X-ray
              classification. A DEXA scan will provide a definitive T-score
              for accurate diagnosis.
            </p>
            <ul className="dexa-steps">
              {first_aid?.steps?.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        {/* ── Disclaimer ── */}
        <div className="disclaimer">
          <span>⚠️</span>
          <p>
            <strong>Disclaimer:</strong> This report is generated by an
            AI-assisted screening tool and is intended for clinical decision
            support only. It does not constitute a formal medical diagnosis.
            Always consult a qualified physician.
          </p>
        </div>

        {/* ── Actions ── */}
        <div className="result-final-actions">
          <button className="secondary-btn" onClick={() => navigate('/history')}>
            View History
          </button>
          <button className="download-btn" onClick={handleDownload}>
            ⬇ Download PDF Report
          </button>
          <button className="new-btn" onClick={() => navigate('/new-scan')}>
            + New Scan
          </button>
        </div>

      </div>
    </div>
  );
}
