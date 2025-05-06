const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  startExam, submitExam , getActiveExamForInvigilator
} = require('../controller/studentexamgeneration');

router.get('/start/:examId', protect, startExam);
router.get('/alertinvigilator', protect, getActiveExamForInvigilator);
router.post('/submit/:examId', protect, submitExam );

module.exports = router;