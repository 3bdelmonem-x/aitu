import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import Toast from './components/Shared/Toast';
import Loader from './components/Shared/Loader';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./components/Pages/Dashboard'));
const Sessions = lazy(() => import('./components/Pages/Sessions'));
const Distribution = lazy(() => import('./components/Pages/Distribution'));
const Supervisors = lazy(() => import('./components/Pages/Supervisors'));
const Attendance = lazy(() => import('./components/Pages/Attendance'));
const Excuses = lazy(() => import('./components/Pages/Excuses'));
const ExternalTraining = lazy(() => import('./components/Pages/ExternalTraining'));
const ReportCenter = lazy(() => import('./components/Pages/ReportCenter'));
const Analytics = lazy(() => import('./components/Pages/Analytics'));
const Evaluations = lazy(() => import('./components/Pages/Evaluations'));
const Reports = lazy(() => import('./components/Pages/Reports'));
const Management = lazy(() => import('./components/Pages/Management'));
const SvHome = lazy(() => import('./components/Pages/SvHome'));
const SvAttendance = lazy(() => import('./components/Pages/SvAttendance'));
const SvEvaluations = lazy(() => import('./components/Pages/SvEvaluations'));
const SvReports = lazy(() => import('./components/Pages/SvReports'));

import './App.css';

const AppRoutes = () => {
  const { isAdmin } = useAuth();

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to={isAdmin() ? "/dashboard" : "/sv-home"} replace />} />
          
          {/* Admin Routes */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="distribution" element={<Distribution />} />
          <Route path="supervisors" element={<Supervisors />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="excuses" element={<Excuses />} />
          <Route path="external-training" element={<ExternalTraining />} />
          <Route path="report-center" element={<ReportCenter />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="evaluations" element={<Evaluations />} />
          <Route path="reports" element={<Reports />} />
          <Route path="management" element={<Management />} />
          
          {/* Supervisor Routes */}
          <Route path="sv-home" element={<SvHome />} />
          <Route path="sv-attendance" element={<SvAttendance />} />
          <Route path="sv-evaluations" element={<SvEvaluations />} />
          <Route path="sv-reports" element={<SvReports />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toast />
      </Router>
    </AuthProvider>
  );
}

export default App;