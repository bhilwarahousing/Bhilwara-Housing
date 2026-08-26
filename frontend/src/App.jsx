import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PreferencesProvider } from './context/PreferencesContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';

import UserDashboard from './pages/UserDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Homepage */}
          <Route path="/" element={<Home />} />

          {/* Public Property Discovery Catalog */}
          <Route path="/properties" element={<Properties />} />

          {/* Detailed Property Page */}
          <Route path="/properties/:propertyId" element={<PropertyDetail />} />

          {/* Role-Protected User Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['USER', 'OWNER', 'ADMIN']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Role-Protected Owner Dashboard */}
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Role-Protected Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </PreferencesProvider>
  );
}
