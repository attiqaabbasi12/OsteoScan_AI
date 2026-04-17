import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, downloadReport, deleteSession } from '../services/api';
import Navbar from '../components/Navbar';
import './History.css';

export default function History() {
  const navigate         = useNavigate();
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('All');
  const [search,    setSearch]    = useState('');
  const [deleting,  setDeleting]  = useState(null);

  useEffect(() => {
    getHistory()
      .then(res => setSessions(res.data.sessions))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (session) => {
    try {
      const res  = await downloadReport(session.id);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteSession(id);
      setSessions(sessions.filter(s => s.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = sessions.filter(s => {
    const matchFilter = filter === 'All' || s.xray_class === filter ||
      (filter === 'Confirmed' && s.confirmed) ||
      (filter === 'DEXA'      && !s.confirmed);
    const matchSearch = s.patient_name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const getBadge = (s) => {
    const map = {
      Normal       : 'badge-normal',
      Osteopenia   : 'badge-warning',
      Osteoporosis : 'badge-danger',
    };
    return <span className={`badge ${map[s.xray_class] || 'badge-gray'}`}>{s.xray_class}</span>;
  };

  const getOutcome = (s) => (
    <span className={`badge ${s.confirmed ? 'badge-blue' : 'badge-gray'}`}>
      {s.confirmed ? 'Confirmed' : 'DEXA Referred'}
    </span>
  );

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="history-container">

        {/* ── Header ── */}
        <div className="history-header">
          <div>
            <h1>Session History</h1>
            <p>{sessions.length} total sessions</p>
          </div>
          <button className="new-scan-btn" onClick={() => navigate('/new-scan')}>
            + New Scan
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="history-controls">
          <div className="filter-tabs">
            {['All', 'Normal', 'Osteopenia', 'Osteoporosis', 'Confirmed', 'DEXA'].map(f => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            className="search-input"
            type="text"
            placeholder="Search by patient name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* ── Table ── */}
        <div className="history-card">
          {loading ? (
            <div className="loading-state">Loading history...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span>📋</span>
              <p>{sessions.length === 0 ? 'No sessions yet.' : 'No sessions match your filter.'}</p>
              {sessions.length === 0 && (
                <button onClick={() => navigate('/new-scan')}>Start New Scan</button>
              )}
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Patient</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Classification</th>
                    <th>Confidence</th>
                    <th>Score</th>
                    <th>Outcome</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, idx) => (
                    <tr key={s.id}>
                      <td className="row-num">{idx + 1}</td>
                      <td className="patient-name">{s.patient_name}</td>
                      <td>{s.patient_age}</td>
                      <td>{s.patient_gender}</td>
                      <td>{getBadge(s)}</td>
                      <td>{s.confidence}%</td>
                      <td>{s.symptom_score}/{s.max_score}</td>
                      <td>{getOutcome(s)}</td>
                      <td className="date-cell">
                        {new Date(s.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="action-view"
                            onClick={() => navigate(`/history/${s.id}`)}
                          >View</button>
                          <button
                            className="action-pdf"
                            onClick={() => handleDownload(s)}
                          >PDF</button>
                          <button
                            className="action-del"
                            onClick={() => handleDelete(s.id)}
                            disabled={deleting === s.id}
                          >
                            {deleting === s.id ? '...' : '✕'}
                          </button>
                        </div>
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
