import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Card, Loading, Empty, Badge } from '../components/UI';

export default function MarketPrices() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/market').then((res) => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const prices = data?.prices || [];
  const trends = data?.trends || {};
  const filtered = prices.filter((p) => !q || p.commodity.toLowerCase().includes(q.toLowerCase()));

  // Group by commodity for comparison
  const commodities = [...new Set(filtered.map((p) => p.commodity))];

  return (
    <div>
      <Card className="mb-3">
        <div className="flex gap">
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search commodity…" style={{ maxWidth: 300 }} />
          <span className="badge badge-gray" style={{ alignSelf: 'center' }}>Prices are indicative records</span>
        </div>
      </Card>

      {loading ? <Loading /> : (
        <>
          {commodities.length === 0 && <Empty message="No prices found." />}
          {commodities.map((comm) => {
            const rows = filtered.filter((p) => p.commodity === comm);
            const trend = trends[comm];
            return (
              <Card key={comm} className="mb-2">
                <div className="between center mb-1">
                  <h3>🌾 {comm}</h3>
                  {trend && <Badge status={trend.direction} />}
                </div>
                {trend && <p className="small muted">Price change: ₹{Math.abs(trend.change)}</p>}
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Market</th><th>State</th><th>Min</th><th>Modal</th><th>Max</th><th>Unit</th></tr></thead>
                    <tbody>
                      {rows.map((p, i) => (
                        <tr key={i}>
                          <td>{p.market}</td><td>{p.state}</td>
                          <td>₹{p.min_price}</td><td><strong>₹{p.modal_price}</strong></td>
                          <td>₹{p.max_price}</td><td>{p.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
          <p className="disclaimer">Prices are indicative and may vary. Always verify current rates with your local mandi before selling.</p>
        </>
      )}
    </div>
  );
}
