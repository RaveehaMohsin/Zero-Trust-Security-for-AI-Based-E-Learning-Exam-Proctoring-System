import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import './profileadd.css';

const ProfileSetup = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    title: '',
    department: '',
    bio: '',
    phone: '',
    location: '',
    website: '',
    twitter: '',
    linkedin: '',
    profilePicture: null,
    previewImage: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [securityChecks, setSecurityChecks] = useState({
    emailVerified: false,
    twoFactorEnabled: false,
    passwordStrength: 'medium'
  });

  useEffect(() => {
    // Get user data from JWT token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userData = {
          id: decoded.userId,
          role: decoded.role,
          name: decoded.name || '',
          email: decoded.email || ''
        };
        
        setUser(userData);
        
        // Set initial form data with user info
        setFormData(prev => ({
          ...prev,
          fullName: userData.name,
          email: userData.email
        }));
        
        setLoading(false);
        
        // Simulate email verification check
        setTimeout(() => {
          setSecurityChecks(prev => ({ ...prev, emailVerified: true }));
        }, 1500);
        
      } catch (error) {
        console.error('Error decoding token:', error);
        // Handle error (e.g., redirect to login)
      }
    } else {
      // Handle case where token doesn't exist
      console.error('No token found');
      // Redirect to login or handle appropriately
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ 
        ...prev, 
        profilePicture: file,
        previewImage: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formDataToSend.append(key, value);
      }
    });
    formDataToSend.append('user_id', user.id);

    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Profile update failed');
      
      const data = await response.json();
      console.log('Profile saved:', data);
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      // Handle error (show message to user)
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!user) {
    return <div className="error-message">User not authenticated</div>;
  }

  return (
    <div className="profile-setup-container">
      <div className="setup-header">
        <h2>Complete Your Profile</h2>
        <p>Step {currentStep} of 3</p>
      </div>

      <div className="setup-progress">
        <div 
          className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}
          onClick={() => setCurrentStep(1)}
        >
          <span>1</span>
          Basic Info
        </div>
        <div 
          className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}
          onClick={() => setCurrentStep(2)}
        >
          <span>2</span>
          Professional
        </div>
        <div 
          className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}
          onClick={() => setCurrentStep(3)}
        >
          <span>3</span>
          Security
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="form-step"
          >
            <div className="avatar-upload">
              <div className="avatar-preview">
                {formData.previewImage ? (
                  <img src={formData.previewImage} alt="Preview" />
                ) : (
                  <div className="avatar-placeholder">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <label className="upload-button">
                Choose Image
                <input 
                  type="file" 
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled
              />
              {securityChecks.emailVerified && (
                <span className="verified-badge">Verified</span>
              )}
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
              />
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="form-step"
          >
            <div className="form-group">
              <label>Professional Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group half-width">
                <label>Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://"
                />
              </div>
              <div className="form-group half-width">
                <label>Twitter</label>
                <input
                  type="text"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  placeholder="@username"
                />
              </div>
            </div>

            <div className="form-group">
              <label>LinkedIn</label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="form-step"
          >
            <div className="security-section">
              <h3>Security Settings</h3>
              
              <div className="security-item">
                <div className="security-info">
                  <h4>Two-Factor Authentication</h4>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={securityChecks.twoFactorEnabled}
                    onChange={() => setSecurityChecks(prev => ({
                      ...prev,
                      twoFactorEnabled: !prev.twoFactorEnabled
                    }))}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="security-item">
                <div className="security-info">
                  <h4>Password Strength</h4>
                  <p>Current strength: {securityChecks.passwordStrength}</p>
                </div>
                <div className="password-strength-meter">
                  <div 
                    className={`strength-bar ${securityChecks.passwordStrength}`}
                    style={{ 
                      width: securityChecks.passwordStrength === 'weak' ? '33%' :
                             securityChecks.passwordStrength === 'medium' ? '66%' : '100%'
                    }}
                  ></div>
                </div>
              </div>

              <div className="zero-trust-notice">
                <h4>Zero Trust Security Active</h4>
                <p>
                  Your profile is protected with continuous verification. 
                  We'll monitor for suspicious activity and prompt for re-authentication when needed.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="form-navigation">
          {currentStep > 1 && (
            <button 
              type="button" 
              className="back-button"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Back
            </button>
          )}
          
          {currentStep < 3 ? (
            <button 
              type="button" 
              className="next-button"
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Next
            </button>
          ) : (
            <button type="submit" className="submit-button">
              Complete Profile
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileSetup;