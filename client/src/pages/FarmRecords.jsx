import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card, Field, Loading, Empty, Badge, ErrorBanner } from '../components/UI';

export default function FarmRecords() {
  const { show } = useToast();
  const [tab, setTab] = useState('records');
  const [records, setRecords] = useState(null);
  const [activities, setActivities] = useState(null);
  const [farms, setFarms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ record_type: 'expense', category: '', title: '', amount: '', quantity: '', record_date: '', notes: '' });
  const [actForm, setActForm] = useState({ activity_type: '', description: '', activity_date: '', cost: '' });

  useEffect(() => {
    Promise.all([
      api.get('/farms/records').catch(() => ({ data: [] })),
      api.get('/farms/activities').catch(() => ({ data: [] })),
      api.get('/farms').catch(() => ({ data: [] })),
    ]).then(([r, a, f]) => {
      setRecords(r.data); setActivities(a.data); setFarms(f.data); setLoading(false);
    }).catch(() => setLoading(false));
  }, [reload]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setAct = (k, v) => setActForm((f) => ({ ...f, [k]: v }));

  const submitRecord = async () => {
    setError('');
    try {
      await api.post('/farms/records', form);
      show('Record saved', 'success');
      setShowForm(false);
      setForm({ record_type: 'expense', category: '', title: '', amount: '', quantity: '', record_date: '', notes: '' });
      setReload((r) => r + 1);
    } catch (e) { setError(e.message); }
  };

  const submitActivity = async () => {
    setError('');
    try {
      await api.post('/farms/activities', actForm);
      show('Activity recorded', 'success');
      setActForm({ activity_type: '', description: '', activity_date: '', cost: '' });
      setReload((r) => r + 1);
    } catch (e) { setError(e.message); }
  };

  const del = async (type, id) => {
    if (!confirm('Delete this record?')) return;
    try {
      await api.delete(`/farms/${type}/${id}`);
      show('Deleted', 'success');
      setReload((r) => r + 1);
    } catch (e) { show(e.message, 'error'); }
  };

  const totalIncome = records?.filter((r) => r.record_type === 'income').reduce((s, r) => s + r.amount, 0) || 0;
  const totalExpense = records?.filter((r) => r.record_type === 'expense').reduce((s, r) => s + r.amount, 0) || 0;

  return (
    <div>
      {!loading && (
        <div className="grid grid-3 mb-3">
          <div className="card stat-card"><div className="stat-lab">Income</div><div className="stat-val" style={{ color: 'var(--green-600)' }}>₹{totalIncome.toLocaleString()}</div></div>
          <div className="card stat-card"><div className="stat-lab">Expense</div><div className="stat-val" style={{ color: 'var(--red-500)' }}>₹{totalExpense.toLocaleString()}</div></div>
          <div className="card stat-card"><div className="stat-lab">Net</div><div className="stat-val">₹{(totalIncome - totalExpense).toLocaleString()}</div></div>
        </div>
      )}

      <div className="section-head">
        <h2>Farm Records</h2>
        <div className="flex gap">
          <button className={`btn ${tab === 'records' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('records')}>Income/Expense</button>
          <button className={`btn ${tab === 'activities' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('activities')}>Activities</button>
          <button className="btn btn-outline" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : '+ Add'}</button>
        </div>
      </div>

      {showForm && tab === 'records' && (
        <Card className="mb-3">
          <h3 className="mb-2">Add Income/Expense Record</h3>
          <ErrorBanner message={error} />
          <div className="grid grid-2" style={{ gap: 12 }}>
            <Field label="Type"><select className="input" value={form.record_type} onChange={(e) => set('record_type', e.target.value)}><option value="expense">Expense</option><option value="income">Income</option></select></Field>
            <Field label="Category"><select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}><option value="">Select</option><option>crop_sale</option><option>seeds</option><option>fertilizer</option><option>pesticide</option><option>labour</option><option>machinery</option><option>transport</option><option>other</option></select></Field>
            <Field label="Title" required><input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
            <Field label="Amount (₹)" required><input className="input" type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} /></Field>
            <Field label="Quantity"><input className="input" type="number" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} /></Field>
            <Field label="Date"><input className="input" type="date" value={form.record_date} onChange={(e) => set('record_date', e.target.value)} /></Field>
          </div>
          <Field label="Notes"><textarea className="input" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
          <button className="btn btn-primary" onClick={submitRecord}>Save Record</button>
        </Card>
      )}

      {showForm && tab === 'activities' && (
        <Card className="mb-3">
          <h3 className="mb-2">Record Farm Activity</h3>
          <ErrorBanner message={error} />
          <div className="grid grid-2" style={{ gap: 12 }}>
            <Field label="Activity Type"><select className="input" value={actForm.activity_type} onChange={(e) => setAct('activity_type', e.target.value)}><option value="">Select</option><option>planting</option><option>harvest</option><option>irrigation</option><option>fertilizer</option><option>pesticide</option><option>other</option></select></Field>
            <Field label="Date"><input className="input" type="date" value={actForm.activity_date} onChange={(e) => setAct('activity_date', e.target.value)} /></Field>
            <Field label="Description" required><input className="input" value={actForm.description} onChange={(e) => setAct('description', e.target.value)} /></Field>
            <Field label="Cost (₹)"><input className="input" type="number" value={actForm.cost} onChange={(e) => setAct('cost', e.target.value)} /></Field>
          </div>
          <button className="btn btn-primary" onClick={submitActivity}>Save Activity</button>
        </Card>
      )}

      {loading ? <Loading /> : (
        <Card>
          {tab === 'records' && (
            <>
              {records?.length === 0 && <Empty message="No records yet. Add your first income/expense." />}
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Type</th><th>Amount</th><th></th></tr></thead>
                  <tbody>
                    {records?.map((r) => (
                      <tr key={r.id}>
                        <td>{r.record_date}</td><td>{r.title}</td><td>{r.category}</td>
                        <td><Badge status={r.record_type === 'income' ? 'approved' : 'rejected'} /></td>
                        <td style={{ color: r.record_type === 'income' ? 'var(--green-600)' : 'var(--red-500)', fontWeight: 600 }}>
                          {r.record_type === 'income' ? '+' : '−'}₹{r.amount}
                        </td>
                        <td><button className="btn btn-danger btn-sm" onClick={() => del('records', r.id)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {tab === 'activities' && (
            <>
              {activities?.length === 0 && <Empty message="No activities recorded." />}
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Cost</th><th></th></tr></thead>
                  <tbody>
                    {activities?.map((a) => (
                      <tr key={a.id}>
                        <td>{a.activity_date}</td><td><Badge status={a.activity_type} /></td>
                        <td>{a.description}</td><td>₹{a.cost}</td>
                        <td><button className="btn btn-danger btn-sm" onClick={() => del('activities', a.id)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
