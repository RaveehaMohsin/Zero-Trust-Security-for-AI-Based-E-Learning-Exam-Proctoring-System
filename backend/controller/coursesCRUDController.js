const pool = require('../config/db');

//Function to check upcoming exam
const checkExamConflict = async (courseId) => {
    const [exams] = await pool.query(
      'SELECT * FROM exams WHERE course_id = ? AND end_time > NOW()',
      [courseId]
    );
    return exams.length > 0;
  };

// Create new course
const createCourse = async (req, res) => {
  try {
    const { code, title, description, status = 'active' } = req.body;
    
    // Validate input
    if (!code || !title) {
      return res.status(400).json({ error: 'Course code and title are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO courses (code, title, description, status) VALUES (?, ?, ?, ?)',
      [code, title, description, status]
    );

    res.status(201).json({
      id: result.insertId,
      code,
      title,
      description,
      status
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Course code already exists' });
    }
    res.status(500).json({ error: 'Failed to create course' });
  }
};

// Get all courses
const getAllCourses = async (req, res) => {
  try {
    const [courses] = await pool.query('SELECT * FROM courses ORDER BY title');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, title, description, status } = req.body;

    // Check if course exists
    const [course] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
    if (!course.length) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check for upcoming exams if changing to inactive/archived
    if (status && ['inactive', 'archived'].includes(status)) {
      const hasUpcomingExams = await checkExamConflict(id);
      if (hasUpcomingExams) {
        return res.status(400).json({ 
          error: 'Cannot change status - course has upcoming exams' 
        });
      }
    }

    await pool.query(
      'UPDATE courses SET code = ?, title = ?, description = ?, status = ? WHERE id = ?',
      [code, title, description, status, id]
    );

    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Course code already exists' });
    }
    res.status(500).json({ error: 'Failed to update course' });
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check for upcoming exams
    const hasUpcomingExams = await checkExamConflict(id);
    if (hasUpcomingExams) {
      return res.status(400).json({ 
        error: 'Cannot delete course - it has upcoming exams' 
      });
    }

    await pool.query('DELETE FROM courses WHERE id = ?', [id]);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  updateCourse,
  deleteCourse
};