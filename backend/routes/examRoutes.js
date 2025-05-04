const express = require('express');
const router = express.Router();
const { createExam, getExamsByCourse , getExamDetails , getExamResults} = require('../controller/examController');
const { protect, authorize ,protectexam } = require('../middleware/authMiddleware');

router.post('/', protectexam , authorize('admin'), createExam);
router.get('/', protect, getExamsByCourse);
router.get('/:examId', protect, getExamDetails);
router.get('/:examId/results', protect, getExamResults);

module.exports = router;