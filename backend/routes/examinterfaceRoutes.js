const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  startExam, submitExam
} = require('../controller/studentexamgeneration');

router.get('/start/:examId', protect, startExam);
router.post('/submit/:examId', protect, submitExam );

module.exports = router;