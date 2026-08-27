import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FARMER_NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/chat', label: 'AI Chat', icon: '🤖' },
  { to: '/disease-detection', label: 'Disease Detection', icon: '🦠' },
  { to: '/pest-detection', label: 'Pest Detection', icon: '🐛' },
  { to: '/crop-recommendation', label: 'Crop Recommendation', icon: '🌱' },
  { to: '/soil-health', label: 'Soil Health', icon: '🪱' },
  { to: '/weather', label: 'Weather', icon: '🌦️' },
];

const MARKET_NAV = [
  { to: '/market-prices', label: 'Market Prices', icon: '💰' },
  { to: '/schemes', label: 'Government Schemes', icon: '🏛️' },
  { to: '/marketplace', label: 'Marketplace', icon: '🛒' },
  { to: '/equipment', label: 'Equipment Rental', icon: '🚜' },
];

const FARM_NAV = [
  { to: '/community', label: 'Community', icon: '👥' },
  { to: '/farm-records', label: 'Farm Records', icon: '📒' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
];

const UTIL_NAV = [
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

function Group({ label, items, onClose }) {
  return (
    <>
      <div className="nav-label">{label}</div>
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <span className="icon">{it.icon}</span>
          <span>{it.label}</span>
        </NavLink>
      ))}
    </>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <span className="logo">🌾</span>
        <span>Krishi<span className="dot">•</span>Mitra</span>
      </div>

      <Group label="Farming Tools" items={FARMER_NAV} onClose={onClose} />
      <Group label="Markets & Services" items={MARKET_NAV} onClose={onClose} />
      <Group label="Farm Management" items={FARM_NAV} onClose={onClose} />
      {isAdmin && (
        <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <span className="icon">🛡️</span>
          <span>Admin Panel</span>
        </NavLink>
      )}
      <Group label="Account" items={UTIL_NAV} onClose={onClose} />
    </aside>
  );
}

