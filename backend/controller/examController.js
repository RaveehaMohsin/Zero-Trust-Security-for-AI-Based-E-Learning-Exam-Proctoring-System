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

    if (course[0].status.toLowerCase() !== 'active') {
      return res.status(400).json({ error: 'Cannot create exam for an inactive course' });
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

// Add these to your exams controller file

const getExamDetails = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id;

    // Check if user is registered for the course this exam belongs to
    const [exam] = await pool.query(
      `SELECT e.*, c.title as course_title, c.code as course_code,
       u.name as invigilator_name
       FROM exams e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON e.invigilator_id = u.id
       JOIN course_registrations cr ON c.id = cr.course_id
       WHERE e.id = ? AND cr.student_id = ? AND cr.status = 'active'`,
      [examId, userId]
    );

    if (exam.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found or you are not registered for this course'
      });
    }

    res.status(200).json({
      success: true,
      exam: exam[0]
    });

  } catch (error) {
    console.error('Error fetching exam details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam details'
    });
  }
};

const getExamResults = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id;

    // Get the exam result and attempt data in a single query
    const [results] = await pool.query(
      `SELECT er.*, ea.questions, ea.submitted_answers 
       FROM exam_results er
       JOIN exam_attempts ea ON er.exam_id = ea.exam_id AND er.student_id = ea.student_id
       WHERE er.exam_id = ? AND er.student_id = ?`,
      [examId, userId]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No results found for this exam'
      });
    }

    const result = results[0];

    // Parse the questions and answers
    let questions = [];
    try {
      questions = JSON.parse(result.questions || '[]');
    } catch (e) {
      console.error('Error parsing questions:', e);
      questions = [];
    }

    let submittedAnswers = {};
    try {
      submittedAnswers = JSON.parse(result.submitted_answers || '{}');
    } catch (e) {
      console.error('Error parsing submitted answers:', e);
      submittedAnswers = {};
    }

    // Format the response with question numbers and correct answers
    const formattedQuestions = questions.map((question, index) => ({
      questionNumber: index,
      question: question.question,
      options: question.options || [],
      correctAnswer: question.correctAnswer,
      selectedAnswer: submittedAnswers[`temp-${index}`] !== undefined 
        ? submittedAnswers[`temp-${index}`] 
        : null
    }));

    res.status(200).json({
      success: true,
      result: {
        score: result.score,
        created_at: result.created_at
      },
      questions: formattedQuestions,
      submittedAnswers: submittedAnswers
    });

  } catch (error) {
    console.error('Error fetching exam results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam results'
    });
  }
};

module.exports = {
  createExam,
  getExamsByCourse,
  getExamDetails,
  getExamResults,
};