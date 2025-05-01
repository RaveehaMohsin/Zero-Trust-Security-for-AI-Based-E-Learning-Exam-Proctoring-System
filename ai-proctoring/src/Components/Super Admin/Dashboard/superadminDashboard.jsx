import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './sadashboard.css';
import CourseManagement from '../Courses CRUD/coursesCRUD';

const SuperAdminDashboard = () => {
  const [activeModule, setActiveModule] = useState('courses'); // Default to courses
  
  // Mock user data
  const currentUser = {
    name: "Admin User",
    role: "Super Admin",
    avatar: "👑"
  };

  // Radial menu items
  const modules = [
    { id: 'courses', icon: '📚', label: 'Courses', color: '#A4B465' },
    { id: 'users', icon: '👥', label: 'Users', color: '#6D8B74' },
    { id: 'analytics', icon: '📊', label: 'Analytics', color: '#5F7A61' },
    { id: 'alerts', icon: '🚨', label: 'Alerts', color: '#D54C4C' },
    { id: 'settings', icon: '⚙️', label: 'Settings', color: '#8B7E74' }
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
              onClick={() => setActiveModule(module.id)}
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
              {activeModule === 'courses' && <CourseManagement />}
              {/* {activeModule === 'users' && <UserControl />}
              {activeModule === 'analytics' && <SystemAnalytics />}
              {activeModule === 'alerts' && <SecurityAlerts />}
              {activeModule === 'settings' && <SystemSettings />} */}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>

  );
};

export default SuperAdminDashboard;