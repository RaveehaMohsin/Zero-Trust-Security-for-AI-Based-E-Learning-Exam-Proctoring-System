import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./Components/Auth/auth";
import VerifyOTP from "./Components/Auth/verifyOTP";
import ProtectedRoute from "./ProtectedRoute";

import SuperAdminDashboard from "./Components/Super Admin/Dashboard/superadminDashboard";
import InvigilatorDashboard from "./Components/Invigilator/Dashboard/invigilatorDashboard";
import StudentDashboard from "./Components/Student/Dashboard/studentdashboard";
import ExamInterface from "./Components/Student/NotificationExams/ExamInterface";
import ExamResults from "./Components/Student/NotificationExams/examResults";

const Main = () => {
  return (
    <React.StrictMode>
      <Router>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />

          {/* Protected Routes with placeholder components */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute allowedRoles={["super admin"]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <InvigilatorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exams/start/:examId"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <ExamInterface />
              </ProtectedRoute>
            }
          />

          <Route
            path="/exams/results/:examId"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <ExamResults />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </React.StrictMode>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Main />);
