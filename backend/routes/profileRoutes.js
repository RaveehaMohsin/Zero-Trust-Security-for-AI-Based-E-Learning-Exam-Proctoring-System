const express = require('express');
const router = express.Router();
const profileController = require('../controller/profilesetupController');

// Get user profile
router.get('/', profileController.getProfile);

// Create or update profile
router.post('/', profileController.updateProfile);

module.exports = router;
