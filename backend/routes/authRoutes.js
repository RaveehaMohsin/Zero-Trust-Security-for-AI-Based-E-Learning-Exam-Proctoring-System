const express = require('express');
const { register, login , verifyOTP , getMe } = require('../controller/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp' , verifyOTP);
router.get('/me' ,getMe)

module.exports = router;