import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Card, Field, Loading, ErrorBanner } from '../components/UI';

export default function Weather() {
  const [city, setCity] = useState('Delhi');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (c) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/weather?city=${encodeURIComponent(c)}`);
      setData(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load('Delhi'); }, []);

  return (
    <div>
      <Card className="mb-3">
        <div className="flex gap">
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter city / region" style={{ maxWidth: 300 }} />
          <button className="btn btn-primary" onClick={() => load(city)}>Get Weather</button>
        </div>
      </Card>

      {error && <ErrorBanner message={error} />}
      {loading && <Loading />}

      {data && !loading && (
        <>
          <div className="grid grid-4 mb-3">
            <div className="card stat-card"><div className="stat-lab">Temperature</div><div className="stat-val">{data.tempC}°C</div></div>
            <div className="card stat-card"><div className="stat-lab">Feels Like</div><div className="stat-val">{data.feelsLikeC}°C</div></div>
            <div className="card stat-card"><div className="stat-lab">Humidity</div><div className="stat-val">{data.humidity}%</div></div>
            <div className="card stat-card"><div className="stat-lab">Wind</div><div className="stat-val">{data.windSpeed} m/s</div></div>
          </div>

          <Card className="mb-3">
            <h3 className="mb-1">☀️ {data.city} — {data.weather?.description}</h3>
            {data.simulated && <span className="badge badge-amber">Simulated data (no API key)</span>}
            <div className="grid grid-3 mt-2">
              {data.forecast?.map((d, i) => (
                <div key={i} className="card" style={{ boxShadow: 'none', border: '1px solid #eef2ee', textAlign: 'center' }}>
                  <div className="small muted">{d.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{d.tempHigh}°</div>
                  <div className="small">{d.tempLow}°</div>
                  <div className="small">{d.condition}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-2">🌾 Farming Advisory</h3>
            {(data.farmingTips || []).map((t, i) => <p key={i} className="small" style={{ marginBottom: 6 }}>• {t}</p>)}
            <p className="disclaimer mt-2">Weather guidance is indicative. Always verify with your local meteorological office for critical farming decisions.</p>
          </Card>
        </>
      )}
    </div>
  );
}
