import React, { useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card, Field, ErrorBanner, Badge } from '../components/UI';

export default function PestDetection() {
  const { show } = useToast();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [crop, setCrop] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const onFile = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const analyze = async () => {
    setError('');
    if (!file) return setError('Please upload an image of the pest.');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      if (crop) fd.append('crop', crop);
      const res = await api.post('/detection/pest', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
      show('Analysis complete', 'success');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;

  return (
    <div className="grid grid-2">
      <Card>
        <h3 className="mb-2">🐛 Pest Detection</h3>
        <p className="muted small mb-2">Upload a clear image of the suspected pest to get an AI-assisted identification.</p>
        <Field label="Crop name (helps matching)">
          <input className="input" value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="e.g. cotton, maize, rice" />
        </Field>
        <Field label="Pest Image">
          <input className="input" type="file" accept="image/*" onChange={onFile} />
        </Field>
        {preview && <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} />}
        <ErrorBanner message={error} />
        <button className="btn btn-primary btn-block" onClick={analyze} disabled={loading}>
          {loading ? 'Analyzing…' : '🔍 Identify Pest'}
        </button>
        <p className="disclaimer mt-2">AI results are preliminary. Confirm control recommendations with a local extension officer before applying any pesticide.</p>
      </Card>

      <Card>
        <h3 className="mb-2">Result</h3>
        {result ? (
          <div>
            <div className="result-box" style={{ borderLeftColor: confidencePct >= 60 ? 'var(--green-600)' : '#f59e0b' }}>
              <div className="between center">
                <h3>{result.detected_pest}</h3>
                <Badge status={result.severity} />
              </div>
              <p style={{ marginTop: 4 }}>Confidence: <strong>{confidencePct}%</strong></p>
              <div className="confidence-bar"><div style={{ width: `${confidencePct}%` }} /></div>
            </div>
            <div className="mt-2">
              <h4 className="small" style={{ color: 'var(--soil-500)' }}>Affected Crops</h4>
              <p className="small">{result.affected_crops?.join(', ')}</p>
            </div>
            <div className="mt-2">
              <h4 className="small" style={{ color: 'var(--soil-500)' }}>Symptoms / Damage</h4>
              <p className="small">{result.symptoms}</p>
            </div>
            <div className="mt-2">
              <h4 className="small" style={{ color: 'var(--soil-500)' }}>Prevention</h4>
              <p className="small">{result.prevention}</p>
            </div>
            <div className="mt-2">
              <h4 className="small" style={{ color: 'var(--soil-500)' }}>Control Measures</h4>
              <p className="small">{result.control_measures}</p>
            </div>
            <p className="disclaimer">{result.disclaimer}</p>
          </div>
        ) : <div className="empty">Upload a pest image and click Identify to see results.</div>}
      </Card>
    </div>
  );
}

