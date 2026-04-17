import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../services/api';
import Navbar from '../components/Navbar';
import './Profile.css';

export default function Profile() {
  const { doctor } = useAuth();

  const [form, setForm] = useState({
    current_password: '',
    new_password    : '',
    confirm_password: '',
  });
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.new_password !== form.confirm_password) {
      setError('New passwords do not match.');
      return;
    }
    if (form.new_password.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        current_password: form.current_password,
        new_password    : form.new_password,
      });
      setSuccess('Password changed successfully.');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="profile-container">

        <div className="profile-header">
          <h1>Profile</h1>
          <p>Manage your account information</p>
        </div>

        <div className="profile-grid">

          {/* ── Doctor Info Card ── */}
          <div className="profile-card">
            <div className="profile-avatar">
              {doctor?.name?.charAt(0).toUpperCase()}
            </div>
            <h2>{doctor?.name}</h2>
            <p className="profile-role">Orthopedic Doctor / Radiologist</p>

            <div className="profile-info-rows">
              <div className="profile-info-row">
                <span className="info-icon">🏥</span>
                <div>
                  <span className="info-label">Lab ID</span>
                  <span className="info-value">{doctor?.lab_id}</span>
                </div>
              </div>
              <div className="profile-info-row">
                <span className="info-icon">📧</span>
                <div>
                  <span className="info-label">Lab Email</span>
                  <span className="info-value">{doctor?.email}</span>
                </div>
              </div>
              <div className="profile-info-row">
                <span className="info-icon">📅</span>
                <div>
                  <span className="info-label">Member Since</span>
                  <span className="info-value">
                    {doctor?.created_at
                      ? new Date(doctor.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Change Password Card ── */}
          <div className="password-card">
            <h3>Change Password</h3>
            <p>Keep your account secure by using a strong password.</p>

            {success && <div className="profile-success">{success}</div>}
            {error   && <div className="profile-error">{error}</div>}

            <form onSubmit={handleSubmit} className="password-form">
              <div className="field-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="current_password"
                  placeholder="Enter current password"
                  value={form.current_password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="field-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="new_password"
                  placeholder="Minimum 6 characters"
                  value={form.new_password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="field-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirm_password"
                  placeholder="Repeat new password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>

        {/* ── System Info ── */}
        <div className="system-card">
          <h3>System Information</h3>
          <div className="system-grid">
            {[
              { label: 'AI Model',        value: 'Swin Transformer (swin_base_patch4_window7_224)' },
              { label: 'Model Accuracy',  value: '90.78%' },
              { label: 'Classes',         value: 'Normal / Osteopenia / Osteoporosis' },
              { label: 'Explainability',  value: 'GradCAM++ Heatmap Visualization' },
              { label: 'Question Engine', value: 'Clinical Rule-Based Scoring (FRAX-aligned)' },
              { label: 'Report Format',   value: 'PDF (ReportLab)' },
            ].map((item, i) => (
              <div key={i} className="system-item">
                <span className="system-label">{item.label}</span>
                <span className="system-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <div className="profile-disclaimer">
          <span>⚠️</span>
          <p>
            OsteoScan AI is a clinical decision support tool only. It does not
            constitute a formal medical diagnosis. All findings must be reviewed
            and confirmed by a qualified physician before any clinical action is taken.
          </p>
        </div>

      </div>
    </div>
  );
}
