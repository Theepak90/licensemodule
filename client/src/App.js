import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { LicenseProvider } from './contexts/LicenseContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LicenseList from './components/LicenseList';
import CreateLicense from './components/CreateLicense';
import LicenseDetails from './components/LicenseDetails';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <LicenseProvider>
        <Router>
          <div className="min-h-screen" style={{ backgroundColor: '#f5f6ff' }}>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Navbar />
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/licenses" element={
                <ProtectedRoute>
                  <Navbar />
                  <LicenseList />
                </ProtectedRoute>
              } />
              <Route path="/licenses/create" element={
                <ProtectedRoute>
                  <Navbar />
                  <CreateLicense />
                </ProtectedRoute>
              } />
              <Route path="/licenses/:id" element={
                <ProtectedRoute>
                  <Navbar />
                  <LicenseDetails />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </LicenseProvider>
    </AuthProvider>
  );
}

export default App;


