import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const navigate      = useNavigate();
  const { loginUser } = useAuth();
  const [form, setForm] = useState({
    lab_id: '', name: '', email: '', password: '', confirm_password: ''
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        lab_id  : form.lab_id,
        name    : form.name,
        email   : form.email,
        password: form.password,
      });
      loginUser(res.data.token, res.data.doctor);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="brand-icon">🦴</div>
          <h1>OsteoScan AI</h1>
          <p>Intelligent Knee X-Ray Analysis System</p>
        </div>
        <div className="auth-features">
          <div className="feature-item">
            <span className="feature-icon">🏥</span>
            <span>For Orthopedic Doctors & Labs</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎯</span>
            <span>90.78% Classification Accuracy</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <span>Complete Session History</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <span>Secure & Private</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Create Account</h2>
            <p>Register your lab / doctor account</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Lab ID</label>
              <input
                type="text"
                name="lab_id"
                placeholder="e.g. LAB-001"
                value={form.lab_id}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Doctor / Radiologist Name</label>
              <input
                type="text"
                name="name"
                placeholder="Dr. Ahmed Khan"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Lab Email</label>
              <input
                type="email"
                name="email"
                placeholder="doctor@lab.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirm_password"
                placeholder="Repeat your password"
                value={form.confirm_password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
