import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Field, ErrorBanner } from '../components/UI';

export default function Register() {
  const { register, loading } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '', farm_name: '', password: '', confirm: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    const { confirm, ...payload } = form;
    const res = await register(payload);
    if (res.ok) {
      show('Account created successfully!', 'success');
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <h1>🌾 Join KrishiMitra</h1>
        <p>Manage your farm, get AI insights, and connect with a community of farmers.</p>
      </div>
      <div className="auth-form">
        <div className="inner">
          <h2 style={{ marginBottom: 8 }}>Create Account</h2>
          <p className="muted mb-2">Start your digital farming journey</p>
          <ErrorBanner message={error} />
          <form onSubmit={submit}>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Full Name" required><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field>
              <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
            </div>
            <Field label="Email" required><input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required /></Field>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Location"><input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} /></Field>
              <Field label="Farm Name"><input className="input" value={form.farm_name} onChange={(e) => set('farm_name', e.target.value)} /></Field>
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Password" required><input className="input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required /></Field>
              <Field label="Confirm" required><input className="input" type="password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} required /></Field>
            </div>
            <button className="btn btn-primary btn-block mt-2" disabled={loading}>
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>
          <p className="small text-center mt-3">
            Already have an account? <Link to="/login" style={{ color: 'var(--green-700)', fontWeight: 600 }}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

