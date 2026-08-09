import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, Field, ErrorBanner } from '../components/UI';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { show } = useToast();
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) setForm({ name: user.name, phone: user.phone, location: user.location, farm_name: user.farm_name, language: user.language });
  }, [user]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setError('');
    try {
      const res = await api.put('/profile', form);
      updateUser(res.data);
      show('Profile updated', 'success');
    } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <Card className="mb-3">
        <div className="flex center gap">
          <div className="avatar" style={{ width: 70, height: 70, fontSize: 28, borderRadius: '50%', background: 'var(--green-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            {(user?.name || 'F').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3>{user?.name}</h3>
            <p className="muted small">{user?.email} • <span className="badge badge-green">{user?.role}</span></p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-2">Edit Profile</h3>
        <ErrorBanner message={error} />
        <div className="grid grid-2" style={{ gap: 12 }}>
          <Field label="Full Name"><input className="input" value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Phone"><input className="input" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Location"><input className="input" value={form.location || ''} onChange={(e) => set('location', e.target.value)} /></Field>
          <Field label="Farm Name"><input className="input" value={form.farm_name || ''} onChange={(e) => set('farm_name', e.target.value)} /></Field>
          <Field label="Language">
            <select className="input" value={form.language || 'en'} onChange={(e) => set('language', e.target.value)}>
              <option value="en">English</option><option value="hi">हिन्दी</option>
            </select>
          </Field>
        </div>
        <button className="btn btn-primary mt-2" onClick={save}>Save Changes</button>
      </Card>
    </div>
  );
}
