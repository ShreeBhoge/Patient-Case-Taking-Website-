import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { QuickDemoBar } from './components/QuickDemoBar';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PatientsList } from './pages/PatientsList';
import { PatientRegister } from './pages/PatientRegister';
import { PatientDetail } from './pages/PatientDetail';
import { CaseTakingForm } from './pages/CaseTakingForm';
import { Appointments } from './pages/Appointments';
import { TemplatesManager } from './pages/TemplatesManager';
import { AuditLogs } from './pages/AuditLogs';
import { UserManagement } from './pages/UserManagement';

// Error Boundary to prevent any unhandled crash
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Captured in ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">CuraPulse Clinic System Notice</h2>
          <p className="text-sm text-slate-600 max-w-md mb-6">
            The session encountered an unexpected view state. Click below to return smoothly to the clinic dashboard.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = '/';
            }}
            className="px-5 py-2.5 bg-teal-600 text-white font-bold text-sm rounded-xl hover:bg-teal-700 transition"
          >
            Return to Clinic Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected Route wrapper with optional role restriction
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Verifying clinic session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 1-click Demo Switcher Bar */}
      <QuickDemoBar />
      {/* Clinic Navigation */}
      <Navbar />
      {/* Main Page View */}
      <main className="flex-1 pb-16">{children}</main>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <PatientsList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/patients/new"
              element={
                <ProtectedRoute>
                  <PatientRegister />
                </ProtectedRoute>
              }
            />

            <Route
              path="/patients/:id"
              element={
                <ProtectedRoute>
                  <PatientDetail />
                </ProtectedRoute>
              }
            />

            {/* Clinical Case Taking (Doctors and Admins only) */}
            <Route
              path="/cases/new"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                  <CaseTakingForm />
                </ProtectedRoute>
              }
            />

            {/* Appointments Schedule */}
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <Appointments />
                </ProtectedRoute>
              }
            />

            {/* Admin Specialty Templates */}
            <Route
              path="/templates"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <TemplatesManager />
                </ProtectedRoute>
              }
            />

            {/* Admin User Management */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            {/* Admin Audit Trail */}
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
