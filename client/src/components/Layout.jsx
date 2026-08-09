import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navMap = {
    '/': 'Dashboard',
    '/chat': 'AI Chat',
    '/disease-detection': 'Disease Detection',
    '/pest-detection': 'Pest Detection',
    '/crop-recommendation': 'Crop Recommendation',
    '/soil-health': 'Soil Health',
    '/weather': 'Weather',
    '/market-prices': 'Market Prices',
    '/schemes': 'Government Schemes',
    '/marketplace': 'Marketplace',
    '/equipment': 'Equipment Rental',
    '/community': 'Community',
    '/farm-records': 'Farm Records',
    '/analytics': 'Analytics',
    '/profile': 'Profile',
    '/settings': 'Settings',
    '/admin': 'Admin Panel',
  };
  const title = navMap[location.pathname] || 'KrishiMitra AI';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.name || 'F').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="main">
        <div className="main-content">
          <div className="topbar">
            <div className="flex center gap">
              <button className="btn mobile-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
                ☰
              </button>
              <h1>{title}</h1>
            </div>
            <div className="user-chip">
              <div className="avatar">{initials}</div>
              <div className="uinfo">
                <div className="uname">{user?.name}</div>
                <div className="urole">{user?.role}</div>
              </div>
              <button className="btn-logout" onClick={handleLogout} title="Logout">⏻</button>
            </div>
          </div>

          <div className="page-enter">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

