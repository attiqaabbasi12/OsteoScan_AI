import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getQuestions, submitSession } from '../services/api';
import Navbar from '../components/Navbar';
import './QuestionEngine.css';

export default function QuestionEngine() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const result    = location.state?.result;

  const [step,      setStep]      = useState('patient');  // patient | questions | submitting
  const [questions, setQuestions] = useState([]);
  const [patient,   setPatient]   = useState({ name: '', age: '', gender: '' });
  const [answers,   setAnswers]   = useState({});
  const [current,   setCurrent]   = useState(0);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  // Redirect if no result
  useEffect(() => {
    if (!result) navigate('/new-scan');
  }, [result, navigate]);

  // Load questions for class
  useEffect(() => {
    if (result?.predicted_class) {
      getQuestions(result.predicted_class)
        .then(res => setQuestions(res.data.questions))
        .catch(() => setError('Failed to load questions.'));
    }
  }, [result]);

  // ── Patient Info Submit ────────────────────────────────────
  const handlePatientSubmit = (e) => {
    e.preventDefault();
    if (!patient.name.trim()) { setError('Patient name is required.'); return; }
    if (!patient.age || patient.age < 1 || patient.age > 120) {
      setError('Please enter a valid age.'); return;
    }
    if (!patient.gender) { setError('Please select gender.'); return; }
    setError('');
    setStep('questions');
  };

  // ── Answer Question ────────────────────────────────────────
  const handleAnswer = (questionId, answer) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // Auto-advance to next question
    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent(current + 1);
      }
    }, 300);
  };

  // ── Submit all answers ─────────────────────────────────────
  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setLoading(true);
    setError('');
    setStep('submitting');

    try {
      const res = await submitSession({
        patient_name  : patient.name,
        patient_age   : parseInt(patient.age),
        patient_gender: patient.gender,
        xray_class    : result.predicted_class,
        confidence    : result.confidence,
        image_name    : result.image_name,
        heatmap_name  : result.heatmap_name,
        answers,
      });
      navigate('/result', { state: { sessionData: res.data } });
    } catch (err) {
      setError('Submission failed. Please try again.');
      setStep('questions');
    } finally {
      setLoading(false);
    }
  };

  const progress = questions.length > 0
    ? Math.round((Object.keys(answers).length / questions.length) * 100)
    : 0;

  const getClassColor = (cls) => ({
    Normal       : '#16a34a',
    Osteopenia   : '#d97706',
    Osteoporosis : '#dc2626',
  }[cls] || '#2563eb');

  if (!result) return null;

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="qe-container">

        {/* ── Header ── */}
        <div className="qe-header">
          <h1>Patient Assessment</h1>
          <p>Complete the patient information and clinical questionnaire</p>
        </div>

        {/* ── Classification Pill ── */}
        <div
          className="class-pill"
          style={{ borderColor: getClassColor(result.predicted_class) }}
        >
          <span>X-Ray Result:</span>
          <strong style={{ color: getClassColor(result.predicted_class) }}>
            {result.predicted_class}
          </strong>
          <span className="pill-conf">({result.confidence}% confidence)</span>
        </div>

        {/* ── Step: Patient Info ── */}
        {step === 'patient' && (
          <div className="qe-card">
            <div className="qe-card-header">
              <div className="step-badge">Step 1 of 2</div>
              <h2>Patient Information</h2>
              <p>Enter the patient details before proceeding to clinical questions</p>
            </div>

            {error && <div className="qe-error">{error}</div>}

            <form onSubmit={handlePatientSubmit} className="patient-form">
              <div className="patient-fields">
                <div className="field-group">
                  <label>Patient Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Muhammad Ali Khan"
                    value={patient.name}
                    onChange={e => setPatient({ ...patient, name: e.target.value })}
                    required
                  />
                </div>

                <div className="patient-row">
                  <div className="field-group">
                    <label>Age *</label>
                    <input
                      type="number"
                      placeholder="e.g. 58"
                      min="1" max="120"
                      value={patient.age}
                      onChange={e => setPatient({ ...patient, age: e.target.value })}
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label>Gender *</label>
                    <div className="gender-options">
                      {['Male', 'Female'].map(g => (
                        <button
                          key={g}
                          type="button"
                          className={`gender-btn ${patient.gender === g ? 'selected' : ''}`}
                          onClick={() => setPatient({ ...patient, gender: g })}
                        >
                          {g === 'Male' ? '👨' : '👩'} {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="next-btn">
                Continue to Questions →
              </button>
            </form>
          </div>
        )}

        {/* ── Step: Questions ── */}
        {step === 'questions' && (
          <div className="qe-card">
            <div className="qe-card-header">
              <div className="step-badge">Step 2 of 2</div>
              <h2>Clinical Questions</h2>
              <p>
                Questions are tailored for <strong>{result.predicted_class}</strong> classification.
                Answer all {questions.length} questions.
              </p>
            </div>

            {/* ── Progress Bar ── */}
            <div className="progress-section">
              <div className="progress-meta">
                <span>{Object.keys(answers).length} of {questions.length} answered</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* ── Questions List ── */}
            <div className="questions-list">
              {questions.map((q, idx) => {
                const answered = answers[q.id];
                const isCurrent = idx === current;

                return (
                  <div
                    key={q.id}
                    className={`question-item ${isCurrent ? 'current' : ''} ${answered ? 'answered' : ''}`}
                    onClick={() => setCurrent(idx)}
                  >
                    <div className="question-number">
                      {answered
                        ? <span className="check">✓</span>
                        : <span>{idx + 1}</span>
                      }
                    </div>
                    <div className="question-body">
                      <p className="question-text">{q.question}</p>
                      <div className="answer-options">
                        {q.options.map(opt => (
                          <button
                            key={opt}
                            className={`answer-btn ${answered === opt ? 'selected' : ''}`}
                            onClick={(e) => { e.stopPropagation(); handleAnswer(q.id, opt); }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {error && <div className="qe-error">{error}</div>}

            {/* ── Submit ── */}
            <div className="qe-actions">
              <button
                className="back-btn"
                onClick={() => setStep('patient')}
              >
                ← Back
              </button>
              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < questions.length || loading}
              >
                {loading
                  ? <><span className="spinner" /> Processing...</>
                  : 'Submit & Get Result →'
                }
              </button>
            </div>
          </div>
        )}

        {/* ── Submitting State ── */}
        {step === 'submitting' && (
          <div className="submitting-card">
            <div className="submitting-spinner" />
            <h3>Analyzing responses...</h3>
            <p>Calculating clinical score and generating your report</p>
          </div>
        )}
      </div>
    </div>
  );
}
