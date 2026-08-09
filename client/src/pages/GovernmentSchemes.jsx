import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Card, Loading, Empty } from '../components/UI';

export default function GovernmentSchemes() {
  const [schemes, setSchemes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/schemes').then((res) => { setSchemes(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const list = (schemes || []).filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <Card className="mb-3">
        <div className="flex gap">
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search schemes…" style={{ maxWidth: 300 }} />
          <button className="btn btn-outline" onClick={() => api.get('/schemes', { params: { q } }).then((r) => setSchemes(r.data))}>Search</button>
        </div>
      </Card>

      {loading ? <Loading /> : (
        <>
          {list.length === 0 && <Empty message="No schemes match your search." />}
          <div className="grid grid-2">
            {list.map((s) => (
              <Card key={s.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(selected?.id === s.id ? null : s)}>
                <h3 className="mb-1">🏛️ {s.name}</h3>
                <p className="small muted mb-1">{s.ministry}</p>
                <p className="small">{s.description}</p>
                {selected?.id === s.id && (
                  <div className="mt-2" style={{ borderTop: '1px solid #eef2ee', paddingTop: 12 }}>
                    <h5 className="small" style={{ color: 'var(--soil-500)' }}>Eligibility</h5><p className="small">{s.eligibility}</p>
                    <h5 className="small mt-1" style={{ color: 'var(--soil-500)' }}>Benefits</h5><p className="small">{s.benefits}</p>
                    <h5 className="small mt-1" style={{ color: 'var(--soil-500)' }}>Documents Required</h5><p className="small">{s.documents_required}</p>
                    <h5 className="small mt-1" style={{ color: 'var(--soil-500)' }}>How to Apply</h5><p className="small">{s.how_to_apply}</p>
                    {s.source && <p className="small muted mt-1">Source: {s.source}</p>}
                  </div>
                )}
              </Card>
            ))}
          </div>
          <p className="disclaimer mt-2">Scheme details are provided for information only. Always verify current eligibility and application details from official government sources.</p>
        </>
      )}
    </div>
  );
}
