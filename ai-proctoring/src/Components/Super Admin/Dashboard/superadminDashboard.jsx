import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // ✅ Import useNavigate
import './sadashboard.css';
import CourseManagement from '../Courses CRUD/coursesCRUD';
import ProfileSetup from '../../ProfileSetup/profileadd';

const SuperAdminDashboard = () => {
  const [activeModule, setActiveModule] = useState('users');
  const navigate = useNavigate(); // ✅ Hook for navigation

  const currentUser = {
    name: "Admin User",
    role: "Super Admin",
    avatar: "👑"
  };

  const modules = [
    { id: 'users', icon: '👥', label: 'Profile', color: '#6D8B74' },
    { id: 'courses', icon: '📚', label: 'Courses', color: '#A4B465' },
    { id: 'analytics', icon: '📊', label: 'Analytics', color: '#5F7A61' },
    { id: 'alerts', icon: '🚨', label: 'Alerts', color: '#D54C4C' },
    { id: 'logout', icon: '⚙️', label: 'Logout', color: '#8B7E74' }
  ];

  const handleModuleSelect = (moduleId) => {
    if (moduleId === 'logout') {
      localStorage.removeItem('emailForMFA');
      localStorage.removeItem('role');
      localStorage.removeItem('token');
      navigate('/');
    } else {
      setActiveModule(moduleId);
    }
  };

  return (
    <div className="super-admin-app">
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

      <div className="dashboard-container">
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
              onClick={() => handleModuleSelect(module.id)} // ✅ Updated to use logout logic
            >
              <span className="button-icon">{module.icon}</span>
              <span className="button-label">{module.label}</span>
            </motion.button>
          ))}
        </div>

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
              {activeModule === 'users' && <ProfileSetup />}
              {/* You can uncomment or add the respective components here */}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
