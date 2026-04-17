import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, downloadReport, getImageUrl, getHeatmapUrl } from '../services/api';
import Navbar from '../components/Navbar';
import './ReportDetail.css';

export default function ReportDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [session,  setSession]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    getSession(id)
      .then(res => setSession(res.data.session))
      .catch(() => setError('Session not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    try {
      const res  = await downloadReport(id);
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download',
        `OsteoScan_${session.patient_name}_${session.created_at?.split(' ')[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const statusConfig = {
    Normal       : { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', icon: '✅' },
    Osteopenia   : { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', icon: '⚠️' },
    Osteoporosis : { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', icon: '🔴' },
  };

  if (loading) return (
    <div className="page-wrapper">
      <Navbar />
      <div className="detail-container">
        <div className="loading-state">Loading session...</div>
      </div>
    </div>
  );

  if (error || !session) return (
    <div className="page-wrapper">
      <Navbar />
      <div className="detail-container">
        <div className="error-state">
          <span>❌</span>
          <p>{error || 'Session not found.'}</p>
          <button onClick={() => navigate('/history')}>Back to History</button>
        </div>
      </div>
    </div>
  );

  const config = statusConfig[session.xray_class] || statusConfig['Normal'];

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="detail-container">

        {/* ── Header ── */}
        <div className="detail-header">
          <div>
            <button className="back-link" onClick={() => navigate('/history')}>
              ← Back to History
            </button>
            <h1>Session Report</h1>
            <p>
              {session.patient_name} &nbsp;·&nbsp;
              {new Date(session.created_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
          <button className="dl-btn" onClick={handleDownload}>
            ⬇ Download PDF
          </button>
        </div>

        {/* ── Outcome Banner ── */}
        <div
          className="detail-banner"
          style={{ background: config.bg, borderColor: config.border }}
        >
          <span style={{ fontSize: 32 }}>{config.icon}</span>
          <div>
            <h2 style={{ color: config.color }}>
              {session.confirmed
                ? (session.xray_class === 'Normal'
                    ? 'Bone Density Normal'
                    : `${session.xray_class} — Confirmed`)
                : 'DEXA Scan Recommended'
              }
            </h2>
            <p>
              Confidence: <strong>{session.confidence}%</strong>
              &nbsp;·&nbsp;
              Score: <strong>{session.symptom_score}/{session.max_score}</strong>
            </p>
          </div>
        </div>

        {/* ── Patient + Session Info ── */}
        <div className="detail-grid-2">
          <div className="detail-card">
            <h4>Patient Information</h4>
            <div className="detail-rows">
              {[
                ['Full Name',    session.patient_name],
                ['Age',          session.patient_age],
                ['Gender',       session.patient_gender],
              ].map(([label, val]) => (
                <div key={label} className="detail-row">
                  <span>{label}</span><strong>{val}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="detail-card">
            <h4>Scan Information</h4>
            <div className="detail-rows">
              {[
                ['Classification', session.xray_class],
                ['Confidence',     `${session.confidence}%`],
                ['Symptom Score',  `${session.symptom_score} / ${session.max_score}`],
                ['Outcome',        session.outcome],
                ['Date & Time',    session.created_at],
              ].map(([label, val]) => (
                <div key={label} className="detail-row">
                  <span>{label}</span>
                  <strong style={label === 'Classification'
                    ? { color: config.color } : {}}>
                    {val}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Images ── */}
        {(session.xray_image_path || session.heatmap_image_path) && (
          <div className="detail-card">
            <h4>X-Ray Analysis</h4>
            <div className="detail-images">
              {session.xray_image_path && (
                <div className="detail-img-panel">
                  <p>🩻 Original X-Ray</p>
                  <img
                    src={getImageUrl(session.xray_image_path)}
                    alt="X-Ray"
                    className="detail-scan-img"
                  />
                </div>
              )}
              {session.heatmap_image_path && (
                <div className="detail-img-panel">
                  <p>🔥 GradCAM++ Heatmap</p>
                  <img
                    src={getHeatmapUrl(session.heatmap_image_path)}
                    alt="Heatmap"
                    className="detail-scan-img"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Disclaimer ── */}
        <div className="detail-disclaimer">
          <span>⚠️</span>
          <p>
            This report is generated by an AI-assisted screening tool for
            clinical decision support only. It does not constitute a formal
            medical diagnosis. Always consult a qualified physician.
          </p>
        </div>

      </div>
    </div>
  );
}
