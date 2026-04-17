import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { classifyXray } from '../services/api';
import Navbar from '../components/Navbar';
import './NewScan.css';

export default function NewScan() {
  const navigate    = useNavigate();
  const fileRef     = useRef(null);

  const [step,       setStep]       = useState('upload');   // upload | result
  const [file,       setFile]       = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [dragging,   setDragging]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [lowConf,    setLowConf]    = useState(false);
  const [result,     setResult]     = useState(null);

  // ── File selection ─────────────────────────────────────────
  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(selectedFile.type)) {
      setError('Please upload a PNG, JPG or JPEG image.');
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError('');
    setLowConf(false);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const handleDragLeave = ()  => setDragging(false);

  // ── Classify ───────────────────────────────────────────────
  const handleClassify = async () => {
    if (!file) { setError('Please select an image first.'); return; }
    setLoading(true);
    setError('');
    setLowConf(false);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res  = await classifyXray(formData);
      const data = res.data;

      if (!data.above_threshold) {
        setLowConf(true);
        setLoading(false);
        return;
      }

      setResult(data);
      setStep('result');
    } catch (err) {
      setError(err.response?.data?.error || 'Classification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset ──────────────────────────────────────────────────
  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setLowConf(false);
    setError('');
    setStep('upload');
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Proceed to questions ───────────────────────────────────
  const handleProceed = () => {
    navigate('/question-engine', { state: { result } });
  };

  const getClassColor = (cls) => ({
    Normal       : '#16a34a',
    Osteopenia   : '#d97706',
    Osteoporosis : '#dc2626',
  }[cls] || '#2563eb');

  const getClassBg = (cls) => ({
    Normal       : '#f0fdf4',
    Osteopenia   : '#fffbeb',
    Osteoporosis : '#fef2f2',
  }[cls] || '#eff6ff');

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="scan-container">

        {/* ── Page Header ── */}
        <div className="scan-page-header">
          <h1>New Scan</h1>
          <p>Upload a knee X-ray image to begin bone density analysis</p>
        </div>

        {step === 'upload' && (
          <>
            {/* ── Upload Area ── */}
            <div className="upload-section">
              <div
                className={`drop-zone ${dragging ? 'dragging' : ''} ${preview ? 'has-preview' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !preview && fileRef.current.click()}
              >
                {!preview ? (
                  <div className="drop-content">
                    <div className="drop-icon">🩻</div>
                    <h3>Drop your X-ray image here</h3>
                    <p>or click to browse files</p>
                    <span className="drop-hint">Supports PNG, JPG, JPEG • Max 16MB</span>
                  </div>
                ) : (
                  <div className="preview-wrapper">
                    <img src={preview} alt="X-ray preview" className="preview-img" />
                    <div className="preview-overlay">
                      <span>{file?.name}</span>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files[0])}
              />

              {/* ── Low Confidence Warning ── */}
              {lowConf && (
                <div className="low-conf-alert">
                  <div className="alert-icon">⚠️</div>
                  <div className="alert-content">
                    <strong>Image quality is too low for reliable analysis</strong>
                    <p>
                      The model confidence is below 80%. Please upload a clearer,
                      higher quality knee X-ray image for accurate classification.
                    </p>
                  </div>
                </div>
              )}

              {error && <div className="scan-error">{error}</div>}

              {/* ── Action Buttons ── */}
              <div className="upload-actions">
                {preview && (
                  <button className="reset-btn" onClick={handleReset}>
                    ✕ Remove Image
                  </button>
                )}
                <button
                  className="classify-btn"
                  onClick={handleClassify}
                  disabled={!file || loading}
                >
                  {loading
                    ? <><span className="spinner" /> Analyzing...</>
                    : '🔬 Analyze X-Ray'
                  }
                </button>
              </div>
            </div>

            {/* ── Instructions ── */}
            <div className="instructions-grid">
              {[
                { icon: '📸', title: 'Image Quality', text: 'Use clear, well-lit knee X-ray images. Blurry or low-contrast images may fail the confidence check.' },
                { icon: '🦴', title: 'Correct View', text: 'Anterior-posterior (AP) or lateral knee X-ray views work best for accurate bone density analysis.' },
                { icon: '📐', title: 'File Format', text: 'Upload PNG, JPG or JPEG files. The system accepts images up to 16MB in size.' },
                { icon: '⚡', title: 'Processing Time', text: 'Analysis typically takes 5-15 seconds. GradCAM++ heatmap is generated simultaneously.' },
              ].map((item, i) => (
                <div key={i} className="instruction-card">
                  <span className="instruction-icon">{item.icon}</span>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 'result' && result && (
          <div className="result-section">

            {/* ── Classification Badge ── */}
            <div
              className="classification-banner"
              style={{
                background: getClassBg(result.predicted_class),
                borderColor: getClassColor(result.predicted_class)
              }}
            >
              <div className="banner-left">
                <span
                  className="class-label"
                  style={{ color: getClassColor(result.predicted_class) }}
                >
                  {result.predicted_class === 'Normal'       && '✅'}
                  {result.predicted_class === 'Osteopenia'   && '⚠️'}
                  {result.predicted_class === 'Osteoporosis' && '🔴'}
                  &nbsp; {result.predicted_class}
                </span>
                <span className="confidence-badge">
                  Confidence: <strong>{result.confidence}%</strong>
                </span>
              </div>
              <div className="banner-right">
                {['Normal', 'Osteopenia', 'Osteoporosis'].map(cls => (
                  <div key={cls} className="prob-row">
                    <span>{cls}</span>
                    <div className="prob-bar-track">
                      <div
                        className="prob-bar-fill"
                        style={{
                          width     : `${result.all_probabilities[cls]}%`,
                          background: getClassColor(cls)
                        }}
                      />
                    </div>
                    <span>{result.all_probabilities[cls]}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Image Comparison ── */}
            <div className="image-comparison">
              <div className="image-panel">
                <div className="image-panel-header">
                  <span>🩻</span>
                  <h4>Original X-Ray</h4>
                </div>
                <img
                  src={result.original_base64}
                  alt="Original X-Ray"
                  className="scan-img"
                />
              </div>

              {result.heatmap_base64 && (
                <div className="image-panel">
                  <div className="image-panel-header">
                    <span>🔥</span>
                    <h4>GradCAM++ Heatmap</h4>
                  </div>
                  <img
                    src={result.heatmap_base64}
                    alt="GradCAM++ Heatmap"
                    className="scan-img"
                  />
                  <div className="heatmap-legend">
                    <div className="legend-bar" />
                    <div className="legend-labels">
                      <span>Low attention</span>
                      <span>High attention</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Info Box ── */}
            <div className="result-info-box">
              <span>ℹ️</span>
              <p>
                The GradCAM++ heatmap highlights the regions of the knee X-ray
                that the model focused on to make this classification.
                Warmer colors (red/orange) indicate higher attention areas.
              </p>
            </div>

            {/* ── Actions ── */}
            <div className="result-actions">
              <button className="secondary-btn" onClick={handleReset}>
                ← Upload New Image
              </button>
              <button className="proceed-btn" onClick={handleProceed}>
                Continue to Patient Questions →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
