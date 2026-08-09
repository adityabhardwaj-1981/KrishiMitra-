import React from 'react';

// Reusable UI primitives

export function Card({ children, className = '', style }) {
  return <div className={`card ${className}`} style={style}>{children}</div>;
}

export function StatCard({ icon, value, label, color }) {
  return (
    <div className="card stat-card">
      <div className="flex between center">
        <div className="stat-lab">{label}</div>
        <div className="stat-ico">{icon}</div>
      </div>
      <div className="stat-val" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}

export function FeatureTile({ icon, title, desc, onClick }) {
  return (
    <div className="feature-tile" onClick={onClick} role="button" tabIndex="0">
      <div className="fico">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

export function Badge({ status }) {
  const map = {
    active: 'badge-green',
    pending: 'badge-amber',
    approved: 'badge-green',
    rejected: 'badge-red',
    completed: 'badge-blue',
    cancelled: 'badge-gray',
    sold: 'badge-amber',
    removed: 'badge-red',
    available: 'badge-green',
    rented: 'badge-amber',
    maintenance: 'badge-gray',
    hidden: 'badge-red',
    up: 'badge-green',
    down: 'badge-red',
    stable: 'badge-gray',
    Low: 'badge-amber',
    Medium: 'badge-gray',
    High: 'badge-red',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

export function Loading() {
  return <div className="loading">Loading…</div>;
}

export function Empty({ message = 'No data found.' }) {
  return <div className="empty">🌾 {message}</div>;
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="error-banner">⚠️ {message}</div>;
}

export function Field({ label, children, required }) {
  return (
    <div className="field">
      <label>{label}{required && ' *'}</label>
      {children}
    </div>
  );
}

export function SectionHead({ title, action }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {action}
    </div>
  );
}

