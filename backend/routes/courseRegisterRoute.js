const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  registerCourse,
  getRegisteredCourses,
  getAvailableCourses, 
  getUpcomingExams ,
  startExam, submitExam
} = require('../controller/registercourses');

router.post('/register', protect, registerCourse);
router.get('/registered', protect, getRegisteredCourses);
router.get('/available', protect, getAvailableCourses);
router.get('/exams', protect, getUpcomingExams)




module.exports = router;