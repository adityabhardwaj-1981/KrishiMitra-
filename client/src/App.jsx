import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AIChat from './pages/AIChat';
import DiseaseDetection from './pages/DiseaseDetection';
import PestDetection from './pages/PestDetection';
import CropRecommendation from './pages/CropRecommendation';
import SoilHealth from './pages/SoilHealth';
import Weather from './pages/Weather';
import MarketPrices from './pages/MarketPrices';
import GovernmentSchemes from './pages/GovernmentSchemes';
import Marketplace from './pages/Marketplace';
import EquipmentRental from './pages/EquipmentRental';
import Community from './pages/Community';
import FarmRecords from './pages/FarmRecords';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';

function ProtectedRoute({ children, admin }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

      {/* Protected routes wrapped in layout */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="chat" element={<AIChat />} />
        <Route path="disease-detection" element={<DiseaseDetection />} />
        <Route path="pest-detection" element={<PestDetection />} />
        <Route path="crop-recommendation" element={<CropRecommendation />} />
        <Route path="soil-health" element={<SoilHealth />} />
        <Route path="weather" element={<Weather />} />
        <Route path="market-prices" element={<MarketPrices />} />
        <Route path="schemes" element={<GovernmentSchemes />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="equipment" element={<EquipmentRental />} />
        <Route path="community" element={<Community />} />
        <Route path="farm-records" element={<FarmRecords />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<ProtectedRoute admin><AdminPanel /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

