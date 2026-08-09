import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, Field, ErrorBanner } from '../components/UI';

export default function Settings() {
  const { user } = useAuth();
  const { show } = useToast();
  const [settings, setSettings] = useState({});
  const [pwd, setPwd] = useState({ current_password: '', new_password: '', confirm: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/profile/settings').then((res) => setSettings(res.data)).catch(() => {});
  }, []);

  const changePwd = async () => {
    setError('');
    if (pwd.new_password.length < 6) return setError('New password must be at least 6 characters.');
    if (pwd.new_password !== pwd.confirm) return setError('New passwords do not match.');
    try {
      await api.put('/profile/password', { current_password: pwd.current_password, new_password: pwd.new_password });
      show('Password changed successfully', 'success');
      setPwd({ current_password: '', new_password: '', confirm: '' });
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="grid grid-2">
      <Card>
        <h3 className="mb-2">⚙️ Settings</h3>
        <p className="small muted mb-2">Account information</p>
        <div className="mb-1 small"><strong>Name:</strong> {settings.name}</div>
        <div className="mb-1 small"><strong>Email:</strong> {settings.email}</div>
        <div className="mb-1 small"><strong>Role:</strong> <span className="badge badge-green">{settings.role}</span></div>
        <div className="mb-1 small"><strong>Language:</strong> {settings.language}</div>
        <div className="mb-1 small"><strong>Member since:</strong> {user ? new Date().toLocaleDateString() : ''}</div>
      </Card>

      <Card>
        <h3 className="mb-2">🔒 Change Password</h3>
        <ErrorBanner message={error} />
        <Field label="Current Password"><input className="input" type="password" value={pwd.current_password} onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} /></Field>
        <Field label="New Password"><input className="input" type="password" value={pwd.new_password} onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} /></Field>
        <Field label="Confirm New Password"><input className="input" type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} /></Field>
        <button className="btn btn-primary" onClick={changePwd}>Update Password</button>
      </Card>
    </div>
  );
}
