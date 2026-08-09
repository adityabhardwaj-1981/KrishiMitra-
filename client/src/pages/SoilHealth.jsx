import React, { useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card, Field, ErrorBanner } from '../components/UI';

export default function SoilHealth() {
  const { show } = useToast();
  const [form, setForm] = useState({ ph: '', nitrogen: '', phosphorus: '', potassium: '', organic_carbon: '', soil_type: '', location: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const analyze = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/soil/analyze', form);
      setResult(res.data);
      show('Soil analyzed', 'success');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-2">
      <Card>
        <h3 className="mb-2">🪱 Soil Health Analysis</h3>
        <p className="muted small mb-2">Enter your soil test values (if available) to get a nutrient assessment and improvement recommendations.</p>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="pH"><input className="input" type="number" step="0.1" value={form.ph} onChange={(e) => set('ph', e.target.value)} /></Field>
          <Field label="Soil Type"><select className="input" value={form.soil_type} onChange={(e) => set('soil_type', e.target.value)}><option value="">Select</option><option>Clay</option><option>Loam</option><option>Sandy Loam</option><option>Sandy</option></select></Field>
          <Field label="Nitrogen (kg/ha)"><input className="input" type="number" value={form.nitrogen} onChange={(e) => set('nitrogen', e.target.value)} /></Field>
          <Field label="Phosphorus (kg/ha)"><input className="input" type="number" value={form.phosphorus} onChange={(e) => set('phosphorus', e.target.value)} /></Field>
          <Field label="Potassium (kg/ha)"><input className="input" type="number" value={form.potassium} onChange={(e) => set('potassium', e.target.value)} /></Field>
          <Field label="Organic Carbon (%)"><input className="input" type="number" step="0.1" value={form.organic_carbon} onChange={(e) => set('organic_carbon', e.target.value)} /></Field>
        </div>
        <Field label="Location"><input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} /></Field>
        <ErrorBanner message={error} />
        <button className="btn btn-primary btn-block" onClick={analyze} disabled={loading}>
          {loading ? 'Analyzing…' : '🧪 Analyze Soil'}
        </button>
        <p className="disclaimer mt-2">This is an indicative analysis. A professional laboratory soil test is recommended for precise fertilizer planning.</p>
      </Card>

      <Card>
        <h3 className="mb-2">Soil Condition Report</h3>
        {result ? (
          <div>
            <div className="result-box"><p>{result.summary}</p></div>
            <div className="grid grid-2 mt-2" style={{ gap: 12 }}>
              {Object.entries(result.nutrients).filter(([k]) => k !== 'organic_carbon').map(([k, v]) => (
                <div key={k} className="card" style={{ boxShadow: 'none', border: '1px solid #eef2ee', padding: 14 }}>
                  <div className="between center"><span style={{ textTransform: 'capitalize' }}>{k}</span><span className={`badge ${v.status === 'High' ? 'badge-green' : v.status === 'Medium' ? 'badge-amber' : 'badge-red'}`}>{v.status}</span></div>
                  <div className="stat-val" style={{ fontSize: 22 }}>{v.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <h4 className="small" style={{ color: 'var(--soil-500)' }}>Organic Carbon</h4>
              <p className="small">{result.nutrients.organic_carbon.value}% — {result.nutrients.organic_carbon.status}</p>
            </div>
            <div className="mt-2">
              <h4 className="small" style={{ color: 'var(--soil-500)' }}>Improvement Recommendations</h4>
              {result.recommendations.map((r, i) => <p key={i} className="small" style={{ marginBottom: 4 }}>• {r}</p>)}
            </div>
            <p className="disclaimer">{result.disclaimer}</p>
          </div>
        ) : <div className="empty">Enter soil values and analyze to see the report.</div>}
      </Card>
    </div>
  );
}
