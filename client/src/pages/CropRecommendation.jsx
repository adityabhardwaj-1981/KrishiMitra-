import React, { useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card, Field, ErrorBanner } from '../components/UI';

export default function CropRecommendation() {
  const { show } = useToast();
  const [form, setForm] = useState({ soil_type: '', season: '', water_availability: '', location: '', previous_crop: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const recommend = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/crops/recommend', form);
      setResult(res.data);
      show('Recommendations generated', 'success');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-2">
      <Card>
        <h3 className="mb-2">🌱 Crop Recommendation</h3>
        <p className="muted small mb-2">Provide your soil, season and water details to get tailored crop suggestions.</p>
        <Field label="Soil Type">
          <select className="input" value={form.soil_type} onChange={(e) => set('soil_type', e.target.value)}>
            <option value="">Select…</option>
            <option value="clay">Clay</option>
            <option value="loam">Loam</option>
            <option value="sandy loam">Sandy Loam</option>
            <option value="sandy">Sandy</option>
          </select>
        </Field>
        <Field label="Season">
          <select className="input" value={form.season} onChange={(e) => set('season', e.target.value)}>
            <option value="">Select…</option>
            <option value="kharif">Kharif (Monsoon)</option>
            <option value="rabi">Rabi (Winter)</option>
          </select>
        </Field>
        <Field label="Water Availability">
          <select className="input" value={form.water_availability} onChange={(e) => set('water_availability', e.target.value)}>
            <option value="">Select…</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </Field>
        <Field label="Location">
          <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Punjab, Maharashtra" />
        </Field>
        <Field label="Previous Crop">
          <input className="input" value={form.previous_crop} onChange={(e) => set('previous_crop', e.target.value)} placeholder="e.g. rice, wheat" />
        </Field>
        <ErrorBanner message={error} />
        <button className="btn btn-primary btn-block" onClick={recommend} disabled={loading}>
          {loading ? 'Analyzing…' : '🌾 Get Recommendations'}
        </button>
        <p className="disclaimer mt-2">Recommendations are based on limited inputs. Confirm local conditions, market demand and seed availability before planting.</p>
      </Card>

      <Card>
        <h3 className="mb-2">Recommended Crops</h3>
        {result ? (
          <div>
            {result.recommended_crops.map((c, i) => (
              <div key={i} className="card mt-1" style={{ boxShadow: 'none', border: '1px solid #eef2ee' }}>
                <div className="between center">
                  <h4>{i + 1}. {c.name}</h4>
                  <span className="badge badge-green">{c.suitability}% suitable</span>
                </div>
                <p className="small mt-1">{c.reasoning}</p>
                <p className="small muted mt-1">Match factors: {c.matches.join(', ')}</p>
              </div>
            ))}
            <p className="disclaimer mt-2">{result.notes}</p>
          </div>
        ) : <div className="empty">Fill the form to get crop recommendations.</div>}
      </Card>
    </div>
  );
}
