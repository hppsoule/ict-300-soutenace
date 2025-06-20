import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/Dashboard/PatientDashboard';
import PharmacistDashboard from './pages/Dashboard/PharmacistDashboard';
import DriverDashboard from './pages/Dashboard/DriverDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import CatalogPage from './pages/Catalog/CatalogPage';
import MedicinesPage from './pages/Medicines/MedicinesPage';
import OrdersPage from './pages/Orders/OrdersPage';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import ProfilePage from './pages/Profile/ProfilePage';
import TrackingPage from './pages/TrackingPage';
import ChatPage from './pages/ChatPage';
import UsersPage from './pages/Admin/UsersPage';
import PharmaciesPage from './pages/Admin/PharmaciesPage';
import SettingsPage from './pages/Admin/SettingsPage';
import AdminOrdersPage from './pages/Admin/OrdersPage';
import HomePage from './pages/HomePage';
import DeliveriesPage from './pages/DeliveriesPage';
import PharmacyManagementPage from './pages/Pharmacy/PharmacyManagementPage';
import './i18n';

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user?.role) {
    case 'patient':
      return <PatientDashboard />;
    case 'pharmacist':
      return <PharmacistDashboard />;
    case 'driver':
      return <DriverDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        
        {/* Protected routes with Layout */}
        <Route element={<Layout />}>
          <Route 
            path="/dashboard" 
            element={<DashboardRouter />} 
          />
          <Route 
            path="/catalog" 
            element={
              <ProtectedRoute roles={['patient']}>
                <CatalogPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/medicines" 
            element={
              <ProtectedRoute roles={['pharmacist']}>
                <MedicinesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pharmacy" 
            element={
              <ProtectedRoute roles={['pharmacist']}>
                <PharmacyManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tracking" 
            element={
              <ProtectedRoute>
                <TrackingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/deliveries" 
            element={
              <ProtectedRoute roles={['driver']}>
                <DeliveriesPage />
              </ProtectedRoute>
            } 
          />
          {/* Routes Admin */}
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute roles={['admin']}>
                <UsersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/pharmacies" 
            element={
              <ProtectedRoute roles={['admin']}>
                <PharmaciesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/orders" 
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminOrdersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute roles={['admin']}>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;