import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { doctor, logoutUser } = useAuth();
  const navigate               = useNavigate();
  const location               = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* ── Brand ── */}
        <Link to="/dashboard" className="navbar-brand">
          <span className="navbar-icon">🦴</span>
          <span className="navbar-title">OsteoScan AI</span>
        </Link>

        {/* ── Desktop Links ── */}
        <div className="navbar-links">
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
            Dashboard
          </Link>
          <Link to="/new-scan" className={`nav-link ${isActive('/new-scan') ? 'active' : ''}`}>
            New Scan
          </Link>
          <Link to="/history" className={`nav-link ${isActive('/history') ? 'active' : ''}`}>
            History
          </Link>
        </div>

        {/* ── Doctor Info + Logout ── */}
        <div className="navbar-right">
          <div
            className="navbar-doctor"
            onClick={() => navigate('/profile')}
            style={{ cursor: 'pointer' }}
            title="View Profile"
          >
            <div className="doctor-avatar">
              {doctor?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="doctor-info">
              <span className="doctor-name">{doctor?.name}</span>
              <span className="doctor-lab">{doctor?.lab_id}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link to="/new-scan"  onClick={() => setMenuOpen(false)}>New Scan</Link>
          <Link to="/history"   onClick={() => setMenuOpen(false)}>History</Link>
          <button onClick={handleLogout}>Sign Out</button>
        </div>
      )}
    </nav>
  );
}
