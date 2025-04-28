// models/User.js
const pool = require('../config/db');

class User {
  static async create({ name, email, password, role }) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async updateDeviceId(email, deviceId) {
    await pool.query(
      'UPDATE users SET device_id = ? WHERE email = ?',
      [deviceId, email]
    );
  }

  static async updateOTP(email, otp) {
    await pool.query(
      'UPDATE users SET otp = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE email = ?',
      [otp, email]
    );
  }

  static async clearOTP(email) {
    await pool.query(
      'UPDATE users SET otp = NULL, otp_expiry = NULL WHERE email = ?',
      [email]
    );
  }

  static async verifyOTP(email, otp) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND otp = ? AND otp_expiry > NOW()',
      [email, otp]
    );
    return rows[0];
  }
}

module.exports = User;