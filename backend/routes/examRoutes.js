const express = require('express');
const router = express.Router();
const { createExam, getExamsByCourse } = require('../controller/examController');
const { protect, authorize ,protectexam } = require('../middleware/authMiddleware');

router.post('/', protectexam , authorize('admin'), createExam);
router.get('/', protect, getExamsByCourse);

module.exports = router;