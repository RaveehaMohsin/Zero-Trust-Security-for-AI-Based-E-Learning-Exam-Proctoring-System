import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import '../../Super Admin/Dashboard/sadashboard.css';
import ProfileSetup from '../../ProfileSetup/profileadd';
import Registercourse from '../CourseRegister/registercourse';
import Notificationexams from '../NotificationExams/notificationexams';

const StudentDashboard = () => {
  const [activeModule, setActiveModule] = useState('courses'); // Default to courses
  const navigate = useNavigate();
  
  // Mock user data
  const currentUser = {
    name: "Student",
    role: "Student",
    avatar: "👑"
  };

  // Handle module selection
  const handleModuleSelect = (moduleId) => {
    if (moduleId === 'logout') {
      // Clear localStorage
      localStorage.removeItem('emailForMFA');
      localStorage.removeItem('role');
      localStorage.removeItem('token');
      // Navigate to home page
      navigate('/');
    } else {
      setActiveModule(moduleId);
    }
  };

  // Radial menu items
  const modules = [
    { id: 'users', icon: '👥', label: 'Profile', color: '#6D8B74' },
    { id: 'courses', icon: '📚', label: 'Register Courses', color: '#A4B465' },
    { id: 'notificationexams', icon: '📊', label: 'Notification Exams', color: '#5F7A61' },
    { id: 'logout', icon: '🚪', label: 'Logout', color: '#8B7E74' }
  ];

  return (
    <div className="super-admin-app">
      {/* Top Navigation Bar */}
      <nav className="admin-navbar">
        <div className="nav-left">
          <h1 className="logo">ExamSecure</h1>
        </div>
        <div className="nav-right">
          <div className="user-info">
            <span className="user-avatar">{currentUser.avatar}</span>
            <div className="user-details">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">{currentUser.role}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Layout */}
      <div className="dashboard-container">
        {/* Sidebar Navigation */}
        <div className="dashboard-sidebar">
          {modules.map((module) => (
            <motion.button
              key={module.id}
              className={`sidebar-button ${activeModule === module.id ? 'active' : ''}`}
              style={{ 
                backgroundColor: activeModule === module.id ? module.color : '#f5f5f5',
                color: activeModule === module.id ? '#fff' : '#333'
              }}
              whileHover={{ 
                backgroundColor: module.color,
                color: '#fff'
              }}
              onClick={() => handleModuleSelect(module.id)}
            >
              <span className="button-icon">{module.icon}</span>
              <span className="button-label">{module.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="dashboard-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeModule === 'courses' && <Registercourse />}
              {activeModule === 'users' && <ProfileSetup />}
              {activeModule === 'notificationexams' && <Notificationexams />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;