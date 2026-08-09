import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card, StatCard, Loading, Badge, ErrorBanner, Field } from '../components/UI';

export default function AdminPanel() {
  const { show } = useToast();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState(null);
  const [crops, setCrops] = useState(null);
  const [schemes, setSchemes] = useState(null);
  const [posts, setPosts] = useState(null);
  const [listings, setListings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState('');
  const [cropForm, setCropForm] = useState({ name: '', season: '', soil_type: '', water_requirement: '', duration_days: '', avg_yield: '', description: '' });
  const [schemeForm, setSchemeForm] = useState({ name: '', ministry: '', description: '', eligibility: '', benefits: '', documents_required: '', how_to_apply: '' });

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      const jobs = [];
      if (tab === 'overview') jobs.push(api.get('/admin/stats'));
      if (tab === 'users') jobs.push(api.get('/admin/users'));
      if (tab === 'crops') jobs.push(api.get('/crops'));
      if (tab === 'schemes') jobs.push(api.get('/schemes'));
      if (tab === 'posts') jobs.push(api.get('/community'));
      if (tab === 'listings') jobs.push(api.get('/marketplace'));
      try {
        const results = await Promise.all(jobs);
        if (tab === 'overview') setStats(results[0].data);
        if (tab === 'users') setUsers(results[0].data);
        if (tab === 'crops') setCrops(results[0].data);
        if (tab === 'schemes') setSchemes(results[0].data);
        if (tab === 'posts') setPosts(results[0].data);
        if (tab === 'listings') setListings(results[0].data);
      } catch (e) { setError(e.message); }
      setLoading(false);
    };
    load();
  }, [tab, reload]);

  const toggleUser = async (id, approved) => {
    try { await api.put(`/admin/users/${id}/status`, { approved }); show('Updated', 'success'); setReload((r) => r + 1); } catch (e) { show(e.message, 'error'); }
  };
  const setRole = async (id, role) => {
    try { await api.put(`/admin/users/${id}/role`, { role }); show('Role updated', 'success'); setReload((r) => r + 1); } catch (e) { show(e.message, 'error'); }
  };
  const addCrop = async () => {
    try { await api.post('/admin/crops', cropForm); show('Crop added', 'success'); setCropForm({}); setReload((r) => r + 1); } catch (e) { show(e.message, 'error'); }
  };
  const delCrop = async (id) => {
    if (!confirm('Delete crop?')) return;
    try { await api.delete(`/admin/crops/${id}`); show('Deleted', 'success'); setReload((r) => r + 1); } catch (e) { show(e.message, 'error'); }
  };
  const addScheme = async () => {
    try { await api.post('/admin/schemes', schemeForm); show('Scheme added', 'success'); setSchemeForm({}); setReload((r) => r + 1); } catch (e) { show(e.message, 'error'); }
  };
  const delScheme = async (id) => {
    if (!confirm('Delete scheme?')) return;
    try { await api.delete(`/admin/schemes/${id}`); show('Deleted', 'success'); setReload((r) => r + 1); } catch (e) { show(e.message, 'error'); }
  };
  const moderatePost = async (id, status) => {
    try { await api.put(`/admin/posts/${id}/moderation`, { status }); show('Updated', 'success'); setReload((r) => r + 1); } catch (e) { show(e.message, 'error'); }
  };
  const moderateListing = async (id, status) => {
    try { await api.put(`/admin/listings/${id}/moderation`, { status }); show('Updated', 'success'); setReload((r) => r + 1); } catch (e) { show(e.message, 'error'); }
  };

  const tabs = ['overview', 'users', 'crops', 'schemes', 'posts', 'listings'];
  const cset = (k, v) => setCropForm((f) => ({ ...f, [k]: v }));
  const sset = (k, v) => setSchemeForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="section-head">
        <h2>🛡️ Admin Panel</h2>
        <div className="flex gap" style={{ flexWrap: 'wrap' }}>
          {tabs.map((t) => <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>)}
        </div>
      </div>

      <ErrorBanner message={error} />
      {loading && <Loading />}

      {tab === 'overview' && stats && !loading && (
        <>
          <div className="grid grid-4 mb-3">
            <StatCard icon="👥" value={stats.stats.users} label="Users" />
            <StatCard icon="💬" value={stats.stats.posts} label="Posts" />
            <StatCard icon="🛒" value={stats.stats.listings} label="Listings" />
            <StatCard icon="🚜" value={stats.stats.equipment} label="Equipment" />
          </div>
          <Card>
            <h3 className="mb-2">Recent Users</h3>
            <div className="table-wrap">
              <table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
                <tbody>{stats.recentUsers.map((u) => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td><Badge status={u.role === 'admin' ? 'approved' : 'active'} /></td><td>{u.created_at}</td></tr>)}</tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === 'users' && users && !loading && (
        <Card><div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Approved</th><th>Actions</th></tr></thead>
          <tbody>{users.map((u) => <tr key={u.id}>
            <td>{u.name}</td><td>{u.email}</td>
            <td><select className="input" style={{ width: 100 }} value={u.role} onChange={(e) => setRole(u.id, e.target.value)}><option value="farmer">farmer</option><option value="admin">admin</option></select></td>
            <td>{u.approved ? <Badge status="approved" /> : <Badge status="rejected" />}</td>
            <td><button className="btn btn-sm btn-outline" onClick={() => toggleUser(u.id, !u.approved)}>{u.approved ? 'Revoke' : 'Approve'}</button></td>
          </tr>)}</tbody></table></div></Card>
      )}

      {tab === 'crops' && crops && !loading && (
        <Card>
          <h3 className="mb-2">Add Crop</h3>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <Field label="Name"><input className="input" value={cropForm.name} onChange={(e) => cset('name', e.target.value)} /></Field>
            <Field label="Season"><input className="input" value={cropForm.season} onChange={(e) => cset('season', e.target.value)} /></Field>
            <Field label="Soil Type"><input className="input" value={cropForm.soil_type} onChange={(e) => cset('soil_type', e.target.value)} /></Field>
            <Field label="Water Requirement"><input className="input" value={cropForm.water_requirement} onChange={(e) => cset('water_requirement', e.target.value)} /></Field>
            <Field label="Duration (days)"><input className="input" value={cropForm.duration_days} onChange={(e) => cset('duration_days', e.target.value)} /></Field>
            <Field label="Avg Yield"><input className="input" value={cropForm.avg_yield} onChange={(e) => cset('avg_yield', e.target.value)} /></Field>
          </div>
          <Field label="Description"><input className="input" value={cropForm.description} onChange={(e) => cset('description', e.target.value)} /></Field>
          <button className="btn btn-primary" onClick={addCrop}>Add Crop</button>
          <div className="table-wrap mt-3"><table><thead><tr><th>Name</th><th>Season</th><th>Soil</th><th>Duration</th><th></th></tr></thead>
            <tbody>{crops.map((c) => <tr key={c.id}><td>{c.name}</td><td>{c.season}</td><td>{c.soil_type}</td><td>{c.duration_days} days</td><td><button className="btn btn-danger btn-sm" onClick={() => delCrop(c.id)}>Delete</button></td></tr>)}</tbody></table></div>
        </Card>
      )}

      {tab === 'schemes' && schemes && !loading && (
        <Card>
          <h3 className="mb-2">Add Scheme</h3>
          <Field label="Name"><input className="input" value={schemeForm.name} onChange={(e) => sset('name', e.target.value)} /></Field>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <Field label="Ministry"><input className="input" value={schemeForm.ministry} onChange={(e) => sset('ministry', e.target.value)} /></Field>
            <Field label="Description"><input className="input" value={schemeForm.description} onChange={(e) => sset('description', e.target.value)} /></Field>
            <Field label="Eligibility"><input className="input" value={schemeForm.eligibility} onChange={(e) => sset('eligibility', e.target.value)} /></Field>
            <Field label="Benefits"><input className="input" value={schemeForm.benefits} onChange={(e) => sset('benefits', e.target.value)} /></Field>
            <Field label="Documents"><input className="input" value={schemeForm.documents_required} onChange={(e) => sset('documents_required', e.target.value)} /></Field>
            <Field label="How to Apply"><input className="input" value={schemeForm.how_to_apply} onChange={(e) => sset('how_to_apply', e.target.value)} /></Field>
          </div>
          <button className="btn btn-primary" onClick={addScheme}>Add Scheme</button>
          <div className="table-wrap mt-3"><table><thead><tr><th>Name</th><th>Ministry</th><th></th></tr></thead>
            <tbody>{schemes.map((s) => <tr key={s.id}><td>{s.name}</td><td>{s.ministry}</td><td><button className="btn btn-danger btn-sm" onClick={() => delScheme(s.id)}>Delete</button></td></tr>)}</tbody></table></div>
        </Card>
      )}

      {tab === 'posts' && posts && !loading && (
        <Card>
          <div className="table-wrap"><table><thead><tr><th>Title</th><th>Author</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{posts.map((p) => <tr key={p.id}><td>{p.title}</td><td>{p.author_name}</td><td><Badge status={p.status} /></td>
              <td>{p.status === 'active' ? <button className="btn btn-sm btn-outline" onClick={() => moderatePost(p.id, 'hidden')}>Hide</button> : <button className="btn btn-sm btn-primary" onClick={() => moderatePost(p.id, 'active')}>Show</button>}</td>
            </tr>)}</tbody></table></div>
        </Card>
      )}

      {tab === 'listings' && listings && !loading && (
        <Card>
          <div className="table-wrap"><table><thead><tr><th>Title</th><th>Seller</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{listings.map((l) => <tr key={l.id}><td>{l.title}</td><td>{l.seller_name}</td><td>₹{l.price}</td><td><Badge status={l.status} /></td>
              <td>{l.status !== 'removed' && <button className="btn btn-sm btn-outline" onClick={() => moderateListing(l.id, 'removed')}>Remove</button>}</td>
            </tr>)}</tbody></table></div>
        </Card>
      )}
    </div>
  );
}
