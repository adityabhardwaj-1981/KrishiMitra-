import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, Field, Loading, Empty, Badge, ErrorBanner } from '../components/UI';

export default function Marketplace() {
  const { show } = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reload, setReload] = useState(0);
  const [form, setForm] = useState({ title: '', description: '', category: '', price: '', quantity: '', unit: '', location: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/marketplace').then((res) => { setItems(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, [reload]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (file) fd.append('image', file);
      await api.post('/marketplace', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      show('Listing created', 'success');
      setShowForm(false);
      setForm({ title: '', description: '', category: '', price: '', quantity: '', unit: '', location: '' });
      setFile(null);
      setReload((r) => r + 1);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <div className="section-head">
        <h2>Marketplace</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : '+ Add Listing'}</button>
      </div>

      {showForm && (
        <Card className="mb-3">
          <h3 className="mb-2">New Listing</h3>
          <ErrorBanner message={error} />
          <div className="grid grid-2" style={{ gap: 12 }}>
            <Field label="Title" required><input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
            <Field label="Category"><select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}><option value="">Select</option><option>Grain</option><option>Fertilizer</option><option>Seeds</option><option>Produce</option><option>Livestock</option><option>Other</option></select></Field>
            <Field label="Price (₹)"><input className="input" type="number" value={form.price} onChange={(e) => set('price', e.target.value)} /></Field>
            <Field label="Quantity"><input className="input" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} /></Field>
            <Field label="Unit"><input className="input" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="kg / quintal" /></Field>
            <Field label="Location"><input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} /></Field>
            <Field label="Image"><input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} /></Field>
          </div>
          <Field label="Description"><textarea className="input" value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
          <button className="btn btn-primary" onClick={submit}>Publish Listing</button>
        </Card>
      )}

      {loading ? <Loading /> : (
        <>
          {items?.length === 0 && <Empty message="No listings yet. Be the first to sell!" />}
          <div className="grid grid-3">
            {items?.map((it) => (
              <Card key={it.id}>
                {it.image && <img src={it.image} alt={it.title} style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }} />}
                <div className="between center">
                  <h3>{it.title}</h3>
                  <Badge status={it.status} />
                </div>
                <p className="small muted">{it.category} • {it.location}</p>
                <p className="small mt-1">{it.description}</p>
                <div className="mt-2 flex between center">
                  <span style={{ fontSize: 18, fontWeight: 700 }}>₹{it.price}/{it.unit}</span>
                  <span className="small muted">by {it.seller_name}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
