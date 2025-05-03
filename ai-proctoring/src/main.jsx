import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './Components/Auth/auth';
import VerifyOTP from './Components/Auth/verifyOTP';
import ProtectedRoute from './ProtectedRoute';
import Dashboard from './Components/Student/ProfileSetup/studentprofile';
import SuperAdminDashboard from './Components/Super Admin/Dashboard/superadminDashboard';
import InvigilatorDashboard from './Components/Invigilator/Dashboard/invigilatorDashboard';




const Main = () => {
  return (
    <React.StrictMode>
      <Router>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          
          {/* Protected Routes with placeholder components */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['super admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <InvigilatorDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </React.StrictMode>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Main />);
