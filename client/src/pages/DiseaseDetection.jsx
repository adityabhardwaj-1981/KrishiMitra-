import React, { useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card, Field, ErrorBanner, Badge } from '../components/UI';

export default function DiseaseDetection() {
  const { show } = useToast();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [crop, setCrop] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const onFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const analyze = async () => {
    setError('');
    if (!file) return setError('Please upload a leaf or plant image (optional for demo).');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      if (crop) fd.append('crop', crop);
      const res = await api.post('/detection/disease', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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
        <h3 className="mb-2">🦠 Crop Disease Detection</h3>
        <p className="muted small mb-2">Upload a clear image of the affected leaf or plant. The AI suggests a possible disease with confidence scoring.</p>
        <Field label="Crop name (helps matching)">
          <input className="input" value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="e.g. wheat, rice, tomato" />
        </Field>
        <Field label="Plant Image">
          <input className="input" type="file" accept="image/*" onChange={onFile} />
        </Field>
        {preview && <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} />}
        <ErrorBanner message={error} />
        <button className="btn btn-primary btn-block" onClick={analyze} disabled={loading}>
          {loading ? 'Analyzing…' : '🔍 Analyze Disease'}
        </button>
        <p className="disclaimer mt-2">This is an AI-assisted preliminary result and should be confirmed by an agricultural expert before treatment.</p>
      </Card>

      <Card>
        <h3 className="mb-2">Result</h3>
        {result ? (
          <div>
            <div className="result-box" style={{ borderLeftColor: confidencePct >= 60 ? 'var(--green-600)' : '#f59e0b' }}>
              <div className="between center">
                <h3>{result.detected_disease}</h3>
                <Badge status={confidencePct >= 60 ? 'High' : 'Medium'} />
              </div>
              <p style={{ marginTop: 4 }}>Confidence: <strong>{confidencePct}%</strong></p>
              <div className="confidence-bar"><div style={{ width: `${confidencePct}%` }} /></div>
            </div>
            <div className="mt-2">
              <h4 className="small" style={{ color: 'var(--soil-500)' }}>Affected Crops</h4>
              <p className="small">{result.affected_crops?.join(', ')}</p>
            </div>
            <div className="mt-2">
              <h4 className="small" style={{ color: 'var(--soil-500)' }}>Symptoms</h4>
              <p className="small">{result.symptoms}</p>
            </div>
            <div className="mt-2">
              <h4 className="small" style={{ color: 'var(--soil-500)' }}>Possible Causes</h4>
              <p className="small">{result.possible_causes}</p>
            </div>
            <div className="mt-2">
              <h4 className="small" style={{ color: 'var(--soil-500)' }}>Preventive Measures</h4>
              <p className="small">{result.preventive_measures}</p>
            </div>
            <div className="mt-2">
              <h4 className="small" style={{ color: 'var(--soil-500)' }}>Control / Next Steps</h4>
              <p className="small">{result.control_measures}</p>
            </div>
            <p className="disclaimer">{result.disclaimer}</p>
          </div>
        ) : <div className="empty">Upload an image and click Analyze to see results here.</div>}
      </Card>
    </div>
  );
}

