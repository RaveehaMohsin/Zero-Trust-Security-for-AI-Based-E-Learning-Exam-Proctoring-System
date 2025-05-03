const express = require('express');
const { register, login , verifyOTP , getMe , updatePassword} = require('../controller/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp' , verifyOTP);
router.get('/me' ,getMe)
router.put('/update-password', updatePassword);

module.exports = router;