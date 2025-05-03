const express = require('express');
const { register, login , verifyOTP , getMe , updatePassword} = require('../controller/authController');
const { protect, verifySecurityQuestion } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp' , verifyOTP);
router.get('/me' ,getMe)
router.put('/update-password', updatePassword);

router.post('/verify-security', protect, verifySecurityQuestion, (req, res) => {
    res.json({ success: true, message: 'Device verified' });
  });


module.exports = router;