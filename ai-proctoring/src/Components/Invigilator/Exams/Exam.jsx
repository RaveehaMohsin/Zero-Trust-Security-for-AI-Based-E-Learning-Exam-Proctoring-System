import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './Exam.css';

const Exam = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: ''
  });

  const API_URL = "http://localhost:5000/api";
  const token = localStorage.getItem('token'); // Get token from localStorage

  // Create axios instance with authorization header
  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses'); // Use the api instance
        setCourses(res.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        if (err.response?.status === 401) {
          Swal.fire('Error', 'Session expired. Please login again.', 'error');
          // Optionally redirect to login
        }
      }
    };
    fetchCourses();
  }, []);

  const fetchExams = async (courseId) => {
    try {
      const res = await api.get(`/exams?course_id=${courseId}`);
      setExams(res.data);
    } catch (err) {
      setError(err.message);
      if (err.response?.status === 401) {
        Swal.fire('Error', 'Session expired. Please login again.', 'error');
      }
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    fetchExams(course.id);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      await api.post('/exams', {
        ...formData,
        course_id: selectedCourse.id
      });
      
      Swal.fire('Success!', 'Exam created successfully', 'success');
      fetchExams(selectedCourse.id);
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: ''
      });
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed to create exam', 'error');
    }
  };

  if (loading) return <div className="loading">Loading courses...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  return (
    <div className="exam-container">
      <h2>Exam Management</h2>
      
      <div className="courses-list">
        <h3>Available Courses</h3>
        <ul>
          {courses.map(course => (
            <li 
              key={course.id} 
              className={selectedCourse?.id === course.id ? 'active' : ''}
              onClick={() => handleCourseSelect(course)}
            >
              {course.code} - {course.title}
            </li>
          ))}
        </ul>
      </div>

      {selectedCourse && (
        <div className="exam-section">
          <h3>Exams for {selectedCourse.title}</h3>
          
          <form onSubmit={handleSubmit} className="exam-form">
            <div className="form-group">
              <label>Exam Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <button type="submit" className="submit-btn">
              Add Exam
            </button>
          </form>

          <div className="exams-list">
            <h4>Scheduled Exams</h4>
            {exams.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map(exam => (
                    <tr key={exam.id}>
                      <td>{exam.title}</td>
                      <td>{exam.description}</td>
                      <td>{new Date(exam.start_time).toLocaleString()}</td>
                      <td>{new Date(exam.end_time).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No exams scheduled for this course</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Exam;