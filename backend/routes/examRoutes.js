const express = require('express');
const router = express.Router();
const { createExam, getExamsByCourse } = require('../controller/examController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin'), createExam);
router.get('/', protect, getExamsByCourse);

module.exports = router;