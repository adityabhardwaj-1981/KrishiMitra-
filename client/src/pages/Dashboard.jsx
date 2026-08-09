import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatCard, FeatureTile, Card, Loading, Empty } from '../components/UI';

const FEATURES = [
  { icon: '🤖', title: 'AI Chat', desc: 'Ask any farming question.', to: '/chat' },
  { icon: '🦠', title: 'Disease Detection', desc: 'Analyze plant images for diseases.', to: '/disease-detection' },
  { icon: '🐛', title: 'Pest Detection', desc: 'Identify crop pests from photos.', to: '/pest-detection' },
  { icon: '🌱', title: 'Crop Recommendation', desc: 'Find the best crops for your farm.', to: '/crop-recommendation' },
  { icon: '🪱', title: 'Soil Health', desc: 'Analyze soil nutrients.', to: '/soil-health' },
  { icon: '🌦️', title: 'Weather', desc: 'Farm-informed weather forecasts.', to: '/weather' },
  { icon: '💰', title: 'Market Prices', desc: 'Compare crop prices & trends.', to: '/market-prices' },
  { icon: '🏛️', title: 'Schemes', desc: 'Explore government support.', to: '/schemes' },
  { icon: '🛒', title: 'Marketplace', desc: 'Buy & sell farm products.', to: '/marketplace' },
  { icon: '🚜', title: 'Equipment Rental', desc: 'Rent or list farm machinery.', to: '/equipment' },
  { icon: '👥', title: 'Community', desc: 'Connect with fellow farmers.', to: '/community' },
  { icon: '📒', title: 'Farm Records', desc: 'Track crops, costs & income.', to: '/farm-records' },
  { icon: '📈', title: 'Analytics', desc: 'Understand your farm profits.', to: '/analytics' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [weather, setWeather] = useState(null);
  const [prices, setPrices] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/weather?city=Delhi').catch(() => null),
      api.get('/market').catch(() => null),
      api.get('/analytics').catch(() => null),
    ]).then(([w, p, a]) => {
      setWeather(w?.data);
      setPrices(p?.data?.prices);
      setAnalytics(a?.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <Card className="mb-3" style={{ background: 'linear-gradient(135deg, #14532d, #166534)', color: '#fff', border: 'none' }}>
        <h2 style={{ fontSize: 26 }}>{greet}, {user?.name || 'Farmer'}! 👋</h2>
        <p style={{ opacity: 0.9, marginTop: 6 }}>Here's your farm at a glance. KrishiMitra AI is here to help with every decision.</p>
      </Card>

      {loading ? <Loading /> : (
        <div className="grid grid-4 mb-3">
          <StatCard icon="💸" value={`₹${(analytics?.summary?.profit || 0).toLocaleString()}`} label="Net Profit" />
          <StatCard icon="📥" value={`₹${(analytics?.summary?.income || 0).toLocaleString()}`} label="Total Income" />
          <StatCard icon="📤" value={`₹${(analytics?.summary?.expense || 0).toLocaleString()}`} label="Total Expense" />
          <StatCard icon="🌡️" value={weather ? `${weather.tempC}°C` : '—'} label={weather?.city || 'Weather'} />
        </div>
      )}

      <div className="grid grid-2 mb-3">
        <Card>
          <h3 className="mb-2">🌦️ Weather Today — {weather?.city || ''}</h3>
          {weather ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{weather.weather?.description}</div>
              <p className="muted small mt-1">Humidity: {weather.humidity}% • Wind: {weather.windSpeed} m/s{weather.simulated && ' (simulated)'}</p>
              <div className="mt-2">
                {(weather.farmingTips || []).map((t, i) => <p key={i} className="small" style={{ marginBottom: 4 }}>• {t}</p>)}
              </div>
            </>
          ) : <p className="muted small">Weather unavailable.</p>}
        </Card>
        <Card>
          <h3 className="mb-2">💰 Top Market Prices</h3>
          {prices && prices.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Commodity</th><th>Market</th><th>Modal ₹/quintal</th></tr></thead>
                <tbody>
                  {prices.slice(0, 5).map((p, i) => <tr key={i}><td>{p.commodity}</td><td>{p.market}</td><td>{p.modal_price}</td></tr>)}
                </tbody>
              </table>
            </div>
          ) : <Empty message="No price data." />}
        </Card>
      </div>

      <div className="section-head">
        <h2>Farming Tools</h2>
      </div>
      <div className="grid grid-feature">
        {FEATURES.map((f) => (
          <FeatureTile key={f.to} icon={f.icon} title={f.title} desc={f.desc} onClick={() => navigate(f.to)} />
        ))}
      </div>
    </div>
  );
}

