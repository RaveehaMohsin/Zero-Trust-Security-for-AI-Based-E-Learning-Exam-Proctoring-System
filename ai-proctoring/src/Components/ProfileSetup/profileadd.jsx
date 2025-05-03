import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import "./profileadd.css";
import axios from "axios";
import Swal from "sweetalert2";

const API_URL = "http://localhost:5000/api";

const API_URL1 = "http://localhost:5000";

const ProfileSetup = ({ onComplete }) => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState({ name: "", email: "" });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    title: "",
    department: "",
    bio: "",
    phone: "",
    location: "",
    website: "",
    twitter: "",
    linkedin: "",
    profilePicture: null,
    previewImage: "",
  });

  const [securityChecks, setSecurityChecks] = useState({
    twoFactorEnabled: false,
    emailVerified: true, // or false depending on your system
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // If using JWT
          },
        });
        setUser({
          name: res.data.name,
          email: res.data.email,
        });
      } catch (error) {
        console.error("Error fetching user data", error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        // Get user ID from token
        const decoded = jwtDecode(token);
        const currentUserId = decoded.userId;
        console.log(currentUserId);
        setUserId(currentUserId);

        // Fetch profile data
        const response = await fetch(
          `${API_URL}/profiles?userId=${currentUserId}`
        );

        if (!response.ok) throw new Error("Failed to fetch profile");

        const data = await response.json();
        

        if (data.success && data.profile) {
          setFormData({
            fullName: data.profile.full_name || "",
            email: data.profile.email || "",
            title: data.profile.title || "",
            department: data.profile.department || "",
            bio: data.profile.bio || "",
            phone: data.profile.phone || "",
            location: data.profile.location || "",
            website: data.profile.website || "",
            twitter: data.profile.twitter_handle || "",
            linkedin: data.profile.linkedin_url || "",
            previewImage: data.profile.profile_picture
              ? `${API_URL1}/${data.profile.profile_picture}`
              : "",
            profilePicture: null,
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    console.log(file)
    if (file) {
      setFormData((prev) => ({
        ...prev,
        profilePicture: file,
        previewImage: URL.createObjectURL(file),
      }));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
  
    try {
      const formDataToSend = new FormData();
    
      // Append all fields
      formDataToSend.append("userId", userId);
      formDataToSend.append("fullName", formData.fullName || '');
      formDataToSend.append("bio", formData.bio || '');
      formDataToSend.append("title", formData.title || '');
      formDataToSend.append("department", formData.department || '');
      formDataToSend.append("phone", formData.phone || '');
      formDataToSend.append("location", formData.location || '');
      formDataToSend.append("website", formData.website || '');
      formDataToSend.append("twitter", formData.twitter || '');
      formDataToSend.append("linkedin", formData.linkedin || '');
  
      if (formData.profilePicture) {
        formDataToSend.append("profilePicture", formData.profilePicture);
      }
  
      const response = await fetch(`${API_URL}/profiles`, {
        method: "POST",
        body: formDataToSend,
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Profile update failed");
      }
  
      const data = await response.json();
      
      // Show success alert
      await Swal.fire({
        title: "Success!",
        text: "Your profile has been saved successfully",
        icon: "success",
        confirmButtonText: "OK",
      });
      
      console.log("Profile saved:", data);
      onComplete?.();
    } catch (err) {
      console.error('Submission error:', err);
      
      // Show error alert
      await Swal.fire({
        title: "Error!",
        text: err.message || "Failed to save profile",
        icon: "error",
        confirmButtonText: "OK",
      });
      
      setError(err.message);
    }
  };
  
  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!userId)
    return <div className="error-message">User not authenticated</div>;

  return (
    <div className="profile-setup-container">
      <div className="setup-header">
        <h2>Complete Your Profile</h2>
        <p>Step {currentStep} of 3</p>
      </div>

      <div className="setup-progress">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`progress-step ${currentStep >= step ? "active" : ""}`}
            onClick={() => setCurrentStep(step)}
          >
            <span>{step}</span>
            {step === 1
              ? "Basic Info"
              : step === 2
              ? "Professional"
              : "Security"}
          </div>
        ))}
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
                    {formData.fullName
                      ? formData.fullName.charAt(0).toUpperCase()
                      : user.name
                      ? user.name.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                )}
              </div>
              <label className="upload-button">
                Choose Image
                <input
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
              </label>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={user.name} readOnly />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={user.email} readOnly />
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
                    onChange={() =>
                      setSecurityChecks((prev) => ({
                        ...prev,
                        twoFactorEnabled: !prev.twoFactorEnabled,
                      }))
                    }
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="zero-trust-notice">
                <h4>Zero Trust Security Active</h4>
                <p>
                  Your profile is protected with continuous verification. We'll
                  monitor for suspicious activity and prompt for
                  re-authentication when needed.
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
              onClick={(e) => {
                e.preventDefault();
                setCurrentStep(currentStep - 1);
              }}
            >
              Back
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              className="next-button"
              onClick={(e) => {
                e.preventDefault();
                setCurrentStep(currentStep + 1);
              }}
            >
              Next
            </button>
          ) : (
            <button type="submit" className="submit-button">
             Save Profile
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileSetup;
