import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, Field, Loading, Empty, Badge, ErrorBanner } from '../components/UI';

export default function EquipmentRental() {
  const { show } = useToast();
  const { user } = useAuth();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('browse');
  const [showForm, setShowForm] = useState(false);
  const [reload, setReload] = useState(0);
  const [form, setForm] = useState({ name: '', category: '', description: '', hourly_rate: '', daily_rate: '', location: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [rentals, setRentals] = useState(null);

  useEffect(() => {
    api.get('/equipment').then((res) => { setEquipment(res.data); setLoading(false); }).catch(() => setLoading(false));
    if (tab === 'my') {
      api.get('/equipment/rentals/mine').then((res) => setRentals(res.data)).catch(() => {});
    }
  }, [reload, tab]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submitEquipment = async () => {
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (file) fd.append('image', file);
      await api.post('/equipment', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      show('Equipment listed', 'success');
      setShowForm(false);
      setForm({ name: '', category: '', description: '', hourly_rate: '', daily_rate: '', location: '' });
      setFile(null);
      setReload((r) => r + 1);
    } catch (e) {
      setError(e.message);
    }
  };

  const requestRental = async (eqId) => {
    const start = prompt('Start date (YYYY-MM-DD):');
    if (!start) return;
    const end = prompt('End date (YYYY-MM-DD):');
    if (!end) return;
    try {
      const res = await api.post('/equipment/rent', { equipment_id: eqId, start_date: start, end_date: end });
      show('Rental requested', 'success');
      setReload((r) => r + 1);
    } catch (e) {
      show(e.message, 'error');
    }
  };

  const setStatus = async (rentalId, status) => {
    try {
      await api.put(`/equipment/${rentalId}/status`, { status });
      show('Status updated', 'success');
      setReload((r) => r + 1);
    } catch (e) {
      show(e.message, 'error');
    }
  };

  return (
    <div>
      <div className="section-head">
        <h2>Equipment Rental</h2>
        <div className="flex gap">
          <button className={`btn ${tab === 'browse' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('browse')}>Browse</button>
          <button className={`btn ${tab === 'my' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('my')}>My Rentals</button>
          <button className="btn btn-outline" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : '+ List Equipment'}</button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-3">
          <h3 className="mb-2">List Your Equipment</h3>
          <ErrorBanner message={error} />
          <div className="grid grid-2" style={{ gap: 12 }}>
            <Field label="Name" required><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Category"><select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}><option value="">Select</option><option>Tractor</option><option>Harvester</option><option>Irrigation</option><option>Plow</option><option>Sprayer</option><option>Other</option></select></Field>
            <Field label="Hourly Rate (₹)"><input className="input" type="number" value={form.hourly_rate} onChange={(e) => set('hourly_rate', e.target.value)} /></Field>
            <Field label="Daily Rate (₹)"><input className="input" type="number" value={form.daily_rate} onChange={(e) => set('daily_rate', e.target.value)} /></Field>
            <Field label="Location"><input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} /></Field>
            <Field label="Image"><input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} /></Field>
          </div>
          <Field label="Description"><textarea className="input" value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
          <button className="btn btn-primary" onClick={submitEquipment}>List Equipment</button>
        </Card>
      )}

      {tab === 'browse' && (
        loading ? <Loading /> : (
          <>
            {equipment?.length === 0 && <Empty message="No equipment available." />}
            <div className="grid grid-3">
              {equipment?.map((eq) => (
                <Card key={eq.id}>
                  {eq.image && <img src={eq.image} alt={eq.name} style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }} />}
                  <div className="between center">
                    <h3>🚜 {eq.name}</h3>
                    <Badge status={eq.availability} />
                  </div>
                  <p className="small muted">{eq.category} • {eq.location}</p>
                  <p className="small mt-1">{eq.description}</p>
                  <div className="mt-2 flex between center">
                    <span>₹{eq.hourly_rate}/hr • ₹{eq.daily_rate}/day</span>
                    <span className="small muted">{eq.owner_name}</span>
                  </div>
                  {eq.owner_id !== user?.id && (
                    <button className="btn btn-primary btn-sm btn-block mt-2" onClick={() => requestRental(eq.id)}>Request Rental</button>
                  )}
                </Card>
              ))}
            </div>
          </>
        )
      )}

      {tab === 'my' && rentals && (
        <Card>
          <h3 className="mb-2">As Renter</h3>
          {rentals.as_renter?.length === 0 && <Empty message="No rentals requested." />}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Equipment</th><th>Owner</th><th>Start</th><th>End</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {rentals.as_renter?.map((r) => (
                  <tr key={r.id}>
                    <td>{r.equipment_name}</td><td>{r.owner_name}</td><td>{r.start_date}</td><td>{r.end_date}</td>
                    <td><Badge status={r.status} /></td>
                    <td>{r.status === 'pending' && <button className="btn btn-danger btn-sm" onClick={() => setStatus(r.id, 'cancelled')}>Cancel</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="mb-2 mt-3">As Owner</h3>
          {rentals.as_owner?.length === 0 && <Empty message="No rental requests for your equipment." />}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Equipment</th><th>Renter</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {rentals.as_owner?.map((r) => (
                  <tr key={r.id}>
                    <td>{r.equipment_name}</td><td>{r.renter_name}</td><td>{r.start_date}</td><td>{r.end_date}</td>
                    <td><Badge status={r.status} /></td>
                    <td>
                      {r.status === 'pending' && <>
                        <button className="btn btn-primary btn-sm" onClick={() => setStatus(r.id, 'approved')}>Approve</button>
                        <button className="btn btn-danger btn-sm" style={{ marginLeft: 6 }} onClick={() => setStatus(r.id, 'rejected')}>Reject</button>
                      </>}
                      {r.status === 'approved' && <button className="btn btn-outline btn-sm" onClick={() => setStatus(r.id, 'completed')}>Complete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
