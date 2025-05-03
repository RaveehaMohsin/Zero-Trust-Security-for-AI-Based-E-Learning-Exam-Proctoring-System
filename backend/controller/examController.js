const pool = require('../config/db');

// Create new exam
const createExam = async (req, res) => {
  try {
    const { course_id, title, description, start_time, end_time } = req.body;
    console.log(req.user)
    const invigilator_id = req.user.id; 

    // Validate input
    if (!course_id || !title || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if course exists
    const [course] = await pool.query('SELECT * FROM courses WHERE id = ?', [course_id]);
    if (!course.length) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Validate time
    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // Check for overlapping exams
    const [overlapping] = await pool.query(
      `SELECT * FROM exams 
       WHERE course_id = ? AND (
         (start_time <= ? AND end_time >= ?) OR
         (start_time <= ? AND end_time >= ?) OR
         (start_time >= ? AND end_time <= ?)
      )`,
      [course_id, start_time, start_time, end_time, end_time, start_time, end_time]
    );

    if (overlapping.length > 0) {
      return res.status(400).json({ error: 'Exam time conflicts with existing exam' });
    }

    // Insert exam
    const [result] = await pool.query(
      `INSERT INTO exams 
       (course_id, title, description, start_time, end_time , invigilator_id) 
       VALUES (?, ?, ?, ?, ? , ?)`,
      [course_id, title, description, start_time, end_time , invigilator_id]
    );

    res.status(201).json({
      id: result.insertId,
      course_id,
      title,
      description,
      start_time,
      end_time
    });

  } catch (error) {
    console.error('Exam creation error:', error);
    res.status(500).json({ error: 'Failed to create exam' });
  }
};

// Get exams by course
const getExamsByCourse = async (req, res) => {
  try {
    const { course_id } = req.query;

    if (!course_id) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    const [exams] = await pool.query(
      'SELECT * FROM exams WHERE course_id = ? ORDER BY start_time',
      [course_id]
    );

    res.json(exams);
  } catch (error) {
    console.error('Fetch exams error:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
};

module.exports = {
  createExam,
  getExamsByCourse
};