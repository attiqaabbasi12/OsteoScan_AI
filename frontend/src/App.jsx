import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login          from './pages/Login';
import Register       from './pages/Register';
import Dashboard      from './pages/Dashboard';
import NewScan        from './pages/NewScan';
import QuestionEngine from './pages/QuestionEngine';
import Result         from './pages/Result';
import History        from './pages/History';
import ReportDetail   from './pages/ReportDetail';
import Profile        from './pages/Profile';

// ── Protected Route ────────────────────────────────────────────
function Protected({ children }) {
  const { doctor, loading } = useAuth();
  if (loading) return <div className="global-loading">Loading...</div>;
  return doctor ? children : <Navigate to="/login" replace />;
}

// ── Public Route (redirect if logged in) ──────────────────────
function Public({ children }) {
  const { doctor, loading } = useAuth();
  if (loading) return <div className="global-loading">Loading...</div>;
  return doctor ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"        element={<Navigate to="/login" replace />} />
          <Route path="/login"   element={<Public><Login /></Public>} />
          <Route path="/register" element={<Public><Register /></Public>} />

          {/* Protected */}
          <Route path="/dashboard"      element={<Protected><Dashboard /></Protected>} />
          <Route path="/new-scan"       element={<Protected><NewScan /></Protected>} />
          <Route path="/question-engine" element={<Protected><QuestionEngine /></Protected>} />
          <Route path="/result"         element={<Protected><Result /></Protected>} />
          <Route path="/history"        element={<Protected><History /></Protected>} />
          <Route path="/history/:id"    element={<Protected><ReportDetail /></Protected>} />
          <Route path="/profile"        element={<Protected><Profile /></Protected>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
