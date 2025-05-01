import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import "./courses.css";

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const API_URL = "http://localhost:5000/api/courses";
  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(API_URL);
        setCourses(response.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 2000); // 3 seconds
  
      return () => clearTimeout(timer); // Cleanup on unmount or error change
    }
  }, [error]);

  
  const handleAddCourse = () => {
    setError(null);
    setCurrentCourse({
      id: null,
      code: "",
      title: "",
      description: "",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const handleEditCourse = (course) => {
    setError(null);
    setCurrentCourse({ ...course });
    setIsModalOpen(true);
  };

  const handleDeleteCourse = (course) => {
    setCourseToDelete(course);
    setIsDeleteConfirmOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentCourse.id) {
        // Update existing course
        await axios.put(`${API_URL}/${currentCourse.id}`, currentCourse);
        setCourses(
          courses.map((c) => (c.id === currentCourse.id ? currentCourse : c))
        );
      } else {
        // Add new course
        const response = await axios.post(API_URL, currentCourse);
        setCourses([...courses, response.data]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || "Operation failed");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_URL}/${courseToDelete.id}`);
      setCourses(courses.filter((c) => c.id !== courseToDelete.id));
      setIsDeleteConfirmOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || "Delete failed");
      setIsDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="module-content">
      <div className="module-header">
        <h3>Course Management</h3>
        <motion.button
          className="add-button"
          onClick={handleAddCourse}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          + Add Course
        </motion.button>
      </div>

      <div className="courses-table-container">
        <table className="courses-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.code}</td>
                <td>{course.title}</td>
                <td>{course.description || "-"}</td>
                <td>
                  <span className={`status-badge ${course.status}`}>
                    {course.status}
                  </span>
                </td>
                <td className="actions">
                  <button
                    className="edit-button"
                    onClick={() => handleEditCourse(course)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteCourse(course)}
                    disabled={course.status === "archived"}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Course Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4>{currentCourse.id ? "Edit Course" : "Add New Course"}</h4>
              <AnimatePresence>
                {error && (
                  <motion.div className="toast-error">
                    <span className="error-icon">⚠️</span>
                    Error: {error}
                  </motion.div>
                )}
              </AnimatePresence>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Course Code*</label>
                  <input
                    type="text"
                    value={currentCourse.code}
                    onChange={(e) =>
                      setCurrentCourse({
                        ...currentCourse,
                        code: e.target.value,
                      })
                    }
                    required
                    pattern="[A-Za-z0-9]{3,20}"
                    title="3-20 alphanumeric characters"
                  />
                </div>
                <div className="form-group">
                  <label>Course Title*</label>
                  <input
                    type="text"
                    value={currentCourse.title}
                    onChange={(e) =>
                      setCurrentCourse({
                        ...currentCourse,
                        title: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={currentCourse.description}
                    onChange={(e) =>
                      setCurrentCourse({
                        ...currentCourse,
                        description: e.target.value,
                      })
                    }
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={currentCourse.status}
                    onChange={(e) =>
                      setCurrentCourse({
                        ...currentCourse,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setError(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-button">
                    {currentCourse.id ? "Update" : "Create"} Course
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDeleteConfirmOpen(false)}
          >
            <motion.div
              className="confirm-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4>Confirm Deletion</h4>
              {error && <div className="form-error">{error}</div>}
              <p>
                Are you sure you want to delete the course "
                {courseToDelete?.title}"?
              </p>
              <p className="warning-text">This action cannot be undone!</p>
              <div className="confirm-actions">
                <button
                  className="cancel-button"
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setError(null);
                  }}
                >
                  Cancel
                </button>
                <button className="confirm-delete" onClick={confirmDelete}>
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseManagement;
