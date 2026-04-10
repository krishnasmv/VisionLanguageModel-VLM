import React, { useState, useEffect, useRef } from 'react';

// Update this with your Colab ngrok URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function CLIPCaptioner() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [customPrompts, setCustomPrompts] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiHealth, setApiHealth] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('caption'); // 'caption' or 'classify'
  const [classes, setClasses] = useState('');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Check API health on mount
  useEffect(() => {
    checkHealth();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [caption]);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) setApiHealth(true);
    } catch (err) {
      setApiHealth(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCaption = async (e) => {
    e.preventDefault();
    if (!image) {
      setError('Please upload an image');
      return;
    }

    setLoading(true);
    setError('');
    setCaption('');

    try {
      const formData = new FormData();
      formData.append('file', image);
      
      if (customPrompts.trim()) {
        formData.append('prompts', customPrompts);
      }

      const response = await fetch(`${API_URL}/caption`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success') {
        setCaption(result.caption);
      } else {
        setError(result.error || 'Failed to generate caption');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClassify = async (e) => {
    e.preventDefault();
    if (!image) {
      setError('Please upload an image');
      return;
    }

    if (!classes.trim()) {
      setError('Please enter classes to classify');
      return;
    }

    setLoading(true);
    setError('');
    setCaption('');

    try {
      const formData = new FormData();
      formData.append('file', image);
      formData.append('classes', classes);

      const response = await fetch(`${API_URL}/classify`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success') {
        const confPercent = (result.confidence * 100).toFixed(1);
        let output = `🎯 Predicted: **${result.predicted_class}** (${confPercent}% confidence)\n\n`;
        output += 'Scores:\n';
        Object.entries(result.all_classes)
          .sort((a, b) => b[1] - a[1])
          .forEach(([cls, score]) => {
            const percent = (score * 100).toFixed(1);
            output += `• ${cls}: ${percent}%\n`;
          });
        setCaption(output);
      } else {
        setError(result.error || 'Failed to classify');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', 'Roboto', sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          min-height: 100vh;
        }

        .app-container {
          display: flex;
          height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }

        .sidebar {
          width: 300px;
          background: rgba(15, 23, 42, 0.95);
          border-right: 1px solid rgba(51, 65, 85, 0.3);
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .logo {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 10px;
        }

        .health-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: ${apiHealth ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
          border: 1px solid ${apiHealth ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
          color: ${apiHealth ? '#86efac' : '#fca5a5'};
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .health-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${apiHealth ? '#22c55e' : '#ef4444'};
          animation: ${apiHealth ? 'pulse 2s infinite' : 'none'};
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .mode-selector {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mode-label {
          font-size: 12px;
          text-transform: uppercase;
          color: #94a3b8;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .mode-buttons {
          display: flex;
          gap: 8px;
        }

        .mode-btn {
          flex: 1;
          padding: 8px 12px;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(51, 65, 85, 0.4);
          color: #cbd5e1;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          transition: all 0.3s ease;
        }

        .mode-btn:hover {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .mode-btn.active {
          background: rgba(59, 130, 246, 0.2);
          border-color: #3b82f6;
          color: #93c5fd;
        }

        .main-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: linear-gradient(to bottom, rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.8));
          padding: 24px;
          gap: 20px;
          overflow-y: auto;
        }

        .image-preview-area {
          display: flex;
          gap: 20px;
          background: rgba(30, 41, 59, 0.4);
          padding: 16px;
          border-radius: 8px;
          border: 1px solid rgba(51, 65, 85, 0.3);
        }

        .image-preview {
          width: 200px;
          height: 200px;
          border-radius: 8px;
          object-fit: cover;
          border: 2px solid rgba(59, 130, 246, 0.3);
        }

        .image-empty {
          width: 200px;
          height: 200px;
          border-radius: 8px;
          background: rgba(30, 41, 59, 0.6);
          border: 2px dashed rgba(59, 130, 246, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 14px;
        }

        .controls {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .file-input-group {
          display: flex;
          gap: 8px;
        }

        .file-input {
          display: none;
        }

        .file-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .file-label:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
        }

        .file-name {
          padding: 10px 12px;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(51, 65, 85, 0.4);
          border-radius: 6px;
          color: #cbd5e1;
          font-size: 12px;
          flex: 1;
        }

        .input-field {
          width: 100%;
          padding: 10px 12px;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(51, 65, 85, 0.4);
          border-radius: 6px;
          color: #e2e8f0;
          font-size: 13px;
          font-family: inherit;
          transition: all 0.3s ease;
        }

        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(30, 41, 59, 0.8);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .input-field::placeholder {
          color: #64748b;
        }

        .input-label {
          font-size: 12px;
          color: #cbd5e1;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .submit-btn {
          padding: 10px 20px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .results-area {
          background: rgba(30, 41, 59, 0.4);
          padding: 16px;
          border-radius: 8px;
          border: 1px solid rgba(51, 65, 85, 0.3);
          min-height: 100px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
        }

        .results-title {
          font-size: 12px;
          text-transform: uppercase;
          color: #94a3b8;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .result-text {
          color: #cbd5e1;
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .result-text strong {
          color: #60a5fa;
        }

        .error-msg {
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
        }

        .loading-spinner {
          display: inline-block;
          width: 4px;
          height: 4px;
          background: #60a5fa;
          border-radius: 50%;
          animation: blink 1.4s infinite;
          margin-left: 4px;
        }

        @keyframes blink {
          0%, 60%, 100% { opacity: 0.3; }
          30% { opacity: 1; }
        }

        .info-text {
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>

      {/* Sidebar */}
      <div className="sidebar">
        <div>
          <div className="logo">🎨 CLIP Captioner</div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            Lightweight image understanding
          </p>
        </div>

        <div className="health-badge">
          <div className="health-dot" />
          {apiHealth ? 'Backend Connected' : 'Connecting...'}
        </div>

        <div className="mode-selector">
          <div className="mode-label">Mode</div>
          <div className="mode-buttons">
            <button
              className={`mode-btn ${mode === 'caption' ? 'active' : ''}`}
              onClick={() => setMode('caption')}
            >
              📝 Caption
            </button>
            <button
              className={`mode-btn ${mode === 'classify' ? 'active' : ''}`}
              onClick={() => setMode('classify')}
            >
              🏷️ Classify
            </button>
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <p className="info-text">
            <strong>Caption Mode:</strong> Match image to text prompts and generate description
          </p>
          <p className="info-text" style={{ marginTop: '12px' }}>
            <strong>Classify Mode:</strong> Classify image into one of your custom classes
          </p>
        </div>
      </div>

      {/* Main Area */}
      <div className="main-area">
        {/* Image Preview */}
        <div className="image-preview-area">
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="image-preview" />
          ) : (
            <div className="image-empty">
              📤 Upload image
            </div>
          )}

          <div className="controls">
            <div className="file-input-group">
              <label className="file-label">
                📤 Choose Image
                <input
                  type="file"
                  className="file-input"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                />
              </label>
            </div>

            {imagePreview && (
              <p className="file-name">
                ✓ Image selected
              </p>
            )}

            {mode === 'caption' && (
              <>
                <div>
                  <div className="input-label">Custom Prompts (Optional)</div>
                  <textarea
                    className="input-field"
                    placeholder="E.g., 'a cat sitting, a dog running' (comma-separated)"
                    value={customPrompts}
                    onChange={(e) => setCustomPrompts(e.target.value)}
                    style={{ minHeight: '80px', resize: 'none' }}
                  />
                </div>
              </>
            )}

            {mode === 'classify' && (
              <>
                <div>
                  <div className="input-label">Classes (Required)</div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="E.g., 'cat, dog, bird' (comma-separated)"
                    value={classes}
                    onChange={(e) => setClasses(e.target.value)}
                  />
                </div>
              </>
            )}

            <button
              className="submit-btn"
              onClick={mode === 'caption' ? handleCaption : handleClassify}
              disabled={loading || !image}
            >
              {loading ? (
                <>
                  Processing
                  <span className="loading-spinner" />
                  <span className="loading-spinner" />
                  <span className="loading-spinner" />
                </>
              ) : (
                `🚀 ${mode === 'caption' ? 'Generate Caption' : 'Classify'}`
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="results-area">
          <div className="results-title">📊 Results</div>

          {error && (
            <div className="error-msg">
              ❌ {error}
            </div>
          )}

          {caption && !error && (
            <div className="result-text">
              {caption.split('\n').map((line, i) => (
                <div key={i}>
                  {line.split(/\*\*(.+?)\*\*/g).map((part, j) =>
                    j % 2 === 1 ? (
                      <strong key={j}>{part}</strong>
                    ) : (
                      <span key={j}>{part}</span>
                    )
                  )}
                </div>
              ))}
            </div>
          )}

          {!caption && !error && (
            <div className="info-text" style={{ color: '#64748b' }}>
              Upload an image and click "{mode === 'caption' ? 'Generate Caption' : 'Classify'}" to see results
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
