import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = 'http://localhost:5000/api/auth';

  const getDeviceId = () => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const hardwareConcurrency = navigator.hardwareConcurrency || 'unknown';
    const deviceMemory = navigator.deviceMemory || 'unknown';
    return `${userAgent}-${platform}-${hardwareConcurrency}-${deviceMemory}`;
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? 'login' : 'register';
      const response = await axios.post(`${API_URL}/${endpoint}`, {
        ...formData,
        deviceId: getDeviceId()
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      
      // For admin MFA flow
      if (response.data.mfaRequired) {
        localStorage.setItem('emailForMFA', formData.email);
        navigate('/verify-otp');
      } else {
        localStorage.setItem('emailForMFA', '');
        navigate('/superadmin');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ backgroundColor: '#F5ECD5' }}>
      <motion.div 
        className="auth-card"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <motion.h2 
            style={{ color: '#626F47' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {isLogin ? 'Exam Proctoring Login' : 'Create New Account'}
          </motion.h2>
          <p style={{ color: '#A4B465' }}>
            {isLogin ? 'Secure access to your exams' : 'Join our proctoring system'}
          </p>
        </div>

        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="auth-input"
                  required={!isLogin}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <input
              type="email"
              name="email"
              placeholder="University Email"
              value={formData.email}
              onChange={handleChange}
              className="auth-input"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <input
              type="password"
              name="password"
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              className="auth-input"
              required
              minLength="6"
            />
          </motion.div>

          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                className="role-selector"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label style={{ color: '#626F47' }}>I am a:</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  style={{ backgroundColor: '#F0BB78', color: '#626F47' }}
                >
                  <option value="student">Student</option>
                  <option value="admin">Exam Administrator</option>
                </select>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            className="auth-button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ backgroundColor: '#A4B465' }}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner">Processing...</span>
            ) : (
              isLogin ? 'Secure Login' : 'Register Account'
            )}
          </motion.button>
        </form>

        <motion.div 
          className="auth-toggle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p style={{ color: '#626F47' }}>
            {isLogin ? "New to proctoring system?" : 'Already registered?'}
          </p>
          <button 
            onClick={toggleAuthMode}
            className="toggle-button"
            style={{ color: '#F0BB78' }}
            type="button"
          >
            {isLogin ? 'Create Account' : 'Login Here'}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;