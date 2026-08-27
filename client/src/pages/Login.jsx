import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Field, ErrorBanner } from '../components/UI';

export default function Login() {
  const { login, loading } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(form.email, form.password);
    if (res.ok) {
      show('Welcome back!', 'success');
      navigate(res.user.role === 'admin' ? '/admin' : '/');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <span className="hi" style={{ fontSize: '1.2rem', color: 'var(--gold)', fontWeight: 600 }}>कृषिमित्र</span>
        <h1>Your farm's digital companion.</h1>
        <p>Follow every stage of the crop — sow, grow, protect, sell — backed by AI-driven precision and live data.</p>
        <div style={{ marginTop: 24 }}>
          <a href="/" style={{ fontSize: 13, color: 'var(--paper)', textDecoration: 'underline', opacity: 0.85 }}>
            ← Back to landing page
          </a>
        </div>
      </div>
      <div className="auth-form">
        <div className="inner">
          <h2 style={{ marginBottom: 6 }}>Login</h2>
          <p className="muted mb-2" style={{ fontSize: 14 }}>Access your farming dashboard</p>
          <ErrorBanner message={error} />
          <form onSubmit={submit}>
            <Field label="Email">
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="••••••••" />
            </Field>
            <button className="btn btn-primary btn-block mt-2" disabled={loading}>
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>
          <p className="small text-center mt-3">
            New to KrishiMitra? <Link to="/register" style={{ color: 'var(--green-700)', fontWeight: 600 }}>Create an account</Link>
          </p>
          <div className="card mt-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <p className="small"><strong>Demo accounts:</strong><br />
              Admin: <code>admin@krishimitra.ai</code> / <code>Admin@123</code><br />
              Farmer: <code>farmer@krishimitra.ai</code> / <code>Farmer@123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

