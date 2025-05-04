// Required modules
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../config/db'); // MySQL connection pool
require('dotenv').config();


// Helper function to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const [existingUser] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    // For admin registration, you might want to add additional steps here
    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      userId: result.insertId 
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * @desc    Login user (students get JWT, admins get OTP)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {

    const { email, password, deviceId } = req.body;

    // 1. Find user by email
    const [user] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user[0];

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 3. Device Trust: Update device ID
      if (deviceId) {
        try {
          await pool.query(
            'UPDATE users SET device_id = ? WHERE email = ?',
            [deviceId, email]
          );
        } catch (err) {
          console.error('Failed to update device ID:', err);
        }
      }

    // 4. Check if admin requires MFA
    if (userData.role === 'admin' || userData.role === 'student' ) {
      const otp = generateOTP();
      
      // Save OTP to DB with 5-minute expiry
      await pool.query(
        'UPDATE users SET otp = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE email = ?',
        [otp, email]
      );

      // Send OTP via email
      await transporter.sendMail({
        to: email,
        subject: 'Your Exam Proctoring OTP',
        text: `Your verification code is: ${otp}\nThis code expires in 5 minutes.`
      });

      return res.json({ 
        mfaRequired: true,
        email,
        message: 'OTP sent to admin email' 
      });
    }

    // 5. For students: Generate JWT immediately
    const token = jwt.sign(
      { 
        userId: userData.id, 
        role: userData.role,
        deviceId: userData.device_id // Include device ID in JWT
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      token,
      role: userData.role,
      userId: userData.id
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * @desc    Verify OTP for admin login
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // 1. Check valid OTP (not expired)
    const [user] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND otp = ? AND otp_expiry > NOW()',
      [email, otp]
    );

    if (user.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const userData = user[0];

    // 2. Generate JWT
    const token = jwt.sign(
      { 
        userId: userData.id, 
        role: userData.role,
        deviceId: userData.device_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 3. Clear used OTP
    await pool.query(
      'UPDATE users SET otp = NULL, otp_expiry = NULL WHERE email = ?',
      [email]
    );

    res.json({
      success: true,
      token,
      role: userData.role,
      userId: userData.id
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
};

/**
 * @desc    Get current user profile (protected route)
 * @route   GET /api/auth/me
 * @access  Private
 */


const getMe = async (req, res) => {
  try {
    // Decode the JWT token from the Authorization header
    const token = req.headers['authorization']?.split(' ')[1]; // 'Bearer <token>'
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Decode the token (replace 'your-secret-key' with your actual secret key)
    const decoded = jwt.verify(token, 'ProctoringAI@2025$Secure');
    const userId = decoded.userId;  // Assuming the token contains userId

    // Query the database to fetch user data based on userId
    const [user] = await pool.query(
      'SELECT id, name,  email, role FROM users WHERE id = ?',
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Cannot fetch user data' });
  }
};


/**
 * @desc    Update user password
 * @route   PUT /api/auth/update-password
 * @access  Private
 */

const updatePassword = async (req, res) => {
  try {
   // Decode the JWT token from the Authorization header
   const token = req.headers['authorization']?.split(' ')[1]; // 'Bearer <token>'
   if (!token) {
     return res.status(401).json({ error: 'No token provided' });
   }

   // Decode the token (replace 'your-secret-key' with your actual secret key)
   const decoded = jwt.verify(token, 'ProctoringAI@2025$Secure');
   const userId = decoded.userId;  // Assuming the token contains userId


    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    // Get current password hash
    const [user] = await pool.query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user[0].password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
module.exports = {
  register,
  login,
  verifyOTP,
  getMe,
  updatePassword
};