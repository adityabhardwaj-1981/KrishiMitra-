import React, { createContext, useContext, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('km_user') || 'null');
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('km_token') || null);
  const [loading, setLoading] = useState(false);

  const persist = (t, u) => {
    localStorage.setItem('km_token', t);
    localStorage.setItem('km_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      persist(res.data.token, res.data.user);
      return { ok: true, user: res.data.user };
    } catch (e) {
      return { ok: false, message: e.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', payload);
      persist(res.data.token, res.data.user);
      return { ok: true, user: res.data.user };
    } catch (e) {
      return { ok: false, message: e.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('km_token');
    localStorage.removeItem('km_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (u) => {
    localStorage.setItem('km_user', JSON.stringify(u));
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

