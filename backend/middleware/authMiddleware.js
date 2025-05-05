const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const {  generateSecureHash } = require("../utils/crypto");

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    // 1. Get token from header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        error: "Not authorized - no token provided",
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, "ProctoringAI@2025$Secure"); // Use your actual secret

    // 3. Check if user still exists
    const [user] = await pool.query("SELECT * FROM users WHERE id = ?", [
      decoded.userId,
    ]);

    if (!user.length) {
      return res.status(401).json({
        error: "Not authorized - user no longer exists",
      });
    }

    // 4. Attach user to request
    req.user = {
      id: user[0].id,
      email: user[0].email,
      role: user[0].role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      error: "Not authorized - token failed",
    });
  }
};

// authMiddleware.js - Updated protect middleware
const protectexam = async (req, res, next) => {
  try {
    // 1. Get token from header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    // 2. Verify token
    const decoded = jwt.verify(token, "ProctoringAI@2025$Secure");

    // 3. Get user from database
    const [user] = await pool.query("SELECT * FROM users WHERE id = ?", [
      decoded.userId,
    ]);
    if (!user.length) return res.status(401).json({ error: "User not found" });

    // 4. Get client IP (works in both development and production)
    const clientIP =
      req.ip ||
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.connection?.remoteAddress;

    // 5. Create consistent device fingerprint
    const userAgent = req.headers["user-agent"];
    const deviceFingerprint = `${userAgent}::${clientIP}`.replace(
      /::1$/,
      "::127.0.0.1"
    ); // Normalize localhost IP

    console.log("Current Device Fingerprint:", deviceFingerprint);
    console.log("Stored Device ID:", user[0].device_id);

    // 6. Check if device is recognized
    if (user[0].device_id && user[0].device_id !== deviceFingerprint) {
      console.log("New device detected - requiring verification");
      return res.status(403).json({
        error: "Unrecognized device",
        requiresSecurityQuestion: true,
      });
    }

    // 7. Attach user to request
    req.user = user[0];
    req.deviceFingerprint = deviceFingerprint;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

const verifySecurityQuestion = async (req, res, next) => {
  console.log("--- Verification Started ---");
  console.log("User:", req.user.id);

  const { securityAnswer } = req.body;
  console.log("Received answer:", securityAnswer);

  if (!securityAnswer) {
    return res.status(400).json({ error: "Security answer is required" });
  }

  try {
    const [user] = await pool.query("SELECT password FROM users WHERE id = ?", [
      req.user.id,
    ]);

    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(securityAnswer, user[0].password);
    console.log("Password match:", isMatch);

    if (isMatch) {
      const clientIP =
        req.ip ||
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.connection?.remoteAddress;
      const userAgent = req.headers["user-agent"];
      const deviceFingerprint = `${userAgent}::${clientIP}`.replace(
        /::1$/,
        "::127.0.0.1"
      );

      console.log("Generated Device Fingerprint:", deviceFingerprint);

      await pool.query("UPDATE users SET device_id = ? WHERE id = ?", [
        deviceFingerprint,
        req.user.id,
      ]);

      await pool.query(
        `UPDATE exam_access_log 
         SET status = 'approved' 
         WHERE student_id = ? AND device_hash = ?`,
        [req.user.id, generateSecureHash(deviceFingerprint)]
      );

      return res.status(200).json({
        success: true,
        message: "Device verified",
      }); // Ensure consistent response format
    }

    res.status(403).json({ error: "Incorrect security answer" });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Security verification failed" });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
  verifySecurityQuestion,
  protectexam,
};
