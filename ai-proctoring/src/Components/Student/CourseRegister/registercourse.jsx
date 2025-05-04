import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import "./registercourse.css";
import { encrypt } from "../../../utils/crypto";

const Registercourse = () => {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const API_URL = "http://localhost:5000/api";
  const token = localStorage.getItem("token");

  const api = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const fetchCourses = async () => {
    try {
      const [availableRes, registeredRes] = await Promise.all([
        api.get("/courses/available"),
        api.get("/courses/registered"),
      ]);

      setAvailableCourses(availableRes.data.courses || []);
      setRegisteredCourses(registeredRes.data.courses || []);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleRegister = async (courseId) => {
    try {
      // Validate input
      if (typeof courseId !== 'number' || isNaN(courseId)) {
        throw new Error('Invalid course ID');
      }
  
      // Encrypt the course ID
      const encrypted = encrypt(courseId.toString());
      
      // Verify encryption worked
      if (!encrypted?.encryptedData || !encrypted?.iv) {
        throw new Error('Encryption failed');
      }
  
      // Make the API call
      const response = await api.post("/courses/register", {
        encryptedData: encrypted.encryptedData,
        iv: encrypted.iv
      });
  
      // Handle success
      if (response.data?.success) {
        setSuccess(response.data.message || 'Course registered successfully');
        setError(null);
        await fetchCourses(); // Refresh the course list
      } else {
        throw new Error(response.data?.message || 'Registration failed');
      }
    } catch (err) {
      // Handle errors
      console.error('Registration error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to register for course'
      );
      setSuccess(null);
    }
  };

  if (loading) return <div className="loading">Loading courses...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="course-registration-container">
      {success && <div className="success-message">{success}</div>}

      <div className="courses-section">
        <h2>Available Courses</h2>
        {availableCourses.length === 0 ? (
          <p>No available courses at the moment.</p>
        ) : (
          <div className="course-grid">
            {availableCourses.map((course) => (
              <motion.div
                key={course.id}
                className="course-card"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="course-meta">
                  <span>
                    Seats: {course.max_students - course.current_students}{" "}
                    remaining
                  </span>
                </div>
                <button
                  onClick={() => handleRegister(course.id)}
                  className="register-button"
                >
                  Register
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="courses-section">
        <h2>Your Registered Courses</h2>
        {registeredCourses.length === 0 ? (
          <p>You haven't registered for any courses yet.</p>
        ) : (
          <div className="course-grid">
            {registeredCourses.map((course) => (
              <motion.div
                key={course.id}
                className="course-card registered"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="course-meta">
                  <span>Status: Registered</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Registercourse;
