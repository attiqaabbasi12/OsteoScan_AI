import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const navigate        = useNavigate();
  const { loginUser }   = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.token, res.data.doctor);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
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
            <span className="feature-icon">🔬</span>
            <span>Swin Transformer Classification</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔥</span>
            <span>GradCAM++ Heatmap Visualization</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📋</span>
            <span>Clinical Question Engine</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📄</span>
            <span>Automated PDF Reports</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your doctor account</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
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
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
