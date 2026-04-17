import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHistory } from '../services/api';
import Navbar from '../components/Navbar';
import './Dashboard.css';

export default function Dashboard() {
  const { doctor }      = useAuth();
  const navigate        = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getHistory()
      .then(res => setSessions(res.data.sessions))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Stats
  const total        = sessions.length;
  const confirmed    = sessions.filter(s => s.confirmed).length;
  const dexaReferred = sessions.filter(s => s.outcome === 'DEXA Recommended').length;
  const today        = sessions.filter(s =>
    new Date(s.created_at).toDateString() === new Date().toDateString()
  ).length;

  const classCount = (cls) => sessions.filter(s => s.xray_class === cls).length;

  const getOutcomeBadge = (session) => {
    if (session.outcome === 'Confirmed') {
      const cls = session.xray_class;
      if (cls === 'Normal')       return <span className="badge badge-normal">Normal</span>;
      if (cls === 'Osteopenia')   return <span className="badge badge-warning">Osteopenia</span>;
      if (cls === 'Osteoporosis') return <span className="badge badge-danger">Osteoporosis</span>;
    }
    return <span className="badge badge-gray">DEXA Referred</span>;
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="dashboard-container">

        {/* ── Welcome ── */}
        <div className="dashboard-header">
          <div>
            <h1>Welcome, {doctor?.name} 👋</h1>
            <p>Lab ID: {doctor?.lab_id} &nbsp;·&nbsp; {doctor?.email}</p>
          </div>
          <button
            className="new-scan-btn"
            onClick={() => navigate('/new-scan')}
          >
            + New Scan
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stat-blue">📊</div>
            <div className="stat-info">
              <span className="stat-value">{total}</span>
              <span className="stat-label">Total Scans</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-green">✅</div>
            <div className="stat-info">
              <span className="stat-value">{confirmed}</span>
              <span className="stat-label">Confirmed Cases</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-orange">🏥</div>
            <div className="stat-info">
              <span className="stat-value">{dexaReferred}</span>
              <span className="stat-label">DEXA Referred</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-purple">📅</div>
            <div className="stat-info">
              <span className="stat-value">{today}</span>
              <span className="stat-label">Today's Scans</span>
            </div>
          </div>
        </div>

        {/* ── Class Breakdown ── */}
        <div className="breakdown-row">
          <div className="breakdown-card">
            <h3>Classification Breakdown</h3>
            <div className="breakdown-bars">
              {['Normal', 'Osteopenia', 'Osteoporosis'].map(cls => {
                const count = classCount(cls);
                const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={cls} className="bar-row">
                    <span className="bar-label">{cls}</span>
                    <div className="bar-track">
                      <div
                        className={`bar-fill bar-${cls.toLowerCase()}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="bar-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Quick Action ── */}
          <div className="quick-action-card">
            <div className="quick-icon">🔬</div>
            <h3>Start New Analysis</h3>
            <p>Upload a knee X-ray to classify bone density and generate a patient report.</p>
            <button
              className="quick-btn"
              onClick={() => navigate('/new-scan')}
            >
              Upload X-Ray
            </button>
          </div>
        </div>

        {/* ── Recent Sessions ── */}
        <div className="recent-section">
          <div className="recent-header">
            <h3>Recent Sessions</h3>
            <button
              className="view-all-btn"
              onClick={() => navigate('/history')}
            >
              View All →
            </button>
          </div>

          {loading ? (
            <div className="loading-state">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="empty-state">
              <span>🩻</span>
              <p>No scans yet. Start by uploading a knee X-ray.</p>
              <button onClick={() => navigate('/new-scan')}>New Scan</button>
            </div>
          ) : (
            <div className="sessions-table">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Classification</th>
                    <th>Confidence</th>
                    <th>Outcome</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 8).map(s => (
                    <tr key={s.id}>
                      <td className="patient-name">{s.patient_name}</td>
                      <td>{s.patient_age}</td>
                      <td>{s.patient_gender}</td>
                      <td>{s.xray_class}</td>
                      <td>{s.confidence}%</td>
                      <td>{getOutcomeBadge(s)}</td>
                      <td className="date-cell">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className="view-btn"
                          onClick={() => navigate(`/history/${s.id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
